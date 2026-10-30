import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { LobeInfo } from '../types/eeg';
import { Eye, Sparkles, AlertTriangle, RotateCcw, Compass, Maximize2, Info } from 'lucide-react';

interface BrainAvatar3DProps {
  detectedEvent: 'BASELINE' | 'BLINK' | 'ALPHA_WAVE' | 'JAW_CLENCH';
  onSelectLobe: (lobeKey: string) => void;
  selectedLobe: string | null;
  lobeData: LobeInfo | null;
}

export const BrainAvatar3D: React.FC<BrainAvatar3DProps> = ({
  detectedEvent,
  onSelectLobe,
  selectedLobe,
  lobeData,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // References to animated 3D parts
  const leftEyelidRef = useRef<THREE.Mesh | null>(null);
  const rightEyelidRef = useRef<THREE.Mesh | null>(null);
  const frontalLobeRef = useRef<THREE.Mesh | null>(null);
  const occipitalLobeRef = useRef<THREE.Mesh | null>(null);
  const temporalLeftRef = useRef<THREE.Mesh | null>(null);
  const temporalRightRef = useRef<THREE.Mesh | null>(null);
  const jawRef = useRef<THREE.Mesh | null>(null);
  const auraRingRef = useRef<THREE.Mesh | null>(null);
  const interactiveLobesRef = useRef<THREE.Mesh[]>([]);

  const [hoveredLobeName, setHoveredLobeName] = useState<string | null>(null);
  const [controlsCollapsed, setControlsCollapsed] = useState(false);

  // Animation values state
  const animStateRef = useRef({
    blinkProgress: 0,
    targetBlink: 0,
    alphaPulse: 0,
    jawTremor: 0,
    time: 0,
  });

  // React to detected events
  useEffect(() => {
    if (detectedEvent === 'BLINK') {
      animStateRef.current.targetBlink = 1;
      setTimeout(() => {
        animStateRef.current.targetBlink = 0;
      }, 250);
    } else {
      animStateRef.current.targetBlink = 0;
    }
  }, [detectedEvent]);

  // Main Three.js Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL per Three.js guidelines
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0b0f19);
    scene.fog = new THREE.FogExp2(0x0b0f19, 0.08);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(2.8, 1.4, 3.6);
    cameraRef.current = camera;

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // 3. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2.2;
    controls.maxDistance = 7.5;
    controls.target.set(0, 0.45, 0);
    controls.maxPolarAngle = Math.PI / 2 + 0.15; // Don't flip under ground

    let isInteracting = false;
    controls.addEventListener('start', () => { isInteracting = true; });
    controls.addEventListener('end', () => { isInteracting = false; });

    // 4. Studio Lighting & Environment Reflection
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Studio 3-point light rig
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(3, 4, 3);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    fillLight.position.set(-3, 2, -2);
    scene.add(fillLight);

    const hemiLight = new THREE.HemisphereLight(0x00f2fe, 0x111827, 1.0);
    hemiLight.position.set(0, 5, 0);
    scene.add(hemiLight);

    // Contact shadow floor circle
    const floorGeo = new THREE.CircleGeometry(2.5, 32);
    const floorMat = new THREE.MeshBasicMaterial({
      color: 0x05070e,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.7;
    scene.add(floor);

    // Grid Floor
    const gridHelper = new THREE.GridHelper(5, 20, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -0.69;
    scene.add(gridHelper);

    // 5. Build Procedural Avatar Group
    const avatarGroup = new THREE.Group();
    avatarGroup.position.set(0, 0.45, 0);
    scene.add(avatarGroup);

    // --- A. Translucent Cranium / Head Silhouette ---
    const headGeo = new THREE.SphereGeometry(1.0, 32, 28);
    // Slightly deform to match cranium shape (wider top, flatter back, chin taper)
    const pos = headGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);

      // Elongate vertically and taper chin
      if (y < -0.2) {
        x *= 0.85;
        z *= 0.88;
      }
      // Forehead forward curve
      if (y > 0.1 && z > 0) {
        z *= 1.06;
      }
      pos.setXYZ(i, x * 0.95, y * 1.15, z * 1.08);
    }
    headGeo.computeVertexNormals();

    const headMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      transparent: true,
      opacity: 0.28,
      roughness: 0.2,
      metalness: 0.1,
      wireframe: false,
      depthWrite: false,
    });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    avatarGroup.add(headMesh);

    // Holographic wireframe overlay
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x00f2fe,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
      depthWrite: false,
    });
    const wireMesh = new THREE.Mesh(headGeo, wireMat);
    avatarGroup.add(wireMesh);

    // --- B. Animated Eyes & Physical Eyelids ---
    const eyeGroup = new THREE.Group();
    avatarGroup.add(eyeGroup);

    const eyeRadius = 0.11;
    const eyeGeo = new THREE.SphereGeometry(eyeRadius, 24, 24);
    const scleraMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.1,
      metalness: 0.2,
    });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe });

    // Left Eye
    const leftEye = new THREE.Mesh(eyeGeo, scleraMat);
    leftEye.position.set(-0.35, 0.15, 0.92);
    const leftPupil = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 16), pupilMat);
    leftPupil.position.set(0, 0, 0.09);
    leftEye.add(leftPupil);
    eyeGroup.add(leftEye);

    // Right Eye
    const rightEye = new THREE.Mesh(eyeGeo, scleraMat);
    rightEye.position.set(0.35, 0.15, 0.92);
    const rightPupil = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 16), pupilMat);
    rightPupil.position.set(0, 0, 0.09);
    rightEye.add(rightPupil);
    eyeGroup.add(rightEye);

    // Eyelids (Upper Hemispheres centered on eyes)
    const eyelidGeo = new THREE.SphereGeometry(eyeRadius * 1.08, 20, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const eyelidMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.4,
      metalness: 0.3,
      side: THREE.DoubleSide,
    });

    const leftEyelid = new THREE.Mesh(eyelidGeo, eyelidMat);
    leftEyelid.position.set(-0.35, 0.15, 0.92);
    leftEyelid.rotation.x = -Math.PI / 2.2; // Open state
    avatarGroup.add(leftEyelid);
    leftEyelidRef.current = leftEyelid;

    const rightEyelid = new THREE.Mesh(eyelidGeo, eyelidMat.clone());
    rightEyelid.position.set(0.35, 0.15, 0.92);
    rightEyelid.rotation.x = -Math.PI / 2.2;
    avatarGroup.add(rightEyelid);
    rightEyelidRef.current = rightEyelid;

    // --- C. Anatomical Brain Lobes (Segmented & Interactive) ---
    const brainGroup = new THREE.Group();
    brainGroup.position.set(0, 0.12, -0.05);
    avatarGroup.add(brainGroup);

    const interactiveLobes: THREE.Mesh[] = [];

    // 1. Frontal Lobe (Prefrontal Cortex Fp1 / Fp2)
    const frontalGeo = new THREE.SphereGeometry(0.48, 24, 20, 0, Math.PI * 2, 0, Math.PI * 0.7);
    frontalGeo.scale(1.2, 0.95, 1.1);
    const frontalMat = new THREE.MeshStandardMaterial({
      color: 0x00c8ff,
      roughness: 0.25,
      metalness: 0.3,
      emissive: 0x00f2fe,
      emissiveIntensity: 0.25,
      transparent: true,
      opacity: 0.88,
    });
    const frontalMesh = new THREE.Mesh(frontalGeo, frontalMat);
    frontalMesh.position.set(0, 0.22, 0.42);
    frontalMesh.userData = { lobeKey: 'frontal', name: 'Lóbulo Frontal (Fp1 / Fp2)' };
    brainGroup.add(frontalMesh);
    frontalLobeRef.current = frontalMesh;
    interactiveLobes.push(frontalMesh);

    // 2. Occipital Lobe (Visual Cortex O1 / O2)
    const occipitalGeo = new THREE.SphereGeometry(0.42, 24, 20);
    occipitalGeo.scale(1.1, 0.85, 0.9);
    const occipitalMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.3,
      metalness: 0.3,
      emissive: 0x10b981,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.88,
    });
    const occipitalMesh = new THREE.Mesh(occipitalGeo, occipitalMat);
    occipitalMesh.position.set(0, 0.05, -0.52);
    occipitalMesh.userData = { lobeKey: 'occipital', name: 'Lóbulo Occipital (O1 / O2)' };
    brainGroup.add(occipitalMesh);
    occipitalLobeRef.current = occipitalMesh;
    interactiveLobes.push(occipitalMesh);

    // 3. Temporal Lobes (Left & Right - T3 / T4)
    const temporalGeo = new THREE.SphereGeometry(0.32, 20, 18);
    temporalGeo.scale(0.8, 0.75, 1.3);
    const temporalMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.35,
      metalness: 0.2,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.15,
      transparent: true,
      opacity: 0.85,
    });

    const temporalLeft = new THREE.Mesh(temporalGeo, temporalMat);
    temporalLeft.position.set(-0.52, -0.05, 0.02);
    temporalLeft.userData = { lobeKey: 'temporal', name: 'Lóbulo Temporal Izquierdo (T3)' };
    brainGroup.add(temporalLeft);
    temporalLeftRef.current = temporalLeft;
    interactiveLobes.push(temporalLeft);

    const temporalRight = new THREE.Mesh(temporalGeo, temporalMat.clone());
    temporalRight.position.set(0.52, -0.05, 0.02);
    temporalRight.userData = { lobeKey: 'temporal', name: 'Lóbulo Temporal Derecho (T4)' };
    brainGroup.add(temporalRight);
    temporalRightRef.current = temporalRight;
    interactiveLobes.push(temporalRight);

    // 4. Parietal Lobe & Somatosensory Strip
    const parietalGeo = new THREE.SphereGeometry(0.46, 24, 20);
    parietalGeo.scale(1.15, 0.85, 0.95);
    const parietalMat = new THREE.MeshStandardMaterial({
      color: 0x8b5cf6,
      roughness: 0.3,
      metalness: 0.2,
      emissive: 0x8b5cf6,
      emissiveIntensity: 0.15,
      transparent: true,
      opacity: 0.85,
    });
    const parietalMesh = new THREE.Mesh(parietalGeo, parietalMat);
    parietalMesh.position.set(0, 0.42, -0.08);
    parietalMesh.userData = { lobeKey: 'parietal', name: 'Lóbulo Parietal (P3 / P4 / Pz)' };
    brainGroup.add(parietalMesh);
    interactiveLobes.push(parietalMesh);

    interactiveLobesRef.current = interactiveLobes;

    // --- D. Mandible / Jaw Bone Mesh ---
    const jawShape = new THREE.TorusGeometry(0.52, 0.05, 16, 28, Math.PI * 0.95);
    const jawMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.4,
      metalness: 0.4,
      emissive: 0xef4444,
      emissiveIntensity: 0.05,
    });
    const jawMesh = new THREE.Mesh(jawShape, jawMat);
    jawMesh.rotation.x = Math.PI / 2 + 0.1;
    jawMesh.rotation.z = Math.PI * 0.025;
    jawMesh.position.set(0, -0.52, 0.28);
    avatarGroup.add(jawMesh);
    jawRef.current = jawMesh;

    // --- E. Calm Aura Halo Ring (Alpha state) ---
    const ringGeo = new THREE.TorusGeometry(1.22, 0.025, 16, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.2,
    });
    const auraRing = new THREE.Mesh(ringGeo, ringMat);
    auraRing.rotation.x = Math.PI / 2;
    auraRing.position.set(0, 0.48, 0);
    avatarGroup.add(auraRing);
    auraRingRef.current = auraRing;

    // --- F. Raycasting for Click / Hover Inspection ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const getPointerPos = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
        y: -((e.clientY - rect.top) / rect.height) * 2 + 1,
      };
    };

    const handlePointerMove = (e: MouseEvent) => {
      const { x, y } = getPointerPos(e);
      mouse.set(x, y);
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveLobesRef.current);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        setHoveredLobeName(hit.userData.name || null);
        renderer.domElement.style.cursor = 'pointer';
      } else {
        setHoveredLobeName(null);
        renderer.domElement.style.cursor = 'default';
      }
    };

    const handleClick = (e: MouseEvent) => {
      const { x, y } = getPointerPos(e);
      mouse.set(x, y);
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveLobesRef.current);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        if (hit.userData.lobeKey) {
          onSelectLobe(hit.userData.lobeKey);
        }
      }
    };

    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('click', handleClick);

    // --- G. Animation Tick Loop ---
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      const delta = clock.getDelta();
      const st = animStateRef.current;
      st.time += delta;

      // Smooth eyelid interpolation
      st.blinkProgress += (st.targetBlink - st.blinkProgress) * 0.28;

      if (leftEyelidRef.current && rightEyelidRef.current) {
        // -Math.PI/2.2 is open (~ -1.43 rad), 0 is closed (covers eye)
        const openRot = -Math.PI / 2.2;
        const closedRot = 0.05;
        const rot = THREE.MathUtils.lerp(openRot, closedRot, st.blinkProgress);
        leftEyelidRef.current.rotation.x = rot;
        rightEyelidRef.current.rotation.x = rot;
      }

      // Frontal Lobe Blink Reaction (Cyan Pulse)
      if (frontalLobeRef.current) {
        const frontalMat = frontalLobeRef.current.material as THREE.MeshStandardMaterial;
        const isBlinking = st.blinkProgress > 0.1;
        const targetIntensity = isBlinking ? 1.6 : 0.25;
        frontalMat.emissiveIntensity += (targetIntensity - frontalMat.emissiveIntensity) * 0.15;
      }

      // Occipital Lobe Alpha Reaction (Emerald rhythmic glow)
      if (occipitalLobeRef.current && auraRingRef.current) {
        const occMat = occipitalLobeRef.current.material as THREE.MeshStandardMaterial;
        const ringMat = auraRingRef.current.material as THREE.MeshBasicMaterial;

        if (detectedEvent === 'ALPHA_WAVE') {
          // 10 Hz simulated rhythmic wave
          const wave = 0.5 + 0.5 * Math.sin(st.time * 20); // 10 Hz pulsation
          occMat.emissiveIntensity = 0.4 + wave * 0.9;
          occMat.emissive.setHex(wave > 0.5 ? 0x10b981 : 0xa855f7);

          // Aura halo expansion
          auraRingRef.current.scale.setScalar(1 + wave * 0.08);
          ringMat.opacity = 0.4 + wave * 0.4;
          auraRingRef.current.rotation.z += 0.01;
        } else {
          occMat.emissiveIntensity += (0.2 - occMat.emissiveIntensity) * 0.1;
          occMat.emissive.setHex(0x10b981);
          ringMat.opacity += (0.1 - ringMat.opacity) * 0.1;
          auraRingRef.current.scale.setScalar(1);
        }
      }

      // Jaw Clench Reaction (EMG vibration & red flashing)
      if (jawRef.current && temporalLeftRef.current && temporalRightRef.current) {
        const jawMat = jawRef.current.material as THREE.MeshStandardMaterial;
        const tLeftMat = temporalLeftRef.current.material as THREE.MeshStandardMaterial;
        const tRightMat = temporalRightRef.current.material as THREE.MeshStandardMaterial;

        if (detectedEvent === 'JAW_CLENCH') {
          // High frequency tremor
          const jitter = (Math.random() - 0.5) * 0.018;
          jawRef.current.position.y = -0.52 + jitter;
          jawMat.emissiveIntensity = 0.9;
          tLeftMat.emissiveIntensity = 0.85;
          tRightMat.emissiveIntensity = 0.85;
          tLeftMat.emissive.setHex(0xef4444);
          tRightMat.emissive.setHex(0xef4444);
        } else {
          jawRef.current.position.y = -0.52;
          jawMat.emissiveIntensity += (0.05 - jawMat.emissiveIntensity) * 0.1;
          tLeftMat.emissiveIntensity += (0.15 - tLeftMat.emissiveIntensity) * 0.1;
          tRightMat.emissiveIntensity += (0.15 - tRightMat.emissiveIntensity) * 0.1;
          tLeftMat.emissive.setHex(0xf59e0b);
          tRightMat.emissive.setHex(0xf59e0b);
        }
      }

      // Smooth idle rotation if no user interaction
      if (!isInteracting) {
        avatarGroup.rotation.y = Math.sin(st.time * 0.4) * 0.12;
      }

      controls.update();
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('click', handleClick);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [detectedEvent, onSelectLobe]);

  // Camera Preset Helpers
  const setCameraPreset = (view: 'front' | 'occipital' | 'side' | 'top') => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    if (view === 'front') {
      camera.position.set(0, 0.45, 3.8);
    } else if (view === 'occipital') {
      camera.position.set(0, 0.55, -3.8);
    } else if (view === 'side') {
      camera.position.set(3.8, 0.45, 0);
    } else if (view === 'top') {
      camera.position.set(0, 4.2, 0.1);
    }
    controls.target.set(0, 0.45, 0);
    controls.update();
  };

  return (
    <div className="relative w-full h-full bg-[#0B0F19] flex flex-col overflow-hidden select-none">
      {/* 3D Scene Viewport Mount */}
      <div ref={mountRef} className="w-full flex-1 relative cursor-grab active:cursor-grabbing" />

      {/* Top Overlay: Active Neural Event & Click Hover Tooltip */}
      <div className="absolute top-3 left-3 pointer-events-none flex flex-col gap-1.5 z-10">
        <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-sm border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-semibold text-slate-200">GEMELONET 3D VISOR</span>
          <span className="text-[10px] text-slate-400">Three.js r160</span>
        </div>

        {/* Real-time reactive avatar state badge */}
        {detectedEvent === 'BLINK' && (
          <div className="flex items-center gap-2 bg-cyan-950/90 border border-cyan-500/80 px-3 py-1.5 rounded-lg text-xs text-cyan-200 shadow-[0_0_15px_rgba(0,242,254,0.3)]">
            <Eye className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="font-bold">PARPADEO REFLEJADO (EOG)</div>
              <div className="text-[10px] text-cyan-300">Párpados cerrados & Fp1/Fp2 pulsando</div>
            </div>
          </div>
        )}

        {detectedEvent === 'ALPHA_WAVE' && (
          <div className="flex items-center gap-2 bg-emerald-950/90 border border-emerald-500/80 px-3 py-1.5 rounded-lg text-xs text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="font-bold">SINCRONIZACIÓN ALFA OCCIPITAL</div>
              <div className="text-[10px] text-emerald-300">Aura armónica & Corteza visual activa</div>
            </div>
          </div>
        )}

        {detectedEvent === 'JAW_CLENCH' && (
          <div className="flex items-center gap-2 bg-red-950/90 border border-red-500/80 px-3 py-1.5 rounded-lg text-xs text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <div>
              <div className="font-bold">TENSIÓN MANDIBULAR (EMG)</div>
              <div className="text-[10px] text-red-300">Micro-temblor en masetero & T3/T4</div>
            </div>
          </div>
        )}
      </div>

      {/* Hover Info Tag (center-top) */}
      {hoveredLobeName && (
        <div className="absolute top-3 right-3 bg-slate-900/90 border border-cyan-500/60 px-3 py-1 rounded text-xs text-cyan-300 pointer-events-none z-10 shadow-lg animate-fade-in">
          💡 Clic para analizar con Gemma 4: <span className="font-bold">{hoveredLobeName}</span>
        </div>
      )}

      {/* Selected Lobe Drawer Card */}
      {selectedLobe && lobeData && (
        <div className="absolute top-14 right-3 max-w-xs bg-slate-950/95 border border-cyan-500/50 p-3 rounded-lg text-xs text-slate-200 z-10 shadow-2xl">
          <div className="flex justify-between items-start mb-1">
            <div className="font-bold text-cyan-400 flex items-center gap-1.5">
              <Info className="w-4 h-4" />
              {lobeData.name}
            </div>
            <button
              onClick={() => onSelectLobe('')}
              className="text-slate-400 hover:text-slate-100 text-sm px-1"
            >
              ×
            </button>
          </div>
          <p className="text-[11px] text-slate-300 mb-2 leading-relaxed">{lobeData.functions}</p>
          <div className="bg-slate-900 p-2 rounded border border-slate-800 space-y-1 text-[10px]">
            <div>
              <span className="text-cyan-400 font-semibold">Correlato EEG:</span> {lobeData.eegCorrelate}
            </div>
            <div>
              <span className="text-emerald-400 font-semibold">Uso en BCI:</span> {lobeData.bciApplication}
            </div>
          </div>
        </div>
      )}

      {/* Sleek Collapsible Bottom HUD Dock per Three.js UX directives */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 max-w-xl w-[94%] transition-transform">
        <div className="bg-slate-950/90 border border-slate-800/90 rounded-xl px-3 py-2 backdrop-blur-md shadow-2xl flex items-center justify-between gap-2 text-xs">
          {/* Lobe Quick Focus Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
              <Compass className="w-3 h-3 text-slate-400" /> Lóbulos:
            </span>
            <button
              onClick={() => onSelectLobe('frontal')}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all ${
                selectedLobe === 'frontal'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                  : 'bg-slate-900 border-cyan-900/60 text-cyan-300 hover:bg-cyan-950'
              }`}
            >
              Frontal (Fp)
            </button>
            <button
              onClick={() => onSelectLobe('occipital')}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all ${
                selectedLobe === 'occipital'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                  : 'bg-slate-900 border-emerald-900/60 text-emerald-300 hover:bg-emerald-950'
              }`}
            >
              Occipital (O)
            </button>
            <button
              onClick={() => onSelectLobe('temporal')}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all ${
                selectedLobe === 'temporal'
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-900 border-amber-900/60 text-amber-300 hover:bg-amber-950'
              }`}
            >
              Temporal (T)
            </button>
            <button
              onClick={() => onSelectLobe('parietal')}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all ${
                selectedLobe === 'parietal'
                  ? 'bg-purple-500 text-slate-950 border-purple-400'
                  : 'bg-slate-900 border-purple-900/60 text-purple-300 hover:bg-purple-950'
              }`}
            >
              Parietal (P)
            </button>
          </div>

          {/* Camera View Angle Buttons */}
          <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
            <button
              onClick={() => setCameraPreset('front')}
              title="Vista Frontal"
              className="px-1.5 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            >
              Frontal
            </button>
            <button
              onClick={() => setCameraPreset('occipital')}
              title="Vista Occipital Posterior"
              className="px-1.5 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            >
              Occipital
            </button>
            <button
              onClick={() => setCameraPreset('side')}
              title="Vista Lateral Temporal"
              className="px-1.5 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            >
              Perfil
            </button>
            <button
              onClick={() => setCameraPreset('front')}
              title="Restablecer posición de cámara"
              className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
