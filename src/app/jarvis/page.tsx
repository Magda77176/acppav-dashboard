"use client";
import { useEffect, useRef, useState, useCallback } from "react";

interface Particle {
  x: number; y: number; z: number;
  brightness: number;
  r: number; g: number; b: number; // original color from reference
  size: number;
  opacity: number;
  phase: number;
  isMouth: boolean;
  isUpperLip: boolean;
  isLowerLip: boolean;
  isEye: boolean;
  distFromCenter: number;
  inFace: boolean;
}

interface Message { id: string; type: 'user' | 'jarvis'; text: string; timestamp: Date; }
interface SpeechRecognition extends EventTarget { start(): void; stop(): void; continuous: boolean; interimResults: boolean; lang: string; onstart: ((e: Event) => void) | null; onend: ((e: Event) => void) | null; onresult: ((e: SpeechRecognitionEvent) => void) | null; onerror: ((e: SpeechRecognitionErrorEvent) => void) | null; }
interface SpeechRecognitionEvent extends Event { results: SpeechRecognitionResultList; }
interface SpeechRecognitionErrorEvent extends Event { error: string; }
declare global { interface Window { SpeechRecognition: new () => SpeechRecognition; webkitSpeechRecognition: new () => SpeechRecognition; } }

// Load reference face image → sample particles with original color/brightness
async function loadFaceParticles(maxParticles: number): Promise<Particle[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const w = img.naturalWidth, h = img.naturalHeight;
      const off = document.createElement('canvas');
      off.width = w; off.height = h;
      const ctx = off.getContext('2d');
      if (!ctx) { resolve([]); return; }
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, w, h).data;

      // Face center (weighted by brightness)
      let sx = 0, sy = 0, sw = 0;
      for (let y = 0; y < h; y += 2) {
        for (let x = 0; x < w; x += 2) {
          const i = (y * w + x) * 4;
          const bri = (data[i] + data[i+1] + data[i+2]) / 3;
          if (bri > 20) { sx += x * bri; sy += y * bri; sw += bri; }
        }
      }
      const fcx = sw > 0 ? sx / sw : w / 2;
      const fcy = sw > 0 ? sy / sw : h / 2;
      
      // Max distance for edge detection
      const maxDist = Math.sqrt(w * w + h * h) * 0.35;

      // Collect ALL non-black pixels as candidates
      const candidates: { x: number; y: number; r: number; g: number; b: number; bri: number; dist: number }[] = [];
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          const pr = data[i], pg = data[i+1], pb = data[i+2];
          const bri = (pr + pg + pb) / 3;
          if (bri > 8) { // skip pure black background
            const dx = x - fcx, dy = y - fcy;
            const dist = Math.sqrt(dx * dx + dy * dy) / maxDist;
            candidates.push({ x, y, r: pr, g: pg, b: pb, bri: bri / 255, dist });
          }
        }
      }

      // Shuffle
      for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
      }

      const selected = candidates.slice(0, maxParticles);
      
      const particles: Particle[] = selected.map(c => {
        const relX = c.x / w;
        const relY = c.y / h;
        
        // Depth: center brighter = closer, based on brightness + position
        const z = c.bri * 0.4 + Math.max(0, 0.3 - c.dist * 0.3);
        
        // Face regions — verified from image analysis
        // Upper lip: Y 68-71% | Mouth line: ~71% | Lower lip: Y 71-75%
        // Chin starts at ~77%
        const isUpperLip = relY > 0.68 && relY < 0.71 && relX > 0.43 && relX < 0.57;
        const isLowerLip = relY > 0.71 && relY < 0.75 && relX > 0.43 && relX < 0.57;
        const isMouth = isUpperLip || isLowerLip;
        // Eyes: (~43-49% height)
        const isEye = relY > 0.42 && relY < 0.50 &&
          ((relX > 0.35 && relX < 0.47) || (relX > 0.53 && relX < 0.65));

        // Size: TINY at center (dense like pixels), LARGE at edges (bokeh)
        let size;
        if (c.dist < 0.5) {
          size = 0.6 + c.bri * 0.4;
        } else if (c.dist < 0.8) {
          size = 1.0 + (c.dist - 0.5) * 6;
        } else {
          size = 3.0 + (c.dist - 0.8) * 12 + Math.random() * 3;
        }
        


        return {
          x: relX, y: relY, z,
          brightness: c.bri,
          r: c.r, g: c.g, b: c.b,
          size,
          opacity: c.dist < 0.7 ? 0.3 + c.bri * 0.65 : Math.max(0.05, 0.5 - (c.dist - 0.7) * 1.2),
          phase: Math.random() * Math.PI * 2,
          isMouth, isUpperLip, isLowerLip, isEye,
          distFromCenter: c.dist,
          inFace: c.dist < 0.7,
        };
      });

      resolve(particles);
    };
    img.onerror = () => resolve([]);
    img.src = '/face-reference.jpg';
  });
}

