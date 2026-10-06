import { useState, useEffect, useRef, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

const MODELS_URL = '/models';

const VIOLATION_TYPES = {
  // Face / Camera Based
  NO_FACE: { id: 'NO_FACE', label: 'No face detected', icon: '👤', category: 'Face' },
  MULTIPLE_FACES: { id: 'MULTIPLE_FACES', label: 'Multiple faces detected', icon: '👥', category: 'Face' },
  FACE_NOT_CENTERED: { id: 'FACE_NOT_CENTERED', label: 'Face not centered / out of frame', icon: '↔️', category: 'Face' },
  LOOKING_AWAY: { id: 'LOOKING_AWAY', label: 'Eyes not on screen (looking away)', icon: '👀', category: 'Face' },
  FACE_COVERED: { id: 'FACE_COVERED', label: 'Face covered (mask/hand/object)', icon: '😷', category: 'Face' },
  LOW_LIGHTING: { id: 'LOW_LIGHTING', label: 'Low lighting / dark environment', icon: '🌑', category: 'Face' },
  
  // Device Misuse
  PHONE_DETECTED: { id: 'PHONE_DETECTED', label: 'Mobile phone detected', icon: '📱', category: 'Device' },
  EARPHONES_DETECTED: { id: 'EARPHONES_DETECTED', label: 'Earphones/Bluetooth detected', icon: '🎧', category: 'Device' },
  AUDIO_TALKING: { id: 'AUDIO_TALKING', label: 'Talking / loud noise detected', icon: '🗣️', category: 'Audio' },

  // System Behavior
  TAB_SWITCH: { id: 'TAB_SWITCH', label: 'Tab switching detected', icon: '🔀', category: 'System' },
  WINDOW_BLUR: { id: 'WINDOW_BLUR', label: 'Window minimized / switched', icon: '📐', category: 'System' },
  FULLSCREEN_EXIT: { id: 'FULLSCREEN_EXIT', label: 'Fullscreen mode exited', icon: '🖥️', category: 'System' },
  
  // Suspicious Activity
  COPY_PASTE: { id: 'COPY_PASTE', label: 'Copy-paste detected', icon: '📋', category: 'Activity' },
  RIGHT_CLICK: { id: 'RIGHT_CLICK', label: 'Right-click attempted', icon: '🖱️', category: 'Activity' },
  SHORTCUT_DETECTED: { id: 'SHORTCUT_DETECTED', label: 'Keyboard shortcut detected', icon: '⌨️', category: 'Activity' },
};

const getViolationLevel = (count) => {
  if (count <= 2) return 'safe';
  if (count <= 5) return 'warning';
  return 'critical';
};

export default function useProctor(isActive) {
  const [violations, setViolations] = useState([]);
  const [violationCount, setViolationCount] = useState(0);
  const [level, setLevel] = useState('safe');
  
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [proctorReady, setProctorReady] = useState(false);
  const [lastViolation, setLastViolation] = useState(null);
  const [detectionStats, setDetectionStats] = useState({ 
    face: false, 
    phone: false, 
    audio: 0, 
    confidence: 0,
    status: 'initializing'
  });

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectionLoopRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  
  const objectModelRef = useRef(null);
  const cooldowns = useRef({});

  const addViolation = useCallback((type) => {
    const now = Date.now();
    const cooldown = 8000; 

    if (cooldowns.current[type.id] && now - cooldowns.current[type.id] < cooldown) return;
    cooldowns.current[type.id] = now;

    console.log(`[PROCTOR] Violation: ${type.label}`);
    const entry = { ...type, timestamp: new Date().toLocaleTimeString(), id: `${type.id}_${now}` };
    setViolations(prev => [entry, ...prev]);
    setViolationCount(prev => {
      const newCount = prev + 1;
      setLevel(getViolationLevel(newCount));
      return newCount;
    });
    setLastViolation(entry);
    setTimeout(() => setLastViolation(null), 4000);
  }, []);

  // ─── 📦 Model Loading (Background Pre-load) ───
  useEffect(() => {
    // We load models globally as soon as the hook is used, not just when active
    let isMounted = true;
    const loadAllModels = async (retries = 2) => {
      if (modelsLoaded) return;
      try {
        console.log('[PROCTOR] Background model loading started...');
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL);
        await faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODELS_URL);
        
        // Load COCO-SSD in background
        cocoSsd.load().then(model => {
          objectModelRef.current = model;
          console.log('[PROCTOR] Object Detection (CocoSSD) ready.');
        });
        
        if (isMounted) {
          setModelsLoaded(true);
          console.log('[PROCTOR] Face AI models ready.');
          setDetectionStats(s => ({ ...s, status: 'ai ready' }));
        }
      } catch (err) {
        console.error('Proctoring Model Failure:', err);
        if (retries > 0) setTimeout(() => loadAllModels(retries - 1), 2000);
      }
    };
    loadAllModels();
    return () => { isMounted = false; };
  }, []); // Run ONCE on mount to ensure AI is warm

  // ─── 🎥 Media Stream Setup ───
  useEffect(() => {
    if (!isActive) return;
    
    const startMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setDetectionStats(s => ({ ...s, status: 'connecting...' }));
          
          // Force a play check with a slight delay
          const playVideo = async () => {
            if (!videoRef.current) return;
            try {
              videoRef.current.muted = true;
              await videoRef.current.play();
              console.log('[PROCTOR] Video feed is alive!');
              
              // SHOW VIDEO IMMEDIATELY
              setProctorReady(true);
              
              if (modelsLoaded) {
                 setDetectionStats(s => ({ ...s, status: 'ready' }));
              } else {
                 setDetectionStats(s => ({ ...s, status: 'warming up ai...' }));
              }
            } catch (e) {
              console.warn('[PROCTOR] Video Play Retry needed:', e);
              setTimeout(playVideo, 1000);
            }
          };
          playVideo();
        }
        startAudioAnalysis(stream);
      } catch (err) {
        console.error('Media Access Denied:', err);
        setDetectionStats(s => ({ ...s, status: 'media denied' }));
        setProctorReady(true);
      }
    };

    startMedia();
    return () => stopMedia();
  }, [isActive]);

  const stopMedia = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (detectionLoopRef.current) cancelAnimationFrame(detectionLoopRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
  };

  const startAudioAnalysis = (stream) => {
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
    } catch (e) {
      console.error('Audio Analysis Start Error:', e);
    }
  };

  // ─── 🧠 Core Detection Loop ───
  useEffect(() => {
    if (!proctorReady || !isActive || !modelsLoaded) return;

    let noFaceTicks = 0;
    let loopCount = 0;

    const runDetection = async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
        detectionLoopRef.current = requestAnimationFrame(runDetection);
        return;
      }

      loopCount++;
      // Run AI more frequently (every 10 frames, ~6 times per second)
      if (loopCount % 10 === 0) {
        try {
          // 1. Face Detection (Higher sensitivity: 0.15 threshold)
          const detections = await faceapi.detectAllFaces(
            videoRef.current, 
            new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.15 })
          ).withFaceLandmarks(true);

          const hasFace = detections.length > 0;
          const confidence = hasFace ? Math.round(detections[0].detection.score * 100) : 0;

          if (detections.length === 0) {
            noFaceTicks++;
            if (noFaceTicks > 2) addViolation(VIOLATION_TYPES.NO_FACE); // Faster detection (from 3 to 2)
          } else {
            noFaceTicks = 0;
            if (detections.length > 1) addViolation(VIOLATION_TYPES.MULTIPLE_FACES);

            const face = detections[0];
            const videoWidth = videoRef.current.videoWidth;
            const videoHeight = videoRef.current.videoHeight;
            
            // Check for Face Covered or No Landmarks
            if (!face.landmarks) {
              addViolation(VIOLATION_TYPES.FACE_COVERED);
            } else {
               // Center Check
               const box = face.detection.box;
               const centerX = box.x + box.width / 2;
               const centerY = box.y + box.height / 2;
               if (centerX < videoWidth * 0.1 || centerX > videoWidth * 0.9 || centerY < videoHeight * 0.1 || centerY > videoHeight * 0.9) {
                 addViolation(VIOLATION_TYPES.FACE_NOT_CENTERED);
               }

               // Eyes Check (Gaze estimation attempt)
               const leftEye = face.landmarks.getLeftEye();
               const rightEye = face.landmarks.getRightEye();
               const avgEyeX = (leftEye[0].x + rightEye[0].x) / 2;
               if (avgEyeX < videoWidth * 0.18 || avgEyeX > videoWidth * 0.82) {
                 addViolation(VIOLATION_TYPES.LOOKING_AWAY);
               }
            }
          }

          // 2. Object Detection (Phone) - Sensitivity 0.4
          let hasPhone = false;
          if (objectModelRef.current) {
            const predictions = await objectModelRef.current.detect(videoRef.current);
            hasPhone = predictions.some(p => p.class === 'cell phone' && p.score > 0.4);
            if (hasPhone) addViolation(VIOLATION_TYPES.PHONE_DETECTED);
          }

          setDetectionStats(prev => ({ 
            ...prev, 
            face: hasFace, 
            phone: hasPhone, 
            confidence,
            status: 'running'
          }));

          // 3. Lighting Check
          checkLighting(videoRef.current);
        } catch (e) { 
          setDetectionStats(prev => ({ ...prev, status: 'loop error' }));
        }
      }

      // 🎤 Audio Check (Every 500ms)
      if (analyserRef.current && loopCount % 30 === 0) {
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const avg = data.reduce((s, v) => s + v, 0) / data.length;
        setDetectionStats(prev => ({ ...prev, audio: Math.round(avg) }));
        if (avg > 25) addViolation(VIOLATION_TYPES.AUDIO_TALKING); // Lowered threshold from 40 to 25
      }

      detectionLoopRef.current = requestAnimationFrame(runDetection);
    };

    detectionLoopRef.current = requestAnimationFrame(runDetection);
    return () => cancelAnimationFrame(detectionLoopRef.current);
  }, [proctorReady, isActive, modelsLoaded, addViolation]);

  const checkLighting = (video) => {
    const canvas = document.createElement('canvas');
    canvas.width = 40; canvas.height = 30;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, 40, 30);
    const data = ctx.getImageData(0, 0, 40, 30).data;
    let brightness = 0;
    for (let i = 0; i < data.length; i += 4) brightness += (data[i] + data[i+1] + data[i+2]) / 3;
    brightness /= (data.length / 4);
    if (brightness < 15) addViolation(VIOLATION_TYPES.LOW_LIGHTING); // More lenient (from 25 to 15) to avoid false positives in dim rooms
  };

  // ─── 🖥️ System & Activity Listeners ───
  useEffect(() => {
    if (!isActive) return;

    const onVisibility = () => document.hidden && addViolation(VIOLATION_TYPES.TAB_SWITCH);
    const onBlur = () => addViolation(VIOLATION_TYPES.WINDOW_BLUR);
    const onFullscreen = () => {
      if (!document.fullscreenElement) addViolation(VIOLATION_TYPES.FULLSCREEN_EXIT);
    };
    const onCopy = (e) => addViolation(VIOLATION_TYPES.COPY_PASTE);
    const onContextMenu = (e) => { e.preventDefault(); addViolation(VIOLATION_TYPES.RIGHT_CLICK); };
    const onKeyDown = (e) => {
       if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v')) addViolation(VIOLATION_TYPES.COPY_PASTE);
       if (e.altKey && e.key === 'Tab') addViolation(VIOLATION_TYPES.SHORTCUT_DETECTED);
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    document.addEventListener('fullscreenchange', onFullscreen);
    document.addEventListener('copy', onCopy);
    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('fullscreenchange', onFullscreen);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isActive, addViolation]);

  // ─── 🐍 High-Level Python Analysis (Deep Scan) ───
  useEffect(() => {
    if (!proctorReady || !isActive) return;

    const runHighLevelScan = async () => {
      if (!videoRef.current || videoRef.current.videoWidth === 0) return;
      
      try {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);

        const formData = new FormData();
        formData.append('image_data', imageData);

        const response = await fetch('http://localhost:8000/analyze', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();
        if (result.status === 'success' && result.violations.length > 0) {
          result.violations.forEach(v => {
            // Find the full violation config based on the ID returned by Python
            const fullType = Object.values(VIOLATION_TYPES).find(t => t.id === v.id);
            if (fullType) addViolation(fullType);
            else addViolation(v); // Fallback
          });
        }
      } catch (err) {
        // Python service might be still loading or initializing
        console.warn('[PROCTOR] High-Level Service connection issue:', err);
      }
    };

    const interval = setInterval(runHighLevelScan, 4000); // Scan every 4 seconds
    return () => clearInterval(interval);
  }, [proctorReady, isActive, addViolation]);

  return {
    violations,
    violationCount,
    level,
    proctorReady,
    lastViolation,
    videoRef,
    detectionStats,
    stopMedia,
  };
}
