import React, { useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Upload,
  Download,
  Eye,
  Sparkles,
  AlertTriangle,
  Brain,
  Sliders,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { exportToOpenBCIText } from '../utils/demoData';
import { EEGDataset } from '../types/eeg';

interface ControlBarProps {
  dataset: EEGDataset;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  playbackTime: number;
  onSeek: (seconds: number) => void;
  playbackSpeed: number;
  onChangeSpeed: (speed: number) => void;
  onLoadDemo: () => void;
  onFileUpload: (file: File) => void;
  onJumpToEvent: (eventType: 'BLINK' | 'ALPHA_WAVE' | 'JAW_CLENCH') => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  dataset,
  isPlaying,
  onTogglePlay,
  onReset,
  playbackTime,
  onSeek,
  playbackSpeed,
  onChangeSpeed,
  onLoadDemo,
  onFileUpload,
  onJumpToEvent,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const handleDownloadTxt = () => {
    const text = exportToOpenBCIText(dataset);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = dataset.name.endsWith('.txt') ? dataset.name : `${dataset.name}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <header className="bg-slate-950 border-b border-slate-800 text-slate-100 select-none shadow-md z-30">
      {/* Top Banner: Logo, Dataset Info, Powered by Gemma 4 Badge */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 gap-3 border-b border-slate-800/80">
        {/* Logo and Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-violet-500 p-0.5 shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Brain className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-white font-mono">
                NeuroTwin <span className="text-cyan-400">3D</span>
              </h1>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-violet-950/80 text-violet-300 border border-violet-800">
                BCI Explorer
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Hacktoberfest Hack Day La Paz × NeuroTech UMSA 2026
            </p>
          </div>
        </div>

        {/* Center: File Loading & Demo Dataset Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.csv"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-cyan-500 transition-colors shadow-sm"
            title="Subir archivo OpenBCI_GUI-v6-blinks-jawClench-alpha.txt o log EEG"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Subir OpenBCI (.txt)</span>
          </button>

          <button
            onClick={onLoadDemo}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all shadow-sm ${
              dataset.isDemo
                ? 'bg-cyan-950/70 border-cyan-500 text-cyan-300'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Cargar dataset oficial con Parpadeo, Ondas Alfa y Jaw Clench"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Dataset Demo Incorporado</span>
          </button>

          <button
            onClick={handleDownloadTxt}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
            title="Descargar archivo .txt en formato OpenBCI v6"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Badge Powered by Google Gemma 4 */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-slate-200 tracking-wide">
              Powered by <span className="text-cyan-400">Google Gemma 4</span>
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono border border-emerald-800/60">
              Online
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Playback Controls, Timeline Scrubber & Quick Simulation Jumps */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 gap-3 bg-slate-900/60 text-xs">
        {/* Play/Pause, Reset, Speed */}
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlay}
            className={`p-2 rounded-lg font-bold flex items-center justify-center transition-all ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(0,242,254,0.3)]'
            }`}
            title={isPlaying ? 'Pausar reproducción' : 'Reproducir EEG en tiempo real'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          </button>

          <button
            onClick={onReset}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Reiniciar al inicio (0.0s)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Time Display */}
          <div className="font-mono text-xs text-slate-200 px-2 py-1 rounded bg-slate-950 border border-slate-800">
            {playbackTime.toFixed(1)}s / {dataset.durationSeconds.toFixed(1)}s
          </div>

          {/* Speed multiplier */}
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800 text-[10px]">
            <span className="text-slate-400">Vel:</span>
            {[0.5, 1, 2].map((s) => (
              <button
                key={s}
                onClick={() => onChangeSpeed(s)}
                className={`px-1.5 py-0.5 rounded font-mono transition-colors ${
                  playbackSpeed === s
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Timeline Slider with Event Markers */}
        <div className="flex-1 max-w-md mx-3 flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={dataset.durationSeconds}
            step={0.1}
            value={playbackTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
          />
        </div>

        {/* Quick Simulation Event Jump Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-slate-400 font-semibold mr-1">Salto a Eventos:</span>

          <button
            onClick={() => onJumpToEvent('BLINK')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 transition-colors shadow-sm"
            title="Saltar a segundo 7.0 (Parpadeo / EOG Frontal > 120 µV)"
          >
            <Eye className="w-3 h-3 text-cyan-400" />
            <span>Simular Parpadeo</span>
          </button>

          <button
            onClick={() => onJumpToEvent('ALPHA_WAVE')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 transition-colors shadow-sm"
            title="Saltar a segundo 16.0 (Relajación / Ondas Alfa Occipital 8-12 Hz)"
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Simular Onda Alfa</span>
          </button>

          <button
            onClick={() => onJumpToEvent('JAW_CLENCH')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-red-950/70 hover:bg-red-900 border border-red-700 text-red-300 transition-colors shadow-sm"
            title="Saltar a segundo 25.0 (Tensión mandibular / EMG Temporal > 150 µV)"
          >
            <AlertTriangle className="w-3 h-3 text-red-400" />
            <span>Simular Jaw Clench</span>
          </button>
        </div>
      </div>
    </header>
  );
};
