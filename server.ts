import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Google GenAI client if GEMINI_API_KEY is available
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
  }
}

// Fallback neuro-expert response generator if API key is not configured or fails
function generateSimulatedGemmaResponse(
  eventType: string,
  metrics: Record<string, any>,
  educationLevel: string
) {
  const isBeginner = educationLevel === 'beginner';
  const isTechnician = educationLevel === 'technician';

  let event_detectado = eventType || 'BASELINE';
  let es_senal = 'Actividad cerebral';
  let explicacion = '';
  let bci_cmd = 'Modo reposo / Monitoreo activo';
  let confianza = 95.8;

  if (eventType === 'BLINK') {
    es_senal = 'Artefacto fisiológico ocular (EOG / Músculo Orbicular)';
    confianza = 98.4;
    bci_cmd = 'Comando BCI: [SELECCIONAR / SIGUIENTE OPCIÓN EN TECLADO VIRTUAL]';
    if (isBeginner) {
      explicacion =
        '¡Detecté un parpadeo de ojos! El ojo humano actúa como una pequeña batería con el polo positivo adelante y el negativo atrás. Cuando los párpados caen y los ojos se mueven ligeramente, generan una chispa eléctrica enorme que los sensores frontales (Fp1 y Fp2) captan al instante.';
    } else if (isTechnician) {
      explicacion =
        'Artefacto de electrooculograma (EOG) de alta amplitud (>100 µV) y baja frecuencia (<4 Hz). Representa la variación en el vector del dipolo corneo-retiniano durante el cierre palpebral. Provoca saturación transitoria en Fp1/Fp2; se recomienda filtrado por descomposición en componentes independientes (ICA) o regresión EOG.';
    } else {
      // University student
      explicacion =
        'Se registra una deflexión bifásica prominente en los canales frontopolar (Fp1/Fp2). No corresponde a actividad cortical cerebral directa, sino al artefacto electrooculográfico producido por el movimiento palpebral y la rotación del globo ocular (fenómeno de Bell).';
    }
  } else if (eventType === 'ALPHA_WAVE') {
    es_senal = 'Señal cortical endógena genuina (Ritmo Alfa 8-12 Hz)';
    confianza = 97.2;
    bci_cmd = 'Comando BCI: [ESTADO DE CALMA / CONFIRMAR COMANDO SOSTENIDO (DWELL)]';
    if (isBeginner) {
      explicacion =
        '¡El cerebro se puso en modo relajación! Cuando cierras los ojos, la parte de atrás de tu cabeza (el lóbulo occipital, encargado de ver imágenes) descansa y empieza a cantar una canción rítmica y suave llamada Onda Alfa.';
    } else if (isTechnician) {
      explicacion =
        'Sincronización rítmica en la banda 8-12 Hz localizada en corteza occipital (O1, O2) con densidad espectral de potencia (PSD) > 15 µV²/Hz. Refleja oscilaciones tálamo-corticales inhibitorias durante privación de estímulos visuales. Relación señal-ruido (SNR) óptima para BCI basada en biofeedback y neurofeedback.';
    } else {
      explicacion =
        'Ritmo electroencefalográfico dominante de Berger (8-12 Hz) en derivaciones occipitales. Indica un estado de vigilia relajada con ojos cerrados. Al abrir los ojos ocurre la atenuación o bloqueo de Berger por desincronización cortical.';
    }
  } else if (eventType === 'JAW_CLENCH') {
    es_senal = 'Artefacto muscular electromiográfico (EMG Músculo Masetero/Temporal)';
    confianza = 99.1;
    bci_cmd = 'Comando BCI: [INTERRUPCIÓN DE EMERGENCIA / CANCELAR ACCIÓN]';
    if (isBeginner) {
      explicacion =
        '¡Apretón de dientes o mandíbula! Los músculos de la cara son muy fuertes y cuando se tensan producen un ruido eléctrico tan potente que cubre temporalmente las suaves ondas del cerebro, como un trueno tapando una conversación.';
    } else if (isTechnician) {
      explicacion =
        'Interferencia electromiográfica (EMG) de banda ancha (20-100+ Hz) con pico de energía en canales temporales T3 y T4. Amplitud superior a 150 µV. Enmascara completamente ritmos beta y gamma. Utilizable en sistemas híbridos EEG-EMG como conmutador binario de alta fiabilidad.';
    } else {
      explicacion =
        'Artefacto miogénico masivo derivado de la contracción de los músculos masetero y temporal. Se propaga por conducción de volumen a través del cuero cabelludo, manifestándose como un tren de espículas de alta frecuencia y gran varianza.';
    }
  } else {
    es_senal = 'Actividad cerebral basal en reposo';
    confianza = 94.0;
    bci_cmd = 'Comando BCI: [SIN ACCIÓN / ESPERA DE INTENCIÓN]';
    if (isBeginner) {
      explicacion =
        'El cerebro está activo pensando normalmente. Las señales son pequeñas y variadas, mostrando que las neuronas están trabajando en sus tareas cotidianas.';
    } else if (isTechnician) {
      explicacion =
        'Espectro EEG basal con distribución 1/f típica (ruido rosa fisiológico). Amplitud media en rango 10-30 µV sin transitorios paroxísticos ni artefactos biomecánicos relevantes.';
    } else {
      explicacion =
        'Línea de base electroencefalográfica con mezcla fisiológica de ritmos beta frontal y ondas theta dispersas. Estado neutro de atención visual sin predominio de sincronización occipital.';
    }
  }

  return {
    evento_detectado: event_detectado,
    es_senal_cerebral_o_artefacto: es_senal,
    explicacion_educativa: explicacion,
    traduccion_bci_accesibilidad: bci_cmd,
    confianza_score: confianza,
    metricas_resumen: metrics,
    recomendacion_usuario:
      eventType === 'JAW_CLENCH'
        ? 'Relajar la mandíbula y respirar suavemente para reducir el ruido EMG.'
        : eventType === 'BLINK'
        ? 'Utiliza un doble parpadeo consciente para accionar el conmutador BCI.'
        : eventType === 'ALPHA_WAVE'
        ? 'Excelente estado de relajación mental detectado en la corteza occipital.'
        : 'Monitoreando canales 10-20 de OpenBCI en tiempo real.',
    modelo_utilizado: 'Gemma 4 NeuroTech Edition (Simulado / Neural Engine)',
  };
}

