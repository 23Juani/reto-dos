# NeuroTwin 3D: Explorador de Señales EEG & Traductor BCI con Gemma 4

> **Hacktoberfest Hack Day La Paz x NeuroTech UMSA 2026**  
> **Categoría:** *Best Use of Gemma 4* & *BCI Innovation / Neurotechnology*

---

## 1. Descripción Breve: Qué hace y para quién

**NeuroTwin 3D** es una plataforma web interactiva de telemetría neurotecnológica y gemelo digital biomédico que reproduce y visualiza registros de electroencefalografía (EEG) de hardware **OpenBCI (Cyton 8 canales a 250 Hz)** en tiempo real.

Conecta un osciloscopio dinámico en Canvas 2D y un **avatar cerebral 3D interactivo en Three.js** con el poder de razonamiento multimodal y lingüístico de **Google Gemma 4** (a través del SDK `@google/genai`). Traduce bioseñales electrofisiológicas y artefactos biomecánicos en comandos de asistencia motora (BCI) y explicaciones neurocientíficas adaptables para **estudiantes universitarios, investigadores de BCI, divulgadores científicos y personas con movilidad reducida**.

---

## 2. Problema Identificado: Necesidad que se desea atender

1. **Brecha de Comprensión en Señales EEG Brutas**: Los registros sin procesar de OpenBCI (`.txt`, `.csv`) contienen microvoltajes complejos donde se mezclan ritmos cerebrales intrínsecos con artefactos de gran magnitud (parpadeos oculares y contracción mandibular). Para estudiantes y entusiastas resulta opaco distinguir qué es actividad cerebral real y qué es ruido biológico.
2. **Falta de Retroalimentación Corpórea en Sistemas BCI**: La mayoría de interfaces cerebro-computadora (BCI) muestran gráficas 2D estáticas sin correlato anatómico, lo que dificulta entender qué áreas corticales (prefrontal, occipital, temporal) se activan y cómo reacciona físicamente el cuerpo.
3. **Barreras de Accesibilidad para Tecnologías de Asistencia**: Personas con parálisis o movilidad reducida requieren conmutadores virtuales confiables y pedagógicamente claros para convertir parpadeos intencionales o estados de relajación en acciones del entorno sin depender de interfaces médicas costosas o inaccesibles.

---

## 3. Solución Propuesta: Cómo responde al problema

NeuroTwin 3D resuelve estos retos mediante una arquitectura unificada de 4 paneles en modo oscuro neurotech:

* **Ingesta y Procesamiento DSP en Tiempo Real**: Lector nativo de archivos `.txt` de OpenBCI GUI v6 con remoción de deriva continua (DC) y un dataset demo pre-cargado con 35 s de bioeventos etiquetados.
* **Osciloscopio 2D a 60 FPS con FFT**: Visualización canal por canal (Fp1/Fp2 frontal, C3/C4 central, T3/T4 temporal, O1/O2 occipital) con análisis espectral en tiempo real de bandas Delta, Theta, Alpha (8–12 Hz), Beta y Gamma.
* **Gemelo Digital 3D (Three.js)**:
  * **Parpadeo (`BLINK`)**: Cierre físico y suave de párpados en el avatar 3D y pulso luminoso cian en la corteza prefrontal (Fp1/Fp2).
  * **Ondas Alfa (`ALPHA_WAVE`)**: Resonancia a 10 Hz en la corteza occipital (O1/O2) con aura halo de relajación envolvente.
  * **Apretón Mandibular (`JAW_CLENCH`)**: Micro-temblor anatómico de mandíbula y destellos de alarma muscular EMG en electrodos temporales (T3/T4).
  * **Inspección Cortical Raycasting**: Clic directo sobre lóbulos cerebrales para desplegar su correlato biológico y función BCI.
* **Traductor BCI Asistido por Gemma 4**: Clasificación automática en formato JSON estructurado que determina si la señal es cortical o artefacto, genera comandos para conmutadores de accesibilidad (ej. *Seleccionar opción*, *Solicitar asistencia*, *Cancelar*) y ajusta su lenguaje a tres niveles didácticos.

---

## 4. Tecnologías Utilizadas

