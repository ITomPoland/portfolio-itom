import { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { useAudio } from '../../context/AudioManager';
import { DEBUG_BOOT, bootLog } from '../../utils/debugBoot';

// Reusable SVG Line Component (now accepts ref)
const TearLineSVG = ({ svgPathData, pathLength, strokeDashoffset, pathRef }) => (
  <svg
    className="preloader__overlay"
    viewBox="0 0 100 100"
    preserveAspectRatio="none"
    style={{ pointerEvents: 'none' }}
  >
    <path
      ref={pathRef}
      d={svgPathData}
      fill="none"
      stroke="#1a1a1a"
      strokeWidth="0.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        strokeDasharray: pathLength,
        strokeDashoffset: strokeDashoffset,
      }}
    />
  </svg>
);

// New Ring Loader - Cleaner circle that spins around text
const RingLoader = () => (
  <div className="preloader__ring">
    <svg width="120" height="120" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
      <circle
        cx="50" cy="50" r="45"
        fill="none"
        stroke="#000"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="10 15"
        opacity="0.8"
      />
      <circle
        cx="50" cy="50" r="35"
        fill="none"
        stroke="#000"
        strokeWidth="1"
        strokeLinecap="round"
        strokeDasharray="5 10"
        opacity="0.5"
        style={{
          animation: 'ring-spin-reverse 4s linear infinite',
          transformOrigin: '50% 50%'
        }}
      />
    </svg>
    <style>{`
      @keyframes ring-spin {
        0% { transform: translate(-50%, -50%) rotate(0deg); }
        100% { transform: translate(-50%, -50%) rotate(360deg); }
      }
      @keyframes ring-spin-reverse {
        0% { transform: rotate(360deg); }
        100% { transform: rotate(0deg); }
      }
      .preloader__ring {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 120px;
        height: 120px;
        pointer-events: none;
        z-index: 5;
        animation: ring-spin 10s linear infinite;
      }
    `}</style>
  </div>
);

const percentageStyle = {
  position: 'absolute',
  top: '50%',
  left: '0',
  width: '100%',
  transform: 'translateY(-50%)',
  textAlign: 'center',
  zIndex: 20,
  fontFamily: "'Inter', sans-serif",
  fontSize: '2rem',
  fontWeight: 'bold',
  mixBlendMode: 'multiply',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'visible'
};

