export interface EEGChannelConfig {
  id: number;
  name: string;
  label: string;
  color: string;
  region: 'frontal' | 'central' | 'temporal' | 'occipital';
  description: string;
}

export const OPENBCI_CHANNELS: EEGChannelConfig[] = [
  { id: 0, name: 'Ch 1', label: 'Fp1 (Frontal Izq)', color: '#00F2FE', region: 'frontal', description: 'Corteza prefrontal / Detección EOG' },
  { id: 1, name: 'Ch 2', label: 'Fp2 (Frontal Der)', color: '#38BDF8', region: 'frontal', description: 'Corteza prefrontal / Detección EOG' },
  { id: 2, name: 'Ch 3', label: 'C3 (Central Izq)', color: '#818CF8', region: 'central', description: 'Corteza sensorimotora' },
  { id: 3, name: 'Ch 4', label: 'C4 (Central Der)', color: '#A78BFA', region: 'central', description: 'Corteza sensorimotora' },
  { id: 4, name: 'Ch 5', label: 'T3 (Temporal Izq)', color: '#F59E0B', region: 'temporal', description: 'Músculo masetero / Artefacto EMG' },
  { id: 5, name: 'Ch 6', label: 'T4 (Temporal Der)', color: '#EF4444', region: 'temporal', description: 'Músculo masetero / Artefacto EMG' },
  { id: 6, name: 'Ch 7', label: 'O1 (Occipital Izq)', color: '#10B981', region: 'occipital', description: 'Corteza visual / Ritmo Alfa 8-12 Hz' },
  { id: 7, name: 'Ch 8', label: 'O2 (Occipital Der)', color: '#A855F7', region: 'occipital', description: 'Corteza visual / Ritmo Alfa 8-12 Hz' },
];

export interface EEGSample {
  index: number;
  channels: number[]; // 8 channels in µV
  timestamp: number;
  annotatedEvent?: 'BLINK' | 'ALPHA_WAVE' | 'JAW_CLENCH' | 'BASELINE';
}

export interface EEGDataset {
  name: string;
  sampleRate: number;
  samples: EEGSample[];
  durationSeconds: number;
  isDemo: boolean;
  totalSamples: number;
}

export interface BandPowers {
  delta: number; // 0.5 - 4 Hz
  theta: number; // 4 - 8 Hz
  alpha: number; // 8 - 12 Hz
  beta: number;  // 13 - 30 Hz
  gamma: number; // 30 - 50 Hz
}

export interface SignalMetrics {
  fpPeakUv: number;
  alphaPowerRatio: number;
  temporalVariance: number;
  dominantHz: number;
  bandPowers: BandPowers;
  detectedEvent: 'BASELINE' | 'BLINK' | 'ALPHA_WAVE' | 'JAW_CLENCH';
  confidence: number;
}

export interface GemmaInterpretation {
  evento_detectado: 'BLINK' | 'ALPHA_WAVE' | 'JAW_CLENCH' | 'BASELINE';
  es_senal_cerebral_o_artefacto: string;
  explicacion_educativa: string;
  traduccion_bci_accesibilidad: string;
  confianza_score: number;
  recomendacion_usuario?: string;
  modelo_utilizado?: string;
}

export interface LobeInfo {
  name: string;
  functions: string;
  eegCorrelate: string;
  bciApplication: string;
  color: string;
}