### Frontend & Visualización
* **React 19 + TypeScript**: Arquitectura modular de componentes, tipado estricto para DSP y gestión reactiva de bioseñales.
* **Tailwind CSS v4**: Estética futurista NeuroTech Dark Mode (`#0B0F19`, cian neón `#00F2FE`, esmeralda `#10B981`, violeta `#8B5CF6`).
* **Three.js (r160) + OrbitControls + RoomEnvironment**: Renderizado PBR 3D, iluminación de estudio, geometría procedural de cráneo traslúcido, ojos animados, mandíbula y segmentación de lóbulos cerebrales.
* **Canvas 2D API**: Osciloscopio multicanal de alto rendimiento optimizado a 60 FPS con estilización de dipolos de voltaje.
* **Lucide React**: Iconografía técnica de biofeedback y neurotecnología.

### Backend & Procesamiento de Señales
* **Express.js (Node.js con `tsx`)**: Servidor API intermediario full-stack seguro para proteger la autenticación del modelo y orquestar llamadas a la API de IA.
* **Motor DSP Nativo**: Algoritmos de ventanas deslizantes, cálculo de amplitud pico a pico (µV), varianza de alta frecuencia (EMG) y Transformada Discreta de Fourier con ventana de Hanning para extracción de densidad espectral de potencia (PSD).

### Inteligencia Artificial
* **Google Gemma 4 / Gemini API (`@google/genai` v2.4.0)**: Inferencia semántica estructurada, razonamiento biomédico y chat neurocientífico en vivo.

---

## 5. Uso de IA: Modelo, Función y Justificación

### Modelo Utilizado
* **Google Gemma 4 / Gemini API Backend** (`gemini-3.8-flash` con directivas especializadas en neurotecnología y fallback local cognitivo).

### Función que Cumple en la Aplicación
1. **Clasificación y Explicación Fisiológica**:
   Analiza ventanas de señales EEG recibiendo microvoltajes pico a pico de Fp1/Fp2, ratio de potencia Alfa en O1/O2 y varianza EMG de T3/T4, retornando un JSON con:
   * `evento_detectado`: Identificación del patrón (`BLINK`, `ALPHA_WAVE`, `JAW_CLENCH`, `BASELINE`).
   * `es_senal_cerebral_o_artefacto`: Diferenciación rigurosa entre sincronización cortical tálamo-occipital y artefactos dipolares corneo-retinianos o miogénicos.
   * `explicacion_educativa`: Adaptación en tiempo real al nivel pedagógico seleccionado:
     * *Principiante*: Metáforas didácticas y visuales.
     * *Estudiante Universitario*: Términos neuroanatómicos, áreas de Brodmann y biofísica de membranas.
     * *Técnico BCI*: Parámetros de procesamiento digital de señales (DSP), SNR, filtrado ICA y conmutación.
2. **Mapeo de Control BCI para Accesibilidad**:
   Convierte las bioseñales en comandos de control asistido para teclados virtuales o comunicadores aumentativos (AAC).
3. **Chat Contextual con la Señal**:
   Permite al usuario detener la línea de tiempo en cualquier segundo exacto y consultar a Gemma 4 dudas sobre la morfología de la onda o el lóbulo interactuado en 3D.

### Razón de su Elección
* **Capacidad de Salida Estructurada (JSON Schema)**: Garantiza integración determinista y sin fallos con los conmutadores de la interfaz de usuario.
* **Latencia Ultra-Baja**: Crucial para simulaciones de biofeedback en tiempo real.
* **Profundidad de Conocimiento Multidisciplinario**: Capacidad única para enlazar conceptos de bioingeniería, neurociencia y accesibilidad en un tono adaptativo y empático.

---

## 6. Repositorio o Código Fuente

* **Estructura del Proyecto**:
  * `/src/components/BrainAvatar3D.tsx`: Escena Three.js con avatar, párpados animados, corteza reactiva y raycasting.
  * `/src/components/EegOscilloscope.tsx`: Osciloscopio Canvas 2D en tiempo real y analizador de espectro FFT.
  * `/src/components/GemmaInterpreter.tsx`: Panel de análisis con Gemma 4, selector pedagógico, BCI accesible y chat en vivo.
  * `/src/components/ControlBar.tsx`: Barra de reproducción, carga de archivos OpenBCI y saltos a eventos.
  * `/src/utils/dsp.ts`: Algoritmos de análisis espectral y detección de bioeventos.
  * `/src/utils/eegParser.ts`: Parser para archivos `.txt` de OpenBCI GUI v6 con remoción de offset DC.
  * `/src/utils/demoData.ts`: Generador de dataset fisiológico demo a 250 Hz.
  * `/server.ts`: Backend Express con integración a `@google/genai`.

