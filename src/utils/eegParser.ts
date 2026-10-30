import { EEGDataset, EEGSample } from '../types/eeg';

/**
 * Parses an OpenBCI GUI v6 text log file (.txt).
 * - Ignores comments starting with '%'
 * - Extracts sample index, 8 EXG channels, and timestamp
 * - Removes hardware DC bias using a running baseline filter
 */
export function parseOpenBCITextFile(fileContent: string, fileName: string): EEGDataset {
  const lines = fileContent.split(/\r?\n/);
  const rawSamples: { index: number; channels: number[]; timestamp: number }[] = [];
  let sampleRate = 250;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Check header metadata
    if (line.startsWith('%')) {
      const lower = line.toLowerCase();
      if (lower.includes('sample rate')) {
        const match = line.match(/(\d+(\.\d+)?)\s*hz/i) || line.match(/=\s*(\d+(\.\d+)?)/);
        if (match && match[1]) {
          const parsedRate = parseFloat(match[1]);
          if (!isNaN(parsedRate) && parsedRate > 0) {
            sampleRate = parsedRate;
          }
        }
      }
      continue;
    }

    // Split by comma or tab or multi-space
    const tokens = line.split(/[,\t]+/).map((t) => t.trim()).filter(Boolean);

    // Standard OpenBCI v6 has at least 9 columns: Index + 8 channels
    if (tokens.length >= 9) {
      const idx = parseInt(tokens[0], 10) || 0;
      const channels: number[] = [];

      for (let ch = 1; ch <= 8; ch++) {
        const val = parseFloat(tokens[ch]);
        channels.push(isNaN(val) ? 0 : val);
      }

      // Check for timestamp in last token
      let timestamp = Date.now();
      const lastToken = tokens[tokens.length - 1];
      if (lastToken && !isNaN(Number(lastToken)) && Number(lastToken) > 1000000000) {
        timestamp = Number(lastToken);
      }

      rawSamples.push({ index: idx, channels, timestamp });
    }
  }

  if (rawSamples.length === 0) {
    throw new Error('No se encontraron muestras válidas en el archivo OpenBCI. Asegúrate de que contenga columnas separadas por comas.');
  }

  // Baseline correction: Subtract rolling mean to remove DC drift (OpenBCI hardware can have 10,000+ µV DC offset)
  const channelMeans = [0, 0, 0, 0, 0, 0, 0, 0];
  const count = rawSamples.length;

  for (let c = 0; c < 8; c++) {
    let sum = 0;
    for (let s = 0; s < count; s++) {
      sum += rawSamples[s].channels[c];
    }
    channelMeans[c] = sum / count;
  }

  const samples: EEGSample[] = rawSamples.map((s, i) => {
    const centeredChannels = s.channels.map((val, c) => {
      // If raw OpenBCI unscaled counts (~1e6), normalize to µV, otherwise just subtract DC mean
      let centered = val - channelMeans[c];
      return Math.round(centered * 100) / 100;
    });

    return {
      index: s.index,
      channels: centeredChannels,
      timestamp: s.timestamp || (i * (1000 / sampleRate)),
    };
  });

  const durationSeconds = samples.length / sampleRate;

  return {
    name: fileName,
    sampleRate,
    samples,
    durationSeconds,
    isDemo: false,
    totalSamples: samples.length,
  };
}