const Preloader = ({ onComplete, ready }) => {
  const [isDone, setIsDone] = useState(false);

  // Custom throttled progress state to prevent React 'Maximum update depth exceeded'
  const [realProgress, setRealProgress] = useState(0);
  const [active, setActive] = useState(true);

  useEffect(() => {
    let t = 0;
    const origOnStart = THREE.DefaultLoadingManager.onStart;
    const origOnProgress = THREE.DefaultLoadingManager.onProgress;
    const origOnLoad = THREE.DefaultLoadingManager.onLoad;

    // Debug ledger (?debugboot): tracks LoadingManager items to expose the batch
    // that never settles — counts per URL, since concurrent loads of the same
    // asset start/end an uneven number of times (root cause of fable/012).
    let firstLoadDone = false;
    let restoreLedger = () => {};
    if (DEBUG_BOOT) {
      const mgr = THREE.DefaultLoadingManager;
      const origItemStart = mgr.itemStart.bind(mgr);
      const origItemEnd = mgr.itemEnd.bind(mgr);
      const pendingItems = new Map();
      mgr.itemStart = (url) => {
        pendingItems.set(url, (pendingItems.get(url) ?? 0) + 1);
        if (firstLoadDone) bootLog('item start (post-preload):', url);
        origItemStart(url);
      };
      mgr.itemEnd = (url) => {
        pendingItems.set(url, (pendingItems.get(url) ?? 0) - 1);
        if (firstLoadDone) bootLog('item end (post-preload):', url);
        origItemEnd(url);
      };
      const dumpTimer = setTimeout(() => {
        const unbalanced = [...pendingItems].filter(([, n]) => n !== 0);
        bootLog('items start/end déséquilibrés après 20s:', unbalanced);
      }, 20000);
      restoreLedger = () => {
        mgr.itemStart = origItemStart;
        mgr.itemEnd = origItemEnd;
        clearTimeout(dumpTimer);
      };
    }

    THREE.DefaultLoadingManager.onStart = (url, loaded, total) => {
      setActive(true);
      origOnStart?.(url, loaded, total);
    };

    THREE.DefaultLoadingManager.onProgress = (url, loaded, total) => {
      cancelAnimationFrame(t);
      t = requestAnimationFrame(() => {
        setRealProgress((loaded / total) * 100);
      });
      origOnProgress?.(url, loaded, total);
    };

    THREE.DefaultLoadingManager.onLoad = () => {
      bootLog('LoadingManager onLoad — batch fini');
      firstLoadDone = true;
      cancelAnimationFrame(t);
      setRealProgress(100);
      setActive(false);
      
      const loadEnd = performance.now();
      const loadDuration = ((loadEnd - loadStartTime.current) / 1000).toFixed(2);
      // console.info(`📦 Assets Loaded: ${loadDuration}s`);
      
      origOnLoad?.();
    };

    return () => {
      THREE.DefaultLoadingManager.onStart = origOnStart;
      THREE.DefaultLoadingManager.onProgress = origOnProgress;
      THREE.DefaultLoadingManager.onLoad = origOnLoad;
      restoreLedger();
    };
  }, []);

  const { play } = useAudio();
  // Track audio handle to stop loop
  const pencilSoundRef = useRef(null);

  // Performance Tracking
  const loadStartTime = useRef(performance.now());

  // Use refs for animation targets
  const containerRef = useRef(null);
  const leftHalfRef = useRef(null);
  const rightHalfRef = useRef(null);
  const pathLeftRef = useRef(null);
  const pathRightRef = useRef(null);
  const textLeftRef = useRef(null);
  const textRightRef = useRef(null);

  // Track visual progress entirely in refs to skip React renders 60x/sec!
  const [targetProgress, setTargetProgress] = useState(0);
  const displayProgressRef = useRef(0);
  const trackerRef = useRef({ val: 0 });
  const readyRef = useRef(ready);

  useEffect(() => {
    readyRef.current = ready;
    if (ready) bootLog('Preloader: ready=true → cible 100%');
  }, [ready]);

  // ----------------------------------------
  // GENERATE TEAR PATH
  // ----------------------------------------
  const tearPoints = useMemo(() => {
    const points = [];
    const segments = 12; // Fewer segments

    points.push([50, 0]);

    for (let i = 1; i < segments; i++) {
      const y = (i / segments) * 100;
      const xOffset = (Math.random() - 0.5) * 6;
      const x = 50 + xOffset;
      points.push([x, y]);
    }

    points.push([50, 100]);
    return points;
  }, []);

  const svgPathData = useMemo(() => {
    return tearPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]} `).join(' ');
  }, [tearPoints]);

  const leftClipPoly = useMemo(() => {
    let poly = '0% 0%, ';
    tearPoints.forEach(p => { poly += `${p[0]}% ${p[1]}%, `; });
    poly += '0% 100%';
    return `polygon(${poly})`;
  }, [tearPoints]);

  const rightClipPoly = useMemo(() => {
    let poly = '100% 0%, ';
    poly += '100% 100%, ';
    [...tearPoints].reverse().forEach(p => { poly += `${p[0]}% ${p[1]}%, `; });
    return `polygon(${poly.slice(0, -2)})`;
  }, [tearPoints]);


  // ----------------------------------------
  // SMOOTH LOADING LOGIC
  // ----------------------------------------
  useEffect(() => {
    let newTarget = 0;
    if (ready) {
      // `ready` (sceneReady) is only emitted after the initial preload finished
      // AND the room warmup ran, so the experience is provably usable. Lazy
      // post-preload batches (ville models, room textures, sounds) flip `active`
      // back to true, and their LoadingManager onLoad can never re-fire when
      // itemStart/itemEnd counts drift (three.js quirk with concurrent loads of
      // the same URL). On slow disks those batches overlap `ready`, which froze
      // the preloader at 90% forever (fable/012) — `ready` must always win.
      newTarget = 100;
    } else if (active) {
      newTarget = (realProgress / 100) * 85;
    } else {
      newTarget = 90;
    }

    bootLog('Preloader: newTarget =', newTarget, '| active:', active, 'ready:', ready);
    setTargetProgress(prev => Math.max(prev, newTarget));
  }, [realProgress, active, ready]);

  // Handle Pencil Sound & Exit checking dynamically
  const checkProgressTriggers = (val) => {
    // Pencil Sound
    if (val < 99 && !pencilSoundRef.current) {
      pencilSoundRef.current = play('pencil', { loop: true, volume: 0.5 });
    }
    else if (val >= 99 && pencilSoundRef.current) {
      pencilSoundRef.current.stop();
      pencilSoundRef.current = null;
    }

    // Exit phase
    if (val >= 99.5 && readyRef.current && !exitStarted.current) {
      bootLog('Preloader: seuil 99.5 atteint → startExit');
      exitStarted.current = true;
      startExit();
    }
  };

  useEffect(() => {
    return () => {
      if (pencilSoundRef.current) {
        pencilSoundRef.current.stop();
        pencilSoundRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const distance = targetProgress - displayProgressRef.current;
    let duration = 0.5;

    if (distance > 60) {
      duration = 1.5;
    } else if (distance > 30) {
      duration = 1.0;
    } else if (distance > 10) {
      duration = 0.6;
    } else if (distance > 0) {
      duration = 0.4;
    }

    bootLog('Preloader: tween créé →', targetProgress, '| depuis', displayProgressRef.current.toFixed(1));
    gsap.to(trackerRef.current, {
      val: targetProgress,
      duration: duration,
      ease: "power2.out",
      overwrite: true, // Auto kill previous tweens on trackerRef
      onStart: () => bootLog('Preloader: tween démarré →', targetProgress),
      onComplete: () => bootLog('Preloader: tween fini, val =', trackerRef.current.val.toFixed(1)),
      onUpdate: () => {
        const val = trackerRef.current.val;
        displayProgressRef.current = val;

        const safeProgress = Math.min(100, Math.max(0, val));
        const strokeDashoffset = 120 - (120 * safeProgress) / 100;
        const percentageText = `${Math.round(safeProgress)}%`;

        // Direct DOM manipulation - BYPASS React Render!
        if (textLeftRef.current) textLeftRef.current.innerText = percentageText;
        if (textRightRef.current) textRightRef.current.innerText = percentageText;
        if (pathLeftRef.current) pathLeftRef.current.style.strokeDashoffset = strokeDashoffset;
        if (pathRightRef.current) pathRightRef.current.style.strokeDashoffset = strokeDashoffset;

        checkProgressTriggers(val);
      }
    });

  }, [targetProgress]);


  // ----------------------------------------
  // EXIT SEQUENCE
  // ----------------------------------------
  const exitStarted = useRef(false);

  // Fallback trigger if ready becomes true AFTER 99.5% reached
  useEffect(() => {
    if (displayProgressRef.current >= 99.5 && ready && !exitStarted.current) {
      exitStarted.current = true;
      startExit();
    }
  }, [ready]);

  const startExit = () => {
    bootLog('Preloader: startExit — lancement timeline de sortie');
    exitStarted.current = true;

    if (pencilSoundRef.current) {
      pencilSoundRef.current.stop();
      pencilSoundRef.current = null;
    }
    play('tear', { volume: 0.8 });

    const tl = gsap.timeline({
      onComplete: () => {
        bootLog('Preloader: exit terminé — setIsDone(true)');
        setIsDone(true);
        
        const exitEnd = performance.now();
        const totalDuration = ((exitEnd - loadStartTime.current) / 1000).toFixed(2);
        // console.group("⏱️ Portfolio Loading Performance");
        // console.log(`- Start: %c${loadStartTime.current.toFixed(0)}ms`, "color: #888");
        // console.log(`- Total Duration: %c${totalDuration}s`, "color: #00ff00; font-weight: bold;");
        // console.groupEnd();
        
        onComplete?.();
      }
    });

    // 1. Quick pause before tear
    tl.to({}, { duration: 0.1 });

    // 2. Tear Apart
    tl.to(leftHalfRef.current, {
      xPercent: -100,
      rotation: -2,
      duration: 1.8,
      ease: "power3.inOut"
    }, 'tear');

    tl.to(rightHalfRef.current, {
      xPercent: 100,
      rotation: 2,
      duration: 1.8,
      ease: "power3.inOut"
    }, 'tear');

    // 3. Fade container
    tl.to(containerRef.current, {
      opacity: 0,
      duration: 0.5
    }, '-=0.5');
  };

  if (isDone) return null;

  const pathLength = 120;
  // Initialize values
  const safeProgress = Math.min(100, Math.max(0, displayProgressRef.current));
  const strokeDashoffset = pathLength - (pathLength * safeProgress) / 100;
  const percentageText = `${Math.round(safeProgress)}%`;

  return (
    <div className="preloader" ref={containerRef}>
      {/* LEFT HALF */}
      <div
        className="preloader__half preloader__half--left"
        ref={leftHalfRef}
        style={{ clipPath: leftClipPoly }}
      >
        {/* Content: Percentage & Line */}
        <div className="preloader__percentage" style={percentageStyle}>
          <span ref={textLeftRef}>{percentageText}</span>
          <RingLoader />
        </div>

        {/* SVG is now INSIDE the clipped half */}
        <TearLineSVG pathRef={pathLeftRef} svgPathData={svgPathData} pathLength={pathLength} strokeDashoffset={strokeDashoffset} />
      </div>

      {/* RIGHT HALF */}
      <div
        className="preloader__half preloader__half--right"
        ref={rightHalfRef}
        style={{ clipPath: rightClipPoly }}
      >
        {/* Content: Percentage & Line */}
        <div className="preloader__percentage" style={percentageStyle}>
          <span ref={textRightRef}>{percentageText}</span>
          <RingLoader />
        </div>

        {/* SVG is now INSIDE the clipped half */}
        <TearLineSVG pathRef={pathRightRef} svgPathData={svgPathData} pathLength={pathLength} strokeDashoffset={strokeDashoffset} />
      </div>
    </div>
  );
};

export default Preloader;