export default function JarvisVoicePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waveformRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const [isListening, setIsListening] = useState(false);
  const [isJarvisSpeaking, setIsJarvisSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [ragPoints, setRagPoints] = useState(1716);
  const [isOnline, setIsOnline] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const animRef = useRef<number>(0);
  const waveAnimRef = useRef<number>(0);
  const stateRef = useRef<'idle' | 'listening' | 'speaking'>('idle');
  // Rhubarb viseme-driven lip sync
  const visemesRef = useRef<Array<{ start: number; end: number; value: string }>>([]);
  const visemeRef = useRef<string>('X');  // current viseme shape
  // Viseme shape parameters (smoothed)
  const mouthOpenRef = useRef(0);       // vertical opening (jaw drop)
  const mouthWidthRef = useRef(0);      // horizontal stretch
  const upperLipCurlRef = useRef(0);    // upper lip curl
  const bilabialPressRef = useRef(0);   // lip press (B/M/P)

  useEffect(() => {
    stateRef.current = isJarvisSpeaking ? 'speaking' : isListening ? 'listening' : 'idle';
  }, [isJarvisSpeaking, isListening]);

  useEffect(() => {
    loadFaceParticles(55000).then(p => {
      particlesRef.current = p;
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    setSpeechSupported(true);
    const rec = new SR();
    rec.continuous = false; rec.interimResults = false; rec.lang = "fr-FR";
    rec.onstart = () => setIsListening(true);
    rec.onend = () => setIsListening(false);
    rec.onresult = (e) => { if (e.results.length > 0) handleUserMessage(e.results[0][0].transcript); };
    rec.onerror = () => setIsListening(false);
    setRecognition(rec);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetch('/api/monitoring').then(r => r.json()).then(d => {
      if (d.qdrant) { setRagPoints(d.qdrant.points || 1716); setIsOnline(d.qdrant.status === 'green'); }
    }).catch(() => {});
  }, []);

  const setupAudioAnalyser = useCallback((audioEl: HTMLAudioElement) => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    if (!analyserRef.current) {
      const a = audioCtxRef.current.createAnalyser();
      a.fftSize = 512; a.smoothingTimeConstant = 0.1; // minimal smoothing = instant response
      analyserRef.current = a;
    }
    if (!sourceRef.current) {
      const s = audioCtxRef.current.createMediaElementSource(audioEl);
      s.connect(analyserRef.current);
      analyserRef.current.connect(audioCtxRef.current.destination);
      sourceRef.current = s;
    }
  }, []);

  // MAIN CANVAS — particle face with original colors from reference
  useEffect(() => {
    if (!loaded) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dpr = window.devicePixelRatio || 1;
    const resize = () => {
      const c = canvas.parentElement;
      if (!c) return;
      dpr = window.devicePixelRatio || 1;
      canvas.width = c.clientWidth * dpr;
      canvas.height = c.clientHeight * dpr;
      canvas.style.width = c.clientWidth + 'px';
      canvas.style.height = c.clientHeight + 'px';
    };
    resize();
    window.addEventListener("resize", resize);

    let t = 0;
    // frequency data allocated in animation loop

    const draw = () => {
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      t += 16;

      const state = stateRef.current;
      const particles = particlesRef.current;

      // REAL-TIME audio-driven lip sync — zero delay, reads audio waveform directly
      let amplitude = 0;
      let lowEnergy = 0, highEnergy = 0;
      if (analyserRef.current && state === 'speaking') {
        const freqData = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(freqData);
        const bins = freqData.length;
        let lowSum = 0, lowN = 0, highSum = 0, highN = 0;
        for (let i = Math.floor(bins * 0.02); i < Math.floor(bins * 0.15); i++) { lowSum += freqData[i]; lowN++; }
        for (let i = Math.floor(bins * 0.20); i < Math.floor(bins * 0.50); i++) { highSum += freqData[i]; highN++; }
        lowEnergy = lowN > 0 ? (lowSum / lowN) / 255 : 0;
        highEnergy = highN > 0 ? (highSum / highN) / 255 : 0;
        const timeData = new Uint8Array(analyserRef.current.fftSize);
        analyserRef.current.getByteTimeDomainData(timeData);
        let rms = 0;
        for (let i = 0; i < timeData.length; i++) { const v = (timeData[i] - 128) / 128; rms += v * v; }
        amplitude = Math.min(1, Math.sqrt(rms / timeData.length) * 6);
      }
      
      // Direct mapping: amplitude → mouth open, freq balance → shape
      const openTarget = state === 'speaking' ? amplitude : 0;
      const widthTarget = state === 'speaking' ? (highEnergy - lowEnergy) * 1.5 : 0;
      const curlTarget = state === 'speaking' ? Math.max(0, lowEnergy - highEnergy * 0.5) * amplitude : 0;
      
      // Near-instant: 85% per frame attack, 50% release — no perceptible delay
      mouthOpenRef.current += (openTarget - mouthOpenRef.current) * (openTarget > mouthOpenRef.current ? 0.85 : 0.50);
      mouthWidthRef.current += (widthTarget - mouthWidthRef.current) * 0.70;
      upperLipCurlRef.current += (curlTarget - upperLipCurlRef.current) * 0.60;
      bilabialPressRef.current *= 0.5;

      // Slow rotation
      const rotY = Math.sin(t * 0.0003) * 0.12;
      const cosR = Math.cos(rotY), sinR = Math.sin(rotY);
      const focal = 3.0;

      // Face fills the canvas, maintaining aspect ratio of reference (626:351 ≈ 1.78:1)
      const refAspect = 626 / 351;
      let faceW, faceH;
      if (w / h > refAspect) {
        faceH = h;
        faceW = faceH * refAspect;
      } else {
        faceW = w;
        faceH = faceW / refAspect;
      }
      const ox = (w - faceW) / 2;
      const oy = (h - faceH) / 2;

      const breathAmt = state === 'speaking' ? 1.2 : state === 'listening' ? 0.5 : 0.25;

      for (const p of particles) {
        const bx = Math.sin(t * 0.0008 + p.phase) * breathAmt * 0.0005;
        const by = Math.cos(t * 0.0006 + p.phase * 1.3) * breathAmt * 0.0003;

        let lx = (p.x - 0.5) + bx;
        let ly = (p.y - 0.5) + by;
        let lz = p.z * 0.3;

        // Lip sync — Rhubarb viseme-driven movement
        if (p.isMouth) {
          const mo = mouthOpenRef.current;      // jaw open amount (0-1)
          const mw = mouthWidthRef.current;     // width: positive=stretch, negative=purse
          const curl = upperLipCurlRef.current;  // upper lip curl (positive=up, negative=in)
          const bilab = bilabialPressRef.current; // bilabial press (0-1)
          
          // How close to the horizontal center of the mouth (0=edge, 1=center)
          const mouthCenterX = Math.max(0, 1 - Math.abs(p.x - 0.50) / 0.08);
          
          if (p.isLowerLip) {
            // Lower lip (Y 0.71-0.75): top edge (0.71, mouth line) = max, bottom (0.75) = hinge
            const lipGrad = Math.max(0, 1 - (p.y - 0.71) / 0.04);
            
            if (bilab > 0.1) {
              ly -= bilab * mouthCenterX * lipGrad * 0.035;
              lz -= bilab * 0.015;
            } else {
              ly += mo * mouthCenterX * lipGrad * 0.09;
              lz -= mo * mouthCenterX * lipGrad * 0.02;
            }
          } else if (p.isUpperLip) {
            // Upper lip (Y 0.68-0.71): bottom edge (0.71, mouth line) = max, top (0.68) = hinge
            const lipGrad = Math.max(0, 1 - (0.71 - p.y) / 0.03);
            
            if (bilab > 0.1) {
              ly += bilab * mouthCenterX * lipGrad * 0.035;
              lz -= bilab * 0.015;
            } else {
              const upperMove = mo * 0.4 * mouthCenterX * lipGrad;
              ly -= upperMove * 0.09;
              ly -= curl * mouthCenterX * lipGrad * 0.03;
              lz -= upperMove * 0.012 + Math.max(0, curl) * lipGrad * 0.015;
            }
          }
          
          // Horizontal: stretch (G=ee) or purse (E=oo) — both lips
          const cornerDist = (p.x - 0.50) / 0.08;
          if (mw > 0.05) {
            lx += cornerDist * mw * 0.015;
          } else if (mw < -0.05) {
            lx += cornerDist * mw * 0.012;
          }
        }

        // 3D rotation
        const rx = lx * cosR - lz * sinR;
        const rz = lx * sinR + lz * cosR;
        const persp = focal / (focal + rz);

        let px = ox + (0.5 + rx * persp) * faceW;
        let py = oy + (0.5 + ly * persp) * faceH;

        // Edge scatter
        if (!p.inFace) {
          const scatter = (p.distFromCenter - 0.7) * 2;
          px += Math.sin(t * 0.001 + p.phase * 2) * scatter * 18;
          py += Math.cos(t * 0.0008 + p.phase * 1.5) * scatter * 12;
        }

        let size = p.size * persp;
        let opacity = p.opacity;

        // Use ORIGINAL colors from the reference image
        let r = p.r, g = p.g, b = p.b;

        // State effects
        if (state === 'speaking') {
          opacity = Math.min(1, opacity * 1.15);
          if (p.isEye) { r = Math.min(255, r + 30); g = Math.min(255, g + 20); b = Math.min(255, b + 30); opacity = Math.min(1, opacity * 1.3); }
          if (p.isMouth) {
            // Subtle warmth when speaking
            r = Math.min(255, r + 15);
            opacity = Math.min(1, opacity * 1.1);
          }
        } else if (state === 'listening') {
          opacity *= (0.9 + Math.sin(t * 0.004 + p.phase) * 0.1);
        }

        // Depth-based brightness
        opacity *= (0.7 + p.z * 0.5);

        // Twinkle
        if (Math.sin(t * 0.003 + p.phase * 7) > 0.97) {
          opacity = Math.min(1, opacity * 1.6);
          size *= 1.3;
        }

        size = Math.max(0.3, size);
        opacity = Math.max(0, Math.min(1, opacity));

        // Render: small = filled rect (pixel-like), large = bokeh glow
        if (size < 1.8) {
          // Core face: square pixel particles (like the reference)
          const s = Math.max(0.5, size);
          ctx.fillStyle = `rgba(${r},${g},${b},${opacity})`;
          ctx.fillRect(px - s/2, py - s/2, s, s);
        } else if (size < 3.5) {
          // Transition: small circles
          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r},${g},${b},${opacity})`;
          ctx.fill();
          // Small glow
          ctx.beginPath();
          ctx.arc(px, py, size * 1.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r},${g},${b},${opacity * 0.12})`;
          ctx.fill();
        } else {
          // Outer: big bokeh with radial gradient
          const grad = ctx.createRadialGradient(px, py, 0, px, py, size * 1.5);
          grad.addColorStop(0, `rgba(${Math.min(255,r+25)},${Math.min(255,g+15)},${Math.min(255,b+25)},${opacity})`);
          grad.addColorStop(0.3, `rgba(${r},${g},${b},${opacity * 0.5})`);
          grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
          ctx.beginPath();
          ctx.arc(px, py, size * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(animRef.current); };
  }, [loaded]);

  // Waveform
  useEffect(() => {
    const canvas = waveformRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let dpr = window.devicePixelRatio || 1;
    const resize = () => {
      const c = canvas.parentElement;
      if (!c) return;
      dpr = window.devicePixelRatio || 1;
      canvas.width = c.clientWidth * dpr;
      canvas.height = 50 * dpr;
      canvas.style.width = c.clientWidth + 'px';
      canvas.style.height = '50px';
    };
    resize();
    let t = 0;
    const freqData = new Uint8Array(128);
    const drawWave = () => {
      const w = canvas.width / dpr, hc = canvas.height / dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, hc);
      t += 16;
      const state = stateRef.current;
      const bars = 60, gap = w / bars;
      let hasAudio = false;
      if (analyserRef.current && state === 'speaking') {
        analyserRef.current.getByteFrequencyData(freqData);
        hasAudio = true;
      }
      for (let i = 0; i < bars; i++) {
        let amp;
        if (hasAudio) amp = freqData[Math.floor(i * freqData.length / bars)] / 255 * 18;
        else if (state === 'speaking') amp = 3 + Math.sin(i * 0.3 + t * 0.008) * 10 + Math.random() * 5;
        else if (state === 'listening') amp = 2 + Math.sin(i * 0.5 + t * 0.005) * 5;
        else amp = 1.5 + Math.sin(i * 0.4 + t * 0.002) * 1.5;
        const x = i * gap + gap / 2;
        // Blue-purple waveform matching face colors
        const barR = 80 + (i / bars) * 120;
        const barG = 30 + Math.abs(amp) * 2;
        const barB = 180 - (i / bars) * 80;
        const a = Math.min(1, 0.12 + Math.abs(amp) / 25);
        ctx.fillStyle = `rgba(${Math.floor(barR)},${Math.floor(barG)},${Math.floor(barB)},${a})`;
        ctx.fillRect(x - 1.5, hc / 2 - Math.abs(amp), 3, Math.abs(amp) * 2);
      }
      waveAnimRef.current = requestAnimationFrame(drawWave);
    };
    drawWave();
    return () => { cancelAnimationFrame(waveAnimRef.current); };
  }, []);

  const handleUserMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), type: 'user', text, timestamp: new Date() }]);
    setTextInput("");
    try {
      const res = await fetch('/api/jarvis/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text }) });
      const data = await res.json();
      const response = data.response || "...";
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), type: 'jarvis', text: response, timestamp: new Date() }]);
      try {
        const ttsRes = await fetch('/api/jarvis/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: response }) });
        if (ttsRes.ok) {
          // Extract Rhubarb viseme timeline from response header
          const visemeB64 = ttsRes.headers.get('X-Visemes');
          if (visemeB64) {
            try {
              const visemeJson = atob(visemeB64);
              visemesRef.current = JSON.parse(visemeJson);
            } catch { visemesRef.current = []; }
          } else {
            visemesRef.current = [];
          }
          
          const blob = await ttsRes.blob();
          const url = URL.createObjectURL(blob);
          if (audioRef.current) {
            setupAudioAnalyser(audioRef.current);
            audioRef.current.src = url;
            setIsJarvisSpeaking(true);
            audioRef.current.onended = () => { 
              setIsJarvisSpeaking(false); 
              visemesRef.current = [];
              URL.revokeObjectURL(url); 
            };
            if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();
            audioRef.current.play().catch(() => setIsJarvisSpeaking(false));
          }
        }
      } catch { /* TTS optional */ }
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), type: 'jarvis', text: "CONNEXION PERDUE", timestamp: new Date() }]);
    }
  }, [setupAudioAnalyser]);

  const toggleMic = useCallback(() => {
    if (!recognition) return;
    if (isListening) recognition.stop(); else recognition.start();
  }, [recognition, isListening]);

  useEffect(() => { if (historyRef.current) historyRef.current.scrollTop = historyRef.current.scrollHeight; }, [messages]);

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', background: '#000', fontFamily: "'Courier New','Consolas',monospace" }}>
      <div style={{ padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #111' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#fff', fontSize: 14, fontWeight: 700, letterSpacing: 3 }}>JARVIS</span>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: isOnline ? '#33ff33' : '#ff3333' }} />
          <span style={{ color: isOnline ? '#33ff33' : '#ff3333', fontSize: 10, letterSpacing: 2 }}>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
        </div>
        <span style={{ color: '#444', fontSize: 10, letterSpacing: 2 }}>RAG: {ragPoints}</span>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, position: 'relative', minHeight: 300 }}>
          <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
          {!loaded && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontSize: 11, letterSpacing: 3 }}>LOADING NEURAL MESH...</div>}
        </div>
        <div style={{ height: 50, borderTop: '1px solid #111' }}>
          <canvas ref={waveformRef} style={{ width: '100%', height: 50 }} />
        </div>
        <div style={{ height: 170, borderTop: '1px solid #111', display: 'flex', flexDirection: 'column' }}>
          <div ref={historyRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 16px' }}>
            {messages.map(m => (
              <div key={m.id} style={{ marginBottom: 5, display: 'flex', gap: 8 }}>
                <span style={{ color: m.type === 'user' ? '#555' : '#6688cc', fontSize: 10, letterSpacing: 2, minWidth: 48 }}>{m.type === 'user' ? 'YOU' : 'JARVIS'}</span>
                <span style={{ color: m.type === 'user' ? '#ccc' : '#8899dd', fontSize: 12 }}>{m.text}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, padding: '8px 16px', borderTop: '1px solid #111' }}>
            {speechSupported && (
              <button onClick={toggleMic} style={{ background: isListening ? '#4466aa' : 'transparent', border: '1px solid #333', color: isListening ? '#000' : '#555', padding: '5px 12px', fontSize: 10, letterSpacing: 2, cursor: 'pointer', fontFamily: 'inherit' }}>
                {isListening ? 'STOP' : 'MIC'}
              </button>
            )}
            <input value={textInput} onChange={e => setTextInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleUserMessage(textInput); }}
              placeholder="MESSAGE JARVIS..." style={{ flex: 1, background: 'transparent', border: '1px solid #222', color: '#ccc', padding: '5px 12px', fontSize: 12, fontFamily: 'inherit', outline: 'none' }} />
            <button onClick={() => handleUserMessage(textInput)} style={{ background: 'transparent', border: '1px solid #333', color: '#6688cc', padding: '5px 16px', fontSize: 10, letterSpacing: 2, cursor: 'pointer', fontFamily: 'inherit' }}>SEND</button>
          </div>
        </div>
      </div>
      <audio ref={audioRef} crossOrigin="anonymous" />
    </div>
  );
}
