import React, { useEffect, useRef, useState } from 'react';
import { OPENBCI_CHANNELS, SignalMetrics } from '../types/eeg';
import { Activity, Zap, Eye, Sparkles, AlertTriangle, Sliders, BarChart2 } from 'lucide-react';

interface EegOscilloscopeProps {
  currentWindowSamples: number[][]; // [sampleCount][8]
  sampleRate: number;
  metrics: SignalMetrics;
  playbackTime: number;
  isPlaying: boolean;
  gain: number;
  onGainChange: (gain: number) => void;
  filterNotch: boolean;
  onFilterNotchToggle: () => void;
}

export const EegOscilloscope: React.FC<EegOscilloscopeProps> = ({
  currentWindowSamples,
  sampleRate,
  metrics,
  playbackTime,
  isPlaying,
  gain,
  onGainChange,
  filterNotch,
  onFilterNotchToggle,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Resize canvas according to container
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        canvasRef.current.width = clientWidth * window.devicePixelRatio;
        canvasRef.current.height = clientHeight * window.devicePixelRatio;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 60 FPS Render Loop for Oscilloscope
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const dpr = window.devicePixelRatio || 1;

    ctx.save();
    // Dark background #0B0F19
    ctx.fillStyle = '#0B0F19';
    ctx.fillRect(0, 0, width, height);

    const numChannels = 8;
    const rowHeight = height / numChannels;

    // Draw horizontal grid lines & channel separators
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1 * dpr;

    for (let c = 0; c < numChannels; c++) {
      const yMid = c * rowHeight + rowHeight / 2;

      // Channel baseline (dashed)
      ctx.beginPath();
      ctx.setLineDash([4 * dpr, 6 * dpr]);
      ctx.moveTo(0, yMid);
      ctx.lineTo(width, yMid);
      ctx.stroke();
      ctx.setLineDash([]);

      // Row separator
      if (c > 0) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.moveTo(0, c * rowHeight);
        ctx.lineTo(width, c * rowHeight);
        ctx.stroke();
      }
    }

    // Vertical time grid lines (every 250ms = 0.25s)
    const windowDuration = currentWindowSamples.length / sampleRate || 1.5;
    const numVerticalBars = Math.floor(windowDuration * 4);
    for (let v = 1; v < numVerticalBars; v++) {
      const x = (v / numVerticalBars) * width;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Draw EEG channel traces
    const sampleCount = currentWindowSamples.length;
    if (sampleCount > 1) {
      for (let ch = 0; ch < numChannels; ch++) {
        const chConfig = OPENBCI_CHANNELS[ch];
        const yCenter = ch * rowHeight + rowHeight / 2;

        ctx.strokeStyle = chConfig.color;
        ctx.lineWidth = 1.8 * dpr;
        ctx.beginPath();

        // Glow effect for active event channels
        if (
          (metrics.detectedEvent === 'BLINK' && (ch === 0 || ch === 1)) ||
          (metrics.detectedEvent === 'ALPHA_WAVE' && (ch === 6 || ch === 7)) ||
          (metrics.detectedEvent === 'JAW_CLENCH' && (ch === 4 || ch === 5))
        ) {
          ctx.shadowColor = chConfig.color;
          ctx.shadowBlur = 10 * dpr;
        } else {
          ctx.shadowBlur = 0;
        }

        // Scale factor: typically ±100 µV fits nicely within rowHeight
        const uvScale = (rowHeight * 0.38 * gain) / 100;

        for (let i = 0; i < sampleCount; i++) {
          const x = (i / (sampleCount - 1)) * width;
          const val = currentWindowSamples[i][ch];
          const y = yCenter - val * uvScale;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw Channel Name & Voltage Label at left edge
        ctx.fillStyle = chConfig.color;
        ctx.font = `bold ${10 * dpr}px ui-monospace, SFMono-Regular, monospace`;
        ctx.fillText(chConfig.label.split(' ')[0], 10 * dpr, ch * rowHeight + 16 * dpr);

        // Current instantaneous microvolt readout
        const lastVal = sampleCount > 0 ? currentWindowSamples[sampleCount - 1][ch] : 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.font = `${9 * dpr}px ui-monospace, SFMono-Regular, monospace`;
        ctx.fillText(`${lastVal.toFixed(1)} µV`, 65 * dpr, ch * rowHeight + 16 * dpr);

        // Highlight event tags directly on channel row
        if (metrics.detectedEvent === 'BLINK' && (ch === 0 || ch === 1)) {
          ctx.fillStyle = 'rgba(0, 242, 254, 0.15)';
          ctx.fillRect(width - 110 * dpr, ch * rowHeight + 4 * dpr, 100 * dpr, 18 * dpr);
          ctx.fillStyle = '#00F2FE';
          ctx.font = `bold ${9 * dpr}px sans-serif`;
          ctx.fillText('⚡ BLINK EOG', width - 102 * dpr, ch * rowHeight + 16 * dpr);
        } else if (metrics.detectedEvent === 'ALPHA_WAVE' && (ch === 6 || ch === 7)) {
          ctx.fillStyle = 'rgba(16, 185, 129, 0.18)';
          ctx.fillRect(width - 120 * dpr, ch * rowHeight + 4 * dpr, 110 * dpr, 18 * dpr);
          ctx.fillStyle = '#10B981';
          ctx.font = `bold ${9 * dpr}px sans-serif`;
          ctx.fillText('✨ ALPHA 10 Hz', width - 112 * dpr, ch * rowHeight + 16 * dpr);
        } else if (metrics.detectedEvent === 'JAW_CLENCH' && (ch === 4 || ch === 5)) {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
          ctx.fillRect(width - 120 * dpr, ch * rowHeight + 4 * dpr, 110 * dpr, 18 * dpr);
          ctx.fillStyle = '#EF4444';
          ctx.font = `bold ${9 * dpr}px sans-serif`;
          ctx.fillText('⚠️ JAW CLENCH', width - 112 * dpr, ch * rowHeight + 16 * dpr);
        }
      }
    }

    // Playhead line at right edge
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.moveTo(width - 2, 0);
    ctx.lineTo(width - 2, height);
    ctx.stroke();

    ctx.restore();
  }, [currentWindowSamples, sampleRate, metrics, gain]);

  return (
    <div className="flex flex-col h-full bg-[#0d1322] border-r border-slate-800 text-slate-100 select-none">
      {/* Oscilloscope Header / Controls */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold tracking-wider text-slate-200">OSCILOSCOPIO EEG OPENBCI (8 CH)</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-950/70 border border-cyan-800/60 text-cyan-300 font-mono">
            {sampleRate} Hz
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Gain Selector */}
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            <Sliders className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] text-slate-400">Ganancia:</span>
            {[0.5, 1, 2, 4].map((g) => (
              <button
                key={g}
                onClick={() => onGainChange(g)}
                className={`px-1 rounded text-[10px] font-mono transition-colors ${
                  gain === g ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {g}x
              </button>
            ))}
          </div>

          {/* Notch Filter Toggle */}
          <button
            onClick={onFilterNotchToggle}
            title="Filtro Notch 50/60Hz para supresión de ruido de red eléctrica"
            className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${
              filterNotch
                ? 'bg-emerald-950/80 border-emerald-600/70 text-emerald-300'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            Notch 60Hz: {filterNotch ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Main Signal Display + Side FFT Panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Real-time Oscilloscope Canvas */}
        <div ref={containerRef} className="flex-1 relative h-full">
          <canvas ref={canvasRef} className="w-full h-full block" />

          {/* Microvolt Scale Indicator */}
          <div className="absolute bottom-2 left-2 pointer-events-none text-[9px] font-mono text-slate-500 bg-slate-950/70 px-2 py-1 rounded border border-slate-800/60">
            Escala: ±100 µV / Ventana: ~1.5s
          </div>
        </div>

        {/* Real-Time FFT Spectral Power Bar Chart */}
        <div className="w-28 bg-slate-950/95 border-l border-slate-800 p-2 flex flex-col justify-between text-[10px]">
          <div className="flex items-center gap-1 text-slate-300 font-semibold mb-1">
            <BarChart2 className="w-3.5 h-3.5 text-violet-400" />
            <span>ESPECTRO FFT</span>
          </div>

          {/* Dominant Frequency Meter */}
          <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800 text-center mb-2">
            <div className="text-[9px] text-slate-400">Freq. Dominante</div>
            <div className="text-sm font-bold font-mono text-cyan-400">
              {metrics.dominantHz} <span className="text-[10px] text-slate-400">Hz</span>
            </div>
          </div>

          {/* Frequency Bands Bars */}
          <div className="flex-1 flex flex-col justify-around py-1 gap-1.5">
            {/* Delta 0.5-4 Hz */}
            <div>
              <div className="flex justify-between text-[9px] text-slate-400">
                <span>Delta (0.5-4Hz)</span>
                <span className="font-mono">{metrics.bandPowers.delta.toFixed(0)}%</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                <div
                  className="h-full bg-blue-500 transition-all duration-150"
                  style={{ width: `${metrics.bandPowers.delta}%` }}
                />
              </div>
            </div>

            {/* Theta 4-8 Hz */}
            <div>
              <div className="flex justify-between text-[9px] text-slate-400">
                <span>Theta (4-8Hz)</span>
                <span className="font-mono">{metrics.bandPowers.theta.toFixed(0)}%</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                <div
                  className="h-full bg-indigo-400 transition-all duration-150"
                  style={{ width: `${metrics.bandPowers.theta}%` }}
                />
              </div>
            </div>

            {/* Alpha 8-12 Hz - Emphasized when active */}
            <div
              className={`p-1 rounded transition-all ${
                metrics.detectedEvent === 'ALPHA_WAVE'
                  ? 'bg-emerald-950/80 border border-emerald-500/50'
                  : ''
              }`}
            >
              <div className="flex justify-between text-[9px] font-semibold text-emerald-400">
                <span>Alpha (8-12Hz)</span>
                <span className="font-mono">{metrics.bandPowers.alpha.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                <div
                  className={`h-full transition-all duration-150 ${
                    metrics.detectedEvent === 'ALPHA_WAVE'
                      ? 'bg-emerald-400 shadow-[0_0_8px_#10B981]'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${metrics.bandPowers.alpha}%` }}
                />
              </div>
            </div>

            {/* Beta 13-30 Hz */}
            <div>
              <div className="flex justify-between text-[9px] text-slate-400">
                <span>Beta (13-30Hz)</span>
                <span className="font-mono">{metrics.bandPowers.beta.toFixed(0)}%</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                <div
                  className="h-full bg-amber-400 transition-all duration-150"
                  style={{ width: `${metrics.bandPowers.beta}%` }}
                />
              </div>
            </div>

            {/* Gamma 30-50 Hz */}
            <div
              className={`p-1 rounded transition-all ${
                metrics.detectedEvent === 'JAW_CLENCH'
                  ? 'bg-red-950/70 border border-red-500/50'
                  : ''
              }`}
            >
              <div className="flex justify-between text-[9px] text-slate-400">
                <span className={metrics.detectedEvent === 'JAW_CLENCH' ? 'text-red-400 font-bold' : ''}>
                  Gamma (30-50Hz)
                </span>
                <span className="font-mono">{metrics.bandPowers.gamma.toFixed(0)}%</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                <div
                  className={`h-full transition-all duration-150 ${
                    metrics.detectedEvent === 'JAW_CLENCH' ? 'bg-red-500 shadow-[0_0_6px_#ef4444]' : 'bg-purple-500'
                  }`}
                  style={{ width: `${metrics.bandPowers.gamma}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Real-Time Event Status Tag */}
          <div className="mt-2 pt-2 border-t border-slate-800 text-center">
            {metrics.detectedEvent === 'BLINK' && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800 animate-pulse">
                <Eye className="w-3 h-3" /> PARPADEO
              </span>
            )}
            {metrics.detectedEvent === 'ALPHA_WAVE' && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-300 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-700 animate-pulse">
                <Sparkles className="w-3 h-3" /> ONDA ALFA
              </span>
            )}
            {metrics.detectedEvent === 'JAW_CLENCH' && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-red-300 bg-red-950/80 px-1.5 py-0.5 rounded border border-red-700 animate-pulse">
                <AlertTriangle className="w-3 h-3" /> JAW CLENCH
              </span>
            )}
            {metrics.detectedEvent === 'BASELINE' && (
              <span className="text-[9px] text-slate-500">Reposo Basal</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
