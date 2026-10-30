import { BandPowers, SignalMetrics } from '../types/eeg';

/**
 * Computes band power and metrics over a sliding window of EEG samples (typically 1 to 2 seconds).
 * Sample rate: default 250 Hz.
 */
export function analyzeEEGWindow(
  samples: number[][], // array of [ch0..ch7] for each time point in window
  sampleRate: number = 250
): SignalMetrics {
  const windowSize = samples.length;
  if (windowSize < 16) {
    return {
      fpPeakUv: 0,
      alphaPowerRatio: 0,
      temporalVariance: 0,
      dominantHz: 10,
      bandPowers: { delta: 20, theta: 15, alpha: 30, beta: 25, gamma: 10 },
      detectedEvent: 'BASELINE',
      confidence: 90,
    };
  }

  // Channel indices:
  // 0: Fp1, 1: Fp2 (Frontal)
  // 4: T3, 5: T4 (Temporal / Jaw EMG)
  // 6: O1, 7: O2 (Occipital / Alpha)

  // 1. Peak-to-peak amplitude in Frontal channels (Fp1, Fp2)
  let fpMin = Infinity;
  let fpMax = -Infinity;
  for (let i = 0; i < windowSize; i++) {
    const s = samples[i];
    const fpAvg = (s[0] + s[1]) / 2;
    if (fpAvg < fpMin) fpMin = fpAvg;
    if (fpAvg > fpMax) fpMax = fpAvg;
  }
  const fpPeakUv = Math.abs(fpMax - fpMin);

  // 2. High-frequency variance in Temporal channels (T3, T4)
  let tSum = 0;
  let tSumSq = 0;
  let tDiffSum = 0;
  for (let i = 0; i < windowSize; i++) {
    const s = samples[i];
    const tVal = (s[4] + s[5]) / 2;
    tSum += tVal;
    tSumSq += tVal * tVal;
    if (i > 0) {
      const prevT = (samples[i - 1][4] + samples[i - 1][5]) / 2;
      tDiffSum += Math.abs(tVal - prevT);
    }
  }
  const tMean = tSum / windowSize;
  const temporalVariance = Math.sqrt(Math.max(0, tSumSq / windowSize - tMean * tMean));
  const temporalHighFreqRate = tDiffSum / windowSize;

  // 3. FFT / Power Spectral Density on Occipital channels (O1, O2)
  // We compute frequency bins from 0.5 Hz to 45 Hz using Goertzel / discrete Fourier transform
  const oSignals: number[] = new Array(windowSize);
  for (let i = 0; i < windowSize; i++) {
    oSignals[i] = (samples[i][6] + samples[i][7]) / 2;
  }

  // Remove DC
  let oMean = 0;
  for (let i = 0; i < windowSize; i++) oMean += oSignals[i];
  oMean /= windowSize;
  for (let i = 0; i < windowSize; i++) oSignals[i] -= oMean;

  // Calculate power in standard EEG bands:
  // Delta: 0.5 - 4 Hz
  // Theta: 4 - 8 Hz
  // Alpha: 8 - 12 Hz
  // Beta: 13 - 30 Hz
  // Gamma: 30 - 48 Hz
  let pDelta = 0;
  let pTheta = 0;
  let pAlpha = 0;
  let pBeta = 0;
  let pGamma = 0;
  let totalPower = 0.0001;

  let maxBinPower = 0;
  let dominantHz = 10;

  // Evaluate discrete frequencies at 1 Hz resolution
  for (let freq = 1; freq <= 45; freq += 1) {
    let re = 0;
    let im = 0;
    const omega = (2 * Math.PI * freq) / sampleRate;
    for (let n = 0; n < windowSize; n++) {
      // Hanning window to prevent spectral leakage
      const w = 0.5 * (1 - Math.cos((2 * Math.PI * n) / (windowSize - 1)));
      const sampleVal = oSignals[n] * w;
      re += sampleVal * Math.cos(omega * n);
      im -= sampleVal * Math.sin(omega * n);
    }
    const power = (re * re + im * im) / windowSize;
    totalPower += power;

    if (power > maxBinPower) {
      maxBinPower = power;
      dominantHz = freq;
    }

    if (freq >= 1 && freq <= 3) pDelta += power;
    else if (freq >= 4 && freq <= 7) pTheta += power;
    else if (freq >= 8 && freq <= 12) pAlpha += power;
    else if (freq >= 13 && freq <= 29) pBeta += power;
    else if (freq >= 30 && freq <= 45) pGamma += power;
  }

  // Normalize band powers to percentages
  const bandPowers: BandPowers = {
    delta: Math.min(100, Math.max(5, (pDelta / totalPower) * 100)),
    theta: Math.min(100, Math.max(5, (pTheta / totalPower) * 100)),
    alpha: Math.min(100, Math.max(5, (pAlpha / totalPower) * 100)),
    beta: Math.min(100, Math.max(5, (pBeta / totalPower) * 100)),
    gamma: Math.min(100, Math.max(5, (pGamma / totalPower) * 100)),
  };

  const alphaPowerRatio = bandPowers.alpha / (bandPowers.beta + bandPowers.theta + 1);

  // 4. Decision Rule Engine for Event Classification:
  let detectedEvent: 'BASELINE' | 'BLINK' | 'ALPHA_WAVE' | 'JAW_CLENCH' = 'BASELINE';
  let confidence = 92;

  // Temporal EMG check (Jaw Clench): High variance & strong high-frequency jitter
  if (temporalVariance > 45 || temporalHighFreqRate > 18) {
    detectedEvent = 'JAW_CLENCH';
    confidence = Math.min(99.5, 94 + (temporalVariance / 100) * 5);
  }
  // Frontal EOG check (Blink): High amplitude spike in Fp1/Fp2
  else if (fpPeakUv > 85) {
    detectedEvent = 'BLINK';
    confidence = Math.min(99.2, 92 + (fpPeakUv / 150) * 6);
  }
  // Occipital Alpha check: Dominant 8-12 Hz rhythm & high alpha ratio
  else if (bandPowers.alpha > 38 && dominantHz >= 8 && dominantHz <= 12) {
    detectedEvent = 'ALPHA_WAVE';
    confidence = Math.min(98.8, 91 + (bandPowers.alpha / 50) * 7);
  }

  return {
    fpPeakUv: Math.round(fpPeakUv * 10) / 10,
    alphaPowerRatio: Math.round(alphaPowerRatio * 100) / 100,
    temporalVariance: Math.round(temporalVariance * 10) / 10,
    dominantHz,
    bandPowers,
    detectedEvent,
    confidence: Math.round(confidence * 10) / 10,
  };
}
