/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { generateOpenBCIDemoDataset } from './utils/demoData';
import { parseOpenBCITextFile } from './utils/eegParser';
import { analyzeEEGWindow } from './utils/dsp';
import { EEGDataset, SignalMetrics, GemmaInterpretation, LobeInfo } from './types/eeg';
import { ControlBar } from './components/ControlBar';
import { EegOscilloscope } from './components/EegOscilloscope';
import { BrainAvatar3D } from './components/BrainAvatar3D';
import { GemmaInterpreter } from './components/GemmaInterpreter';

export default function App() {
  // 1. Core Dataset & Playback State
  const [dataset, setDataset] = useState<EEGDataset>(() => generateOpenBCIDemoDataset());
  const [playbackTime, setPlaybackTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [gain, setGain] = useState<number>(1);
  const [filterNotch, setFilterNotch] = useState<boolean>(true);

  // 2. Pedagogy & Gemma 4 AI State
  const [educationLevel, setEducationLevel] = useState<'beginner' | 'student' | 'technician'>('student');
  const [interpretation, setInterpretation] = useState<GemmaInterpretation | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<boolean>(false);

  // 3. 3D Visor Interaction State
  const [selectedLobe, setSelectedLobe] = useState<string | null>(null);
  const [lobeData, setLobeData] = useState<LobeInfo | null>(null);

  // Last analyzed event type to avoid duplicate continuous calls
  const lastAnalyzedEventRef = useRef<string>('');

  // 4. Compute Current Sliding Window of Samples (~1.5 seconds)
  const windowDurationSec = 1.5;
  const sampleRate = dataset.sampleRate || 250;
  const windowSampleCount = Math.floor(windowDurationSec * sampleRate);

  const currentSampleIdx = Math.floor(playbackTime * sampleRate);
  const startIdx = Math.max(0, currentSampleIdx - windowSampleCount);
  const endIdx = Math.min(dataset.samples.length, currentSampleIdx + 1);

  const currentWindowSamples = dataset.samples.slice(startIdx, endIdx).map((s) => s.channels);

  // Pad if start of recording
  while (currentWindowSamples.length < 32 && dataset.samples.length > 0) {
    currentWindowSamples.push(dataset.samples[0].channels);
  }

  // 5. Run Real-Time DSP Signal Analysis
  const metrics: SignalMetrics = analyzeEEGWindow(currentWindowSamples, sampleRate);

  // 6. Playback Tick Animation Loop
  useEffect(() => {
    if (!isPlaying) return;

    let lastTimestamp = performance.now();
    let animId: number;

    const tick = (now: number) => {
      const deltaSec = (now - lastTimestamp) / 1000;
      lastTimestamp = now;

      setPlaybackTime((prev) => {
        let next = prev + deltaSec * playbackSpeed;
        if (next >= dataset.durationSeconds) {
          next = 0; // Loop playback
        }
        return next;
      });

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, playbackSpeed, dataset.durationSeconds]);

  // 7. Request Gemma 4 Signal Interpretation
  const fetchGemmaAnalysis = useCallback(
    async (evType: string, lvl: string) => {
      setIsLoadingAnalysis(true);
      try {
        const res = await fetch('/api/interpret-signal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: evType,
            metrics,
            educationLevel: lvl,
            timeOffset: playbackTime,
          }),
        });
        const json = await res.json();
        if (json.success && json.data) {
          setInterpretation(json.data);
        }
      } catch (err) {
        console.error('Failed to analyze with Gemma 4:', err);
      } finally {
        setIsLoadingAnalysis(false);
      }
    },
    [metrics, playbackTime]
  );

  // Auto-trigger Gemma 4 analysis when a notable event occurs (debounced)
  useEffect(() => {
    const curEvent = metrics.detectedEvent;
    if (
      curEvent !== 'BASELINE' &&
      curEvent !== lastAnalyzedEventRef.current &&
      !isLoadingAnalysis
    ) {
      lastAnalyzedEventRef.current = curEvent;
      fetchGemmaAnalysis(curEvent, educationLevel);
    }
  }, [metrics.detectedEvent, educationLevel, fetchGemmaAnalysis, isLoadingAnalysis]);

  // 8. Handle Lobe Click in 3D Visor
  const handleSelectLobe = async (lobeKey: string) => {
    if (!lobeKey) {
      setSelectedLobe(null);
      setLobeData(null);
      return;
    }

    setSelectedLobe(lobeKey);
    try {
      const res = await fetch(`/api/lobe-info/${lobeKey}`);
      const data = await res.json();
      if (data.success && data.lobe) {
        setLobeData(data.lobe);
      }
    } catch (e) {
      console.error('Error fetching lobe info:', e);
    }
  };

  // 9. Quick Jump to Key Event
  const handleJumpToEvent = (eventType: 'BLINK' | 'ALPHA_WAVE' | 'JAW_CLENCH') => {
    let targetTime = 0;
    if (eventType === 'BLINK') targetTime = 7.0;
    else if (eventType === 'ALPHA_WAVE') targetTime = 16.0;
    else if (eventType === 'JAW_CLENCH') targetTime = 25.0;

    setPlaybackTime(targetTime);
    setIsPlaying(true);
    fetchGemmaAnalysis(eventType, educationLevel);
  };

  // 10. File Upload Handling
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseOpenBCITextFile(text, file.name);
        setDataset(parsed);
        setPlaybackTime(0);
        setIsPlaying(true);
        lastAnalyzedEventRef.current = '';
        setInterpretation(null);
      } catch (err: any) {
        alert('Error al leer el archivo OpenBCI: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  // Reset to Demo
  const handleLoadDemo = () => {
    setDataset(generateOpenBCIDemoDataset());
    setPlaybackTime(0);
    setIsPlaying(true);
    lastAnalyzedEventRef.current = '';
    setInterpretation(null);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0B0F19] text-slate-100 font-sans">
      {/* 1. Top Control Bar */}
      <ControlBar
        dataset={dataset}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onReset={() => setPlaybackTime(0)}
        playbackTime={playbackTime}
        onSeek={(t) => setPlaybackTime(t)}
        playbackSpeed={playbackSpeed}
        onChangeSpeed={(s) => setPlaybackSpeed(s)}
        onLoadDemo={handleLoadDemo}
        onFileUpload={handleFileUpload}
        onJumpToEvent={handleJumpToEvent}
      />

      {/* 2. Main 3-Panel Dashboard Layout */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Panel: Real-time Oscilloscope (4 cols) */}
        <section className="col-span-12 lg:col-span-4 h-full border-r border-slate-800">
          <EegOscilloscope
            currentWindowSamples={currentWindowSamples}
            sampleRate={sampleRate}
            metrics={metrics}
            playbackTime={playbackTime}
            isPlaying={isPlaying}
            gain={gain}
            onGainChange={setGain}
            filterNotch={filterNotch}
            onFilterNotchToggle={() => setFilterNotch(!filterNotch)}
          />
        </section>

        {/* Center Panel: Three.js 3D Brain Avatar (4 cols) */}
        <section className="col-span-12 lg:col-span-4 h-full relative">
          <BrainAvatar3D
            detectedEvent={metrics.detectedEvent}
            onSelectLobe={handleSelectLobe}
            selectedLobe={selectedLobe}
            lobeData={lobeData}
          />
        </section>

        {/* Right Panel: Gemma 4 Live Interpreter & BCI (4 cols) */}
        <section className="col-span-12 lg:col-span-4 h-full border-l border-slate-800">
          <GemmaInterpreter
            metrics={metrics}
            playbackTime={playbackTime}
            interpretation={interpretation}
            isLoadingAnalysis={isLoadingAnalysis}
            onTriggerAnalysis={(lvl) => fetchGemmaAnalysis(metrics.detectedEvent, lvl)}
            educationLevel={educationLevel}
            onEducationLevelChange={(lvl) => {
              setEducationLevel(lvl);
              fetchGemmaAnalysis(metrics.detectedEvent, lvl);
            }}
          />
        </section>
      </main>
    </div>
  );
}