// API endpoint: Live Signal Interpreter using Gemini / Gemma 4
app.post('/api/interpret-signal', async (req: Request, res: Response) => {
  try {
    const { eventType, metrics, educationLevel = 'student', timeOffset = 0 } = req.body;

    if (!ai) {
      // Return simulated expert response
      const fallback = generateSimulatedGemmaResponse(eventType, metrics, educationLevel);
      return res.json({ success: true, data: fallback, source: 'simulated-gemma' });
    }

    const systemInstruction = `Eres "Gemma 4 NeuroTech", un modelo de IA de última generación especializado en neurotecnología, electroencefalografía (EEG), procesamiento de señales biomédicas y sistemas Brain-Computer Interface (BCI).
Tu rol en el Hacktoberfest Hack Day La Paz x NeuroTech UMSA 2026 es analizar registros de OpenBCI v6 y explicar con rigor y pedagogía lo que ocurre en el cerebro del usuario o en los electrodos.

Nivel de explicación solicitado: ${educationLevel.toUpperCase()}
- "BEGINNER": Explicación muy didáctica, accesible para principiantes o niños, con metáforas claras, sin perder rigor.
- "STUDENT": Nivel universitario en neurociencias o ingeniería biomédica (términos anatómicos, fisiología, dipolos).
- "TECHNICIAN": Nivel de ingeniería BCI y DSP (frecuencias, bandas espectrales, SNR, artefactos EMG/EOG, algoritmos de clasificación).

Responde SIEMPRE en formato JSON válido estricto con los siguientes campos:
{
  "evento_detectado": "BLINK" | "ALPHA_WAVE" | "JAW_CLENCH" | "BASELINE",
  "es_senal_cerebral_o_artefacto": "string explicando si es actividad neuronal genuina o artefacto fisiológico",
  "explicacion_educativa": "string con la explicación adaptada al nivel",
  "traduccion_bci_accesibilidad": "string con comando BCI para accesibilidad o control motor asistido",
  "confianza_score": number entre 85 y 99.9,
  "recomendacion_usuario": "string con tip de calibración o biofeedback"
}`;

    const promptText = `Analiza la siguiente ventana temporal de señal EEG registrada con OpenBCI:
- Evento estimado: ${eventType}
- Tiempo de registro: ${timeOffset.toFixed(2)}s
- Métricas de canal:
  * Amplitud Pico-Pico Fp1/Fp2 (Frontal): ${metrics?.fpPeakUv || 0} µV
  * Potencia Relativa Alpha (O1/O2 Occipital 8-12Hz): ${metrics?.alphaPowerRatio || 0}
  * Varianza / Ruido Alta Frecuencia (T3/T4 Temporal EMG): ${metrics?.temporalVariance || 0}
  * Frecuencia dominante actual: ${metrics?.dominantHz || 0} Hz
- Datos adicionales: ${JSON.stringify(metrics || {})}

Devuelve el análisis en JSON según tus instrucciones.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: promptText,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const responseText = response.text || '';
      let parsed = JSON.parse(responseText);
      parsed.modelo_utilizado = 'Google Gemma 4 (Gemini API Backend)';
      return res.json({ success: true, data: parsed, source: 'gemma-gemini-api' });
    } catch (genError: any) {
      console.warn('Gemini API call failed, falling back to simulated neural response:', genError?.message);
      const fallback = generateSimulatedGemmaResponse(eventType, metrics, educationLevel);
      return res.json({
        success: true,
        data: fallback,
        source: 'simulated-gemma',
        warning: 'Gemma 4 API en modo local de contingencia: ' + genError?.message,
      });
    }
  } catch (error: any) {
    console.error('Error in /api/interpret-signal:', error);
    res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
});

// API endpoint: Ask Gemma 4 directly about a specific brain region or time window
app.post('/api/chat-signal', async (req: Request, res: Response) => {
  try {
    const { message, context } = req.body;

    if (!ai) {
      let reply = '';
      const msgLower = (message || '').toLowerCase();
      if (msgLower.includes('parpadeo') || msgLower.includes('blink') || msgLower.includes('ojo')) {
        reply =
          'Los parpadeos generan artefactos en Fp1/Fp2 debido al dipolo corneal (+ adelante, - atrás). En sistemas BCI, los parpadeos intencionales (doble parpadeo o parpadeo prolongado) se aprovechan como conmutadores virtuales de accesibilidad para seleccionar comandos.';
      } else if (msgLower.includes('alfa') || msgLower.includes('alpha') || msgLower.includes('occipital')) {
        reply =
          'El ritmo alfa (8-12 Hz) se genera principalmente en la corteza visual occipital (áreas 17, 18 y 19 de Brodmann) modulada por el núcleo pulvinar del tálamo. Se potencia al cerrar los ojos o en meditación y se bloquea al procesar estímulos visuales complejos.';
      } else if (msgLower.includes('mandibula') || msgLower.includes('clench') || msgLower.includes('dientes') || msgLower.includes('musculo')) {
        reply =
          'Apretar la mandíbula activa intensamente los músculos temporal y masetero, generando una señal EMG de hasta 300 µV de 20 a 100+ Hz en los electrodos T3/T4. Aunque contamina el EEG cognitivo, en BCI puede emplearse como botón de emergencia o disparo binario rápido.';
      } else if (msgLower.includes('frontal') || msgLower.includes('prefrontal')) {
        reply =
          'El lóbulo frontal (electrodos Fp1, Fp2, F3, F4) comanda las funciones ejecutivas, memoria de trabajo, toma de decisiones y control motor voluntario. En EEG es el sitio primario para monitorear carga cognitiva y estados atencionales.';
      } else {
        reply = `Gemma 4 NeuroTech: Has consultado "${message}". En el registro OpenBCI actual, los canales frontales (Fp1/Fp2), temporales (T3/T4) y occipitales (O1/O2) permiten diferenciar claramente señales cognitivas de artefactos biomecánicos para control BCI accesible.`;
      }
      return res.json({ success: true, reply, model: 'Gemma 4 (Local Neuro Assistant)' });
    }

    const systemInstruction = `Eres "Gemma 4 NeuroTech Assistant", especialista en interfaces cerebro-computadora (BCI) y neurociencia para el Hack Day La Paz x NeuroTech UMSA 2026. Responde preguntas técnicas y pedagógicas en español de manera clara, concisa, entusiasta y científicamente exacta. Contexto del usuario: ${JSON.stringify(context || {})}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: message,
      config: {
        systemInstruction,
        temperature: 0.4,
      },
    });

    return res.json({
      success: true,
      reply: response.text || 'Sin respuesta del modelo.',
      model: 'Google Gemma 4 (Gemini API)',
    });
  } catch (err: any) {
    console.error('Error in /api/chat-signal:', err);
    res.status(500).json({ success: false, error: err?.message || 'Chat error' });
  }
});

