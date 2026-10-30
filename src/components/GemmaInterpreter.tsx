import React, { useState } from 'react';
import { SignalMetrics, GemmaInterpretation } from '../types/eeg';
import {
  Brain,
  Sparkles,
  Send,
  GraduationCap,
  Sliders,
  ShieldAlert,
  Accessibility,
  Eye,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  HelpCircle,
  Cpu,
  RefreshCw,
} from 'lucide-react';

interface GemmaInterpreterProps {
  metrics: SignalMetrics;
  playbackTime: number;
  interpretation: GemmaInterpretation | null;
  isLoadingAnalysis: boolean;
  onTriggerAnalysis: (educationLevel: string) => void;
  educationLevel: 'beginner' | 'student' | 'technician';
  onEducationLevelChange: (level: 'beginner' | 'student' | 'technician') => void;
}

export const GemmaInterpreter: React.FC<GemmaInterpreterProps> = ({
  metrics,
  playbackTime,
  interpretation,
  isLoadingAnalysis,
  onTriggerAnalysis,
  educationLevel,
  onEducationLevelChange,
}) => {
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<
    { sender: 'user' | 'gemma'; text: string; time: string }[]
  >([
    {
      sender: 'gemma',
      text: '¡Hola! Soy Gemma 4 NeuroTech Edition. Estoy conectada al flujo de datos OpenBCI y lista para traducir tus bioseñales a comandos BCI y explicar la neurofisiología subyacente. ¿Qué te gustaría explorar?',
      time: '00:00',
    },
  ]);
  const [isSendingChat, setIsSendingChat] = useState(false);

  // Assistive BCI action list for accessibility
  const bciActions = [
    { id: 'light', label: 'Encender Luz', icon: '💡' },
    { id: 'nurse', label: 'Solicitar Asistencia', icon: '🚨' },
    { id: 'yes_no', label: 'Respuesta: SÍ', icon: '✅' },
    { id: 'water', label: 'Pedir Agua', icon: '💧' },
  ];

  const handleSendChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isSendingChat) return;

    const userText = chatInput.trim();
    const timeStr = playbackTime.toFixed(1) + 's';
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText, time: timeStr }]);
    setChatInput('');
    setIsSendingChat(true);

    try {
      const res = await fetch('/api/chat-signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          context: {
            time: playbackTime,
            metrics,
            educationLevel,
            event: metrics.detectedEvent,
          },
        }),
      });
      const data = await res.json();
      const reply = data.reply || 'No se obtuvo respuesta del modelo.';
      setChatMessages((prev) => [...prev, { sender: 'gemma', text: reply, time: timeStr }]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'gemma',
          text: 'Error de conexión con Gemma 4. Puedes continuar analizando la señal con el motor local.',
          time: timeStr,
        },
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1322] border-l border-slate-800 text-slate-100 overflow-hidden">
      {/* Header with Powered by Google Gemma 4 Badge */}
      <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-violet-950/80 border border-violet-700/60 text-violet-400">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs text-slate-200 tracking-wide">
              GEMMA 4 LIVE INTERPRETER
            </div>
            <div className="text-[10px] text-cyan-400 flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Powered by Google Gemma 4
            </div>
          </div>
        </div>

        {/* Manual Trigger Button */}
        <button
          onClick={() => onTriggerAnalysis(educationLevel)}
          disabled={isLoadingAnalysis}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white shadow-lg transition-all disabled:opacity-50"
        >
          {isLoadingAnalysis ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          <span>Analizar con Gemma 4</span>
        </button>
      </div>

      {/* Educational Level Selector */}
      <div className="px-3 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
          <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
          <span>Pedagogía:</span>
        </div>
        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => onEducationLevelChange('beginner')}
            className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
              educationLevel === 'beginner'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Principiante
          </button>
          <button
            onClick={() => onEducationLevelChange('student')}
            className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
              educationLevel === 'student'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Universitario
          </button>
          <button
            onClick={() => onEducationLevelChange('technician')}
            className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
              educationLevel === 'technician'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Técnico BCI
          </button>
        </div>
      </div>

      {/* Main Content Area: Analysis + BCI Accessibility Module + Chat */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs custom-scrollbar">
        {/* Real-time Analysis Card */}
        {interpretation ? (
          <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-3 shadow-lg space-y-2.5">
            {/* Top row: Event + Confidence */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {interpretation.evento_detectado === 'BLINK' && (
                  <span className="px-2 py-0.5 rounded-md bg-cyan-950/90 text-cyan-300 border border-cyan-700 font-bold text-[11px] flex items-center gap-1">
                    <Eye className="w-3 h-3" /> PARPADEO (BLINK)
                  </span>
                )}
                {interpretation.evento_detectado === 'ALPHA_WAVE' && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-950/90 text-emerald-300 border border-emerald-700 font-bold text-[11px] flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> ONDA ALFA (8-12 Hz)
                  </span>
                )}
                {interpretation.evento_detectado === 'JAW_CLENCH' && (
                  <span className="px-2 py-0.5 rounded-md bg-red-950/90 text-red-300 border border-red-700 font-bold text-[11px] flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> APRETÓN MANDIBULAR (EMG)
                  </span>
                )}
                {interpretation.evento_detectado === 'BASELINE' && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-[11px]">
                    LÍNEA BASE REPOSO
                  </span>
                )}
              </div>

              <div className="text-[10px] text-slate-400 font-mono">
                Confianza: <span className="text-emerald-400 font-bold">{interpretation.confianza_score}%</span>
              </div>
            </div>

            {/* Neural vs Artifact Differentiation */}
            <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800/80">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5">
                Clasificación Fisiológica:
              </div>
              <div className="text-[11px] font-medium text-slate-200">
                {interpretation.es_senal_cerebral_o_artefacto}
              </div>
            </div>

            {/* Educational Explanation by Gemma 4 */}
            <div className="bg-gradient-to-br from-slate-900/80 to-violet-950/30 p-2.5 rounded-lg border border-violet-900/40">
              <div className="flex items-center gap-1 text-[10px] text-violet-400 font-semibold mb-1">
                <Lightbulb className="w-3.5 h-3.5" />
                <span>EXPLICACIÓN DIDÁCTICA ({educationLevel.toUpperCase()})</span>
              </div>
              <p className="text-[11px] text-slate-200 leading-relaxed">
                {interpretation.explicacion_educativa}
              </p>
            </div>

            {/* Assistive BCI Translation */}
            <div className="bg-cyan-950/30 border border-cyan-800/40 p-2.5 rounded-lg">
              <div className="flex items-center gap-1 text-[10px] text-cyan-400 font-semibold mb-1">
                <Accessibility className="w-3.5 h-3.5" />
                <span>TRADUCCIÓN BCI PARA MOVILIDAD REDUCIDA</span>
              </div>
              <div className="text-xs font-semibold text-cyan-200 font-mono">
                {interpretation.traduccion_bci_accesibilidad}
              </div>
              {interpretation.recomendacion_usuario && (
                <div className="mt-1 text-[10px] text-slate-400">
                  Tip: {interpretation.recomendacion_usuario}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-slate-950/50 rounded-xl border border-dashed border-slate-800 p-4 text-center text-slate-400">
            <Cpu className="w-6 h-6 mx-auto mb-1 text-slate-600 animate-pulse" />
            <div className="text-xs font-semibold text-slate-300">Monitoreando Bioseñal OpenBCI</div>
            <div className="text-[10px] text-slate-500 mt-1">
              Presiona "Analizar con Gemma 4" o salta a un evento para recibir el desglose neurocientífico.
            </div>
          </div>
        )}

        {/* BCI Virtual Controller Simulator */}
        <div className="bg-slate-950/70 rounded-xl border border-slate-800 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Accessibility className="w-3.5 h-3.5 text-cyan-400" />
              Conmutador BCI Accesible
            </span>
            <span className="text-[9px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800">
              Activo
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {bciActions.map((act, i) => {
              const isTriggered =
                (metrics.detectedEvent === 'BLINK' && i === 0) ||
                (metrics.detectedEvent === 'ALPHA_WAVE' && i === 1);
              return (
                <div
                  key={act.id}
                  className={`p-2 rounded-lg border text-[11px] flex items-center gap-1.5 transition-all ${
                    isTriggered
                      ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-300 shadow-[0_0_12px_rgba(0,242,254,0.4)]'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300'
                  }`}
                >
                  <span className="text-sm">{act.icon}</span>
                  <span className="truncate">{act.label}</span>
                </div>
              );
            })}
          </div>
          <div className="text-[9px] text-slate-500 italic">
            * Mapeo: Parpadeo = Seleccionar / Alfa = Confirmar / Jaw Clench = Cancelar
          </div>
        </div>

        {/* Interactive Chat with Signal & Gemma 4 */}
        <div className="bg-slate-950/70 rounded-xl border border-slate-800 p-2.5 flex flex-col h-56">
          <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-800 text-slate-300 font-semibold">
            <span>Preguntar a Gemma 4 sobre la señal</span>
            <span className="text-[10px] text-slate-500 font-mono">T: {playbackTime.toFixed(1)}s</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-1 custom-scrollbar text-[11px]">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[90%] px-2.5 py-1.5 rounded-lg ${
                    msg.sender === 'user'
                      ? 'bg-cyan-600 text-white rounded-br-none'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[8px] text-slate-500 mt-0.5 px-1">{msg.time}</span>
              </div>
            ))}
            {isSendingChat && (
              <div className="text-[10px] text-cyan-400 animate-pulse italic">
                Gemma 4 está analizando tu consulta...
              </div>
            )}
          </div>

          <form onSubmit={handleSendChat} className="flex gap-1.5 pt-1.5 border-t border-slate-800">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="¿Por qué parpadea? ¿Qué es alfa?"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={isSendingChat || !chatInput.trim()}
              className="p-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-40 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Ethics & AI Verification Panel */}
        <div className="bg-slate-950/90 rounded-xl border border-slate-800 p-2.5 text-[10px] text-slate-400 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-amber-400">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>ÉTICA Y VERIFICACIÓN NEUROTECNOLÓGICA</span>
          </div>
          <p className="leading-normal text-slate-400">
            Esta aplicación es una herramienta interactiva con fines educativos y de investigación en
            BCI para el <strong>Hacktoberfest Hack Day La Paz x NeuroTech UMSA 2026</strong>. No
            constituye un dispositivo médico de diagnóstico clínico.
          </p>
          <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1 border-t border-slate-800/80">
            <span>OpenBCI 8-Ch Cyton (250 Hz)</span>
            <span>Gemma 4 AI Inference</span>
          </div>
        </div>
      </div>
    </div>
  );
};