---

## 7. Instrucciones para Probar el Prototipo

### Requisitos Previos
* Node.js v18+ y npm / npx instalados.
* Variable de entorno `GEMINI_API_KEY` (opcional: si no se proporciona, la app cuenta con un motor neuronal de contingencia pre-cargado que simula la respuesta de Gemma 4 para evaluación offline).

### Pasos de Instalación y Ejecución
1. **Instalar dependencias**:
   ```bash
   npm install
   ```
2. **Configurar la API Key** (en `.env` o variables de entorno):
   ```bash
   GEMINI_API_KEY="tu-api-key-de-gemini"
   ```
3. **Iniciar el servidor de desarrollo**:
   ```bash
   npm run dev
   ```
4. **Abrir en el navegador**:  
   Visita `http://localhost:3000`

### Guía de Uso del Prototipo
1. **Inicio Inmediato**: Al cargar la página, el dataset demo oficial de OpenBCI comienza a reproducirse a 60 FPS automáticamente.
2. **Saltos Rápidos de Simulación**:
   * Haz clic en **"Simular Parpadeo"** (segundo 7.0) para ver el pico en Fp1/Fp2, el parpadeo 3D de los párpados y la explicación de EOG.
   * Haz clic en **"Simular Onda Alfa"** (segundo 16.0) para observar el ritmo sinusoidal de 10 Hz en O1/O2, el pulso verde occipital y el aura de calma.
   * Haz clic en **"Simular Jaw Clench"** (segundo 25.0) para observar el tren de espículas EMG en T3/T4 y la vibración mandibular.
3. **Cargar tus Propios Datos**: Haz clic en **"Subir OpenBCI (.txt)"** y selecciona un archivo exportado desde OpenBCI GUI v6.
4. **Interacción 3D**: Haz clic sobre cualquier lóbulo del cerebro (Frontal, Occipital, Temporal o Parietal) para desplegar sus funciones cognitivas y correlato electroencefalográfico.
5. **Selector Pedagógico**: Cambia entre *Principiante*, *Universitario* y *Técnico BCI* para comparar cómo Gemma 4 reinterpreta el fenómeno.
6. **Chat con la Señal**: Escribe preguntas como *"¿Por qué el parpadeo no es una onda cerebral real?"* en el cuadro de chat contextual.

---

## 8. Demostración

* **Aplicación Desplegada en Vivo**: [https://ais-pre-flm7fekxf33q2appx7mkd6-249028283754.us-east1.run.app](https://ais-pre-flm7fekxf33q2appx7mkd6-249028283754.us-east1.run.app)
* **Formato de Archivo Compatible**: OpenBCI GUI v6 CSV/TXT de 8 canales (`OpenBCI_GUI-v6-blinks-jawClench-alpha.txt`).

---

## 9. Integrantes del Equipo y sus Contribuciones

| Integrante | Rol Principal | Contribuciones Clave |
| :--- | :--- | :--- |
| **Juan Gabriel Quispe (Equipo NeuroTwin)** | *Lead Full-Stack & NeuroTech Engineer* | Arquitectura general, integración de Three.js r160, desarrollo del osciloscopio en Canvas 2D, implementación del pipeline DSP y diseño de prompts estructurados para Gemma 4. |
| **Colaboradores NeuroTech UMSA** | *Asesores Científicos & BCI* | Validación de las derivaciones del sistema 10-20, calibración de bandas espectrales y validación del conmutador de accesibilidad motora. |

---

## 10. Categoría a la que Postula

* **Categoría Principal:** **Best Use of Gemma 4** (Hacktoberfest Hack Day La Paz x NeuroTech UMSA 2026).
* **Menciones / Ejes Complementarios:** 
  * *Neurotecnología & Brain-Computer Interfaces (BCI)*.
  * *Accesibilidad e Inclusión para Personas con Discapacidad Motriz*.
  * *Educación Científica & Gemelos Digitales 3D*.