// API endpoint: Information about brain lobes for 3D click interaction
app.get('/api/lobe-info/:lobe', (req: Request, res: Response) => {
  const lobe = req.params.lobe.toLowerCase();
  const infoMap: Record<string, any> = {
    frontal: {
      name: 'Lóbulo Frontal y Corteza Prefrontal (Fp1 / Fp2 / F3 / F4)',
      functions: 'Toma de decisiones, atención focalizada, memoria de trabajo, funciones ejecutivas y control motor.',
      eegCorrelate: 'Ondas Theta en meditación profunda/foco, Ondas Beta en alerta activa. Susceptible a artefactos oculares (EOG).',
      bciApplication: 'Detección de carga mental, estados de vigilia y conmutadores basados en parpadeo voluntario.',
      color: '#00F2FE',
    },
    occipital: {
      name: 'Lóbulo Occipital y Corteza Visual (O1 / O2)',
      functions: 'Procesamiento de estímulos visuales primarios, reconocimiento de patrones, formas y colores.',
      eegCorrelate: 'Ritmo Alfa prominente (8-12 Hz) cuando los ojos están cerrados o en calma sensorial (bloqueo de Berger al abrir los ojos). Potenciales Evocados Visuales (SSVEP).',
      bciApplication: 'Sistemas BCI basados en SSVEP (teclados virtuales de alta velocidad) y biofeedback de relajación.',
      color: '#10B981',
    },
    temporal: {
      name: 'Lóbulo Temporal y Zona Mandibular (T3 / T4 / T5 / T6)',
      functions: 'Procesamiento auditivo, comprensión del lenguaje (Área de Wernicke) y consolidación de memoria a largo plazo.',
      eegCorrelate: 'Cercanía anatómica con músculos masetero y temporal. Fuente predominante de artefactos electromiográficos (EMG de alta frecuencia >30 Hz).',
      bciApplication: 'Detección intencional de tensión mandibular (Jaw Clench) como gatillo de control secundario de alta precisión.',
      color: '#F59E0B',
    },
    parietal: {
      name: 'Lóbulo Parietal y Corteza Somatosensorial (P3 / P4 / Pz)',
      functions: 'Integración sensorial espacial, percepción corporal somatosensorial y navegación visual-espacial.',
      eegCorrelate: 'Potencial P300 (onda de evento cognitivo a los ~300 ms ante estímulos relevantes inesperados).',
      bciApplication: 'Deletreador P300 Speller para pacientes con síndrome de enclaustramiento (Locked-in syndrome).',
      color: '#8B5CF6',
    },
  };

  const data = infoMap[lobe] || {
    name: 'Corteza Cerebral',
    functions: 'Manto de tejido neuronal que cubre los hemisferios cerebrales.',
    eegCorrelate: 'Genera las fluctuaciones de potencial extracelular medidas por el EEG.',
    bciApplication: 'Base de todos los sistemas BCI no invasivos.',
    color: '#38BDF8',
  };

  res.json({ success: true, lobe: data });
});

// Configure Vite middleware in development or static server in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`NeuroTwin 3D Server running on http://0.0.0.0:${PORT}`);
    console.log(`Google GenAI enabled: ${!!ai ? 'Yes (API Key loaded)' : 'No (Using Neural Contingency Engine)'}`);
  });
}

startServer();
