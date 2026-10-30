import { EEGDataset, EEGSample } from '../types/eeg';

/**
 * Generates a realistic 35-second 8-channel EEG recording mimicking OpenBCI Cyton v6.
 * Contains authentic event intervals:
 * - 0s - 6s: Baseline (10-25 µV pink noise + low beta)
 * - 6.5s - 7.5s: Blink 1 (Fp1/Fp2 ocular dipole spike > 120 µV)
 * - 8.5s - 9.3s: Blink 2 (Double-blink trigger for BCI selection)
 * - 13s - 21s: Alpha Wave Burst (8-12 Hz synchronization in O1/O2, eyes closed state)
 * - 23s - 28.5s: Jaw Clench (Massive EMG broadband burst > 150 µV in T3/T4)
 * - 30s - 35s: Normal baseline rest
 */
export function generateOpenBCIDemoDataset(): EEGDataset {
  const sampleRate = 250; // 250 Hz
  const durationSeconds = 35;
  const totalSamples = sampleRate * durationSeconds;
  const samples: EEGSample[] = [];

  const baseStartTime = Date.now() - durationSeconds * 1000;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate; // time in seconds
    const channels = [0, 0, 0, 0, 0, 0, 0, 0];

    // Background pink noise + baseline beta rhythm (13-20 Hz)
    const noise = () => (Math.random() - 0.5) * 8 + (Math.random() - 0.5) * 4;
    const beta1 = Math.sin(2 * Math.PI * 18 * t) * 6;
    const beta2 = Math.sin(2 * Math.PI * 14 * t + 1.2) * 5;
    const theta = Math.sin(2 * Math.PI * 6.5 * t) * 4;

    for (let ch = 0; ch < 8; ch++) {
      channels[ch] = noise() + (ch % 2 === 0 ? beta1 : beta2) + theta;
    }

    let annotatedEvent: 'BLINK' | 'ALPHA_WAVE' | 'JAW_CLENCH' | 'BASELINE' = 'BASELINE';

    // 1. BLINK 1 (6.5s - 7.3s)
    if (t >= 6.5 && t <= 7.3) {
      annotatedEvent = 'BLINK';
      const dt = t - 6.5;
      const duration = 0.8;
      // Biphasic ocular dipole curve: large positive peak followed by minor undershoot
      const bellCurve = Math.sin((Math.PI * dt) / duration);
      const blinkPeak = Math.pow(Math.sin((Math.PI * dt) / duration), 2) * 135;
      const rebound = -Math.sin((2 * Math.PI * dt) / duration) * 25;
      const blinkSig = blinkPeak + rebound;

      channels[0] += blinkSig; // Fp1
      channels[1] += blinkSig * 0.95; // Fp2
      channels[2] += blinkSig * 0.2; // C3 (volume conduction)
      channels[3] += blinkSig * 0.2; // C4
    }

    // 2. BLINK 2 (8.5s - 9.3s) - Double-blink event
    else if (t >= 8.5 && t <= 9.3) {
      annotatedEvent = 'BLINK';
      const dt = t - 8.5;
      const duration = 0.8;
      const blinkPeak = Math.pow(Math.sin((Math.PI * dt) / duration), 2) * 128;
      const rebound = -Math.sin((2 * Math.PI * dt) / duration) * 22;
      const blinkSig = blinkPeak + rebound;

      channels[0] += blinkSig;
      channels[1] += blinkSig * 0.96;
      channels[2] += blinkSig * 0.18;
      channels[3] += blinkSig * 0.18;
    }

    // 3. ALPHA WAVE BURST (13.0s - 21.0s) - Occipital synchronization 10.2 Hz
    else if (t >= 13.0 && t <= 21.0) {
      annotatedEvent = 'ALPHA_WAVE';
      const dt = t - 13.0;
      const totalDur = 8.0;
      // Envelope waxing and waning
      const envelope = Math.sin((Math.PI * dt) / totalDur);
      const alphaFreq = 10.2;
      // Occipital spindles
      const alpha1 = Math.sin(2 * Math.PI * alphaFreq * t) * (42 * envelope) + Math.sin(2 * Math.PI * (alphaFreq - 0.5) * t) * (10 * envelope);
      const alpha2 = Math.sin(2 * Math.PI * alphaFreq * t + 0.3) * (45 * envelope) + Math.sin(2 * Math.PI * (alphaFreq + 0.4) * t) * (9 * envelope);

      channels[6] += alpha1; // O1
      channels[7] += alpha2; // O2
      channels[2] += alpha1 * 0.25; // C3
      channels[3] += alpha2 * 0.25; // C4
      // Slight reduction of frontal beta during relaxation
      channels[0] *= 0.7;
      channels[1] *= 0.7;
    }

    // 4. JAW CLENCH (23.0s - 28.5s) - Intense EMG artifact on Temporal T3/T4
    else if (t >= 23.0 && t <= 28.5) {
      annotatedEvent = 'JAW_CLENCH';
      const dt = t - 23.0;
      const totalDur = 5.5;
      // Rising and falling muscle exertion envelope
      const emgEnv = Math.sin((Math.PI * dt) / totalDur);
      // High-frequency broadband sum
      const emg1 =
        ((Math.random() - 0.5) * 140 +
          Math.sin(2 * Math.PI * 45 * t) * 60 +
          Math.sin(2 * Math.PI * 78 * t) * 55 +
          Math.sin(2 * Math.PI * 110 * t) * 45) *
        emgEnv;
      const emg2 =
        ((Math.random() - 0.5) * 150 +
          Math.sin(2 * Math.PI * 48 * t) * 65 +
          Math.sin(2 * Math.PI * 82 * t) * 50 +
          Math.sin(2 * Math.PI * 115 * t) * 40) *
        emgEnv;

      channels[4] += emg1; // T3
      channels[5] += emg2; // T4
      // Spreads to other scalp channels through volume conduction
      channels[0] += emg1 * 0.25;
      channels[1] += emg2 * 0.25;
      channels[2] += emg1 * 0.35;
      channels[3] += emg2 * 0.35;
      channels[6] += emg1 * 0.2;
      channels[7] += emg2 * 0.2;
    }

    // Round channels to 2 decimal places for clean representation
    for (let c = 0; c < 8; c++) {
      channels[c] = Math.round(channels[c] * 100) / 100;
    }

    samples.push({
      index: i % 256,
      channels,
      timestamp: baseStartTime + Math.round(t * 1000),
      annotatedEvent,
    });
  }

  return {
    name: 'OpenBCI_GUI-v6-blinks-jawClench-alpha.txt (Demo Oficial)',
    sampleRate,
    samples,
    durationSeconds,
    isDemo: true,
    totalSamples,
  };
}

/**
 * Exports an EEGDataset into the exact text format created by OpenBCI GUI v6.
 */
export function exportToOpenBCIText(dataset: EEGDataset): string {
  const header = [
    '%OpenBCI Raw EEG Data',
    '%Number of channels = 8',
    `%Sample Rate = ${dataset.sampleRate.toFixed(1)} Hz`,
    '%Board = OpenBCI_Cyton',
    '%Data format = CSV',
    '%Columns: Sample Index, EXG Channel 0, EXG Channel 1, EXG Channel 2, EXG Channel 3, EXG Channel 4, EXG Channel 5, EXG Channel 6, EXG Channel 7, Accel 0, Accel 1, Accel 2, Timestamp',
  ].join('\n');

  const rows = dataset.samples.map((s) => {
    const chStr = s.channels.map((c) => c.toFixed(2)).join(', ');
    return `${s.index}, ${chStr}, 0.00, 0.00, 1.00, ${s.timestamp}`;
  });

  return `${header}\n${rows.join('\n')}`;
}
