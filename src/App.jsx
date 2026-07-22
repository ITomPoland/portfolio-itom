import { useState, Suspense, useEffect, useCallback, useLayoutEffect, lazy } from 'react';
import { Canvas, useThree, useFrame, useLoader } from '@react-three/fiber';
import { Preload, useTexture, Text, PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';

import Preloader from './components/dom/Preloader';
import { bootLog } from './utils/debugBoot';
import RootErrorBoundary from './components/dom/RootErrorBoundary';
import PaperTransition from './components/dom/PaperTransition';
import { AudioProvider, useAudio } from './context/AudioManager';
import { initAudio } from './utils/audioManager';
import { PerformanceProvider, usePerformance } from './context/PerformanceContext';
import { SceneProvider } from './context/SceneContext';
import NavigationUI from './components/ui/NavigationUI';
import VilleNavToggle from './components/ui/VilleNavToggle';
import VilleThemeToggle from './components/ui/VilleThemeToggle';
import VilleDoorPrompt from './components/ui/VilleDoorPrompt';
import VilleInfoCard from './components/ui/VilleInfoCard';
import VilleSelfieButton from './components/ui/VilleSelfieButton';
import { VILLE_MODE } from './components/canvas/ville/villeConfig';
import GlobalOverlay from './components/ui/GlobalOverlay';
import ScreenReaderOverlay from './components/ui/ScreenReaderOverlay';
import ConsentBanner from './components/ui/ConsentBanner';
import { initAnalytics } from './utils/analytics';

// Initialize PostHog opted-OUT by default (RGPD/CNIL). No capture / no analytics
// cookie until the user accepts via <ConsentBanner />. See utils/analytics.js.
initAnalytics();

// Lazy load the heavy 3D experience
const Experience = lazy(() => import('./components/canvas/Experience'));

import './styles/main.scss';

// --- CONDITIONAL ASSET PRELOADING ---
// On high-end devices, preloads everything for zero stutter.
// On mobile/low-end devices, only preloads core textures to prevent Out Of Memory crashes.
import { 
  ENTRANCE_TEXTURES, 
  CORRIDOR_TEXTURES, 
  UI_TEXTURES,
  PRELOAD_ALL, 
  PRELOAD_LOADER,
  ABOUT_TEXTURES,
  IMAGE_ASSETS,
  filterTexturesByDevice
} from './config/texturePreloadList';
import { TextureLoader } from 'three';

// Standard Browser-level Image Preloader (for <img> tags)
const preloadBrowserImage = (path) => {
  if (typeof window === 'undefined') return;
  const img = new Image();
  img.src = path;
};

const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || '');
const isWeakCPU = typeof navigator.hardwareConcurrency !== 'undefined' && navigator.hardwareConcurrency <= 4;
const isLowRAM = typeof navigator.deviceMemory !== 'undefined' && navigator.deviceMemory <= 4;
const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 450;
const isLowEnd = isMobileDevice || isWeakCPU || isLowRAM || isSmallScreen;

// Refined check for "hover capability" (non-touch devices should have hover: hover)
// Laptops with touch screens (which also have a mouse/trackpad) will return true here.
const supportsHover = typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;

// Trigger Three.js preloads at module level (as standard for Drei)
if (isLowEnd) {
  const CORE_TEXTURES = [...ENTRANCE_TEXTURES, ...CORRIDOR_TEXTURES, ...UI_TEXTURES, ...IMAGE_ASSETS];
  const filteredCore = filterTexturesByDevice(CORE_TEXTURES, supportsHover);
  const filteredAbout = filterTexturesByDevice(ABOUT_TEXTURES, supportsHover);

  filteredCore.forEach(path => useTexture.preload(path));
  filteredAbout.forEach(path => useLoader.preload(TextureLoader, path));
} else {
  const filteredAll = filterTexturesByDevice(PRELOAD_ALL, supportsHover);
  const filteredLoader = filterTexturesByDevice(PRELOAD_LOADER, supportsHover);
  
  filteredAll.forEach(path => useTexture.preload(path));
  filteredLoader.forEach(path => useLoader.preload(TextureLoader, path));
}

// WebGL preflight: with failIfMajorPerformanceCaveat the context creation FAILS
// silently on software-rendered browsers (GPU blocklisted / broken driver) and the
// app would hang behind the preloader forever. Probe once so we can degrade instead.
const detectWebGLSupport = () => {
  try {
    const probe = document.createElement('canvas');
    const strict = { failIfMajorPerformanceCaveat: true };
    if (probe.getContext('webgl2', strict) || probe.getContext('webgl', strict)) return 'hardware';
    if (probe.getContext('webgl2') || probe.getContext('webgl')) return 'software';
    return 'none';
  } catch {
    return 'none';
  }
};
const WEBGL_SUPPORT = detectWebGLSupport();
bootLog('WEBGL_SUPPORT =', WEBGL_SUPPORT);

const FONT_URL = 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff';

// Helper component to handle global audio enable on interaction
const GlobalAudioEnabler = () => {
  const { enableAudio } = useAudio();
  useEffect(() => {
    const handleInteraction = () => enableAudio();
    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('touchstart', handleInteraction, { once: true });
    window.addEventListener('keydown', handleInteraction, { once: true });
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, [enableAudio]);
  return null;
};

// Scene background using corridor wall texture (static, no animation)
const PaperSceneBackground = () => {
  const { scene } = useThree();
  const texture = useTexture('/textures/paper-texture.webp');

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    scene.background = texture;

    return () => {
      scene.background = null;
    };
  }, [scene, texture]);

  return null;
};

function AppContent() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);

  // Use Performance Context
  const { settings, downgradeTier, tier } = usePerformance();

  // Force initialize audio in the background on mount
  useEffect(() => {
    initAudio();
  }, []);

  const handleSceneReady = useCallback(() => {
    bootLog('handleSceneReady appelé — RAF programmé');
    requestAnimationFrame(() => {
      bootLog('sceneReady = true');
      setSceneReady(true);
    });
  }, []);

  // No WebGL at all: a clear message beats an eternal loading screen.
  if (WEBGL_SUPPORT === 'none') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '12px',
        background: '#fafafa', color: '#111', textAlign: 'center',
        padding: '24px', fontFamily: 'Inter, sans-serif'
      }}>
        <h1 style={{ fontSize: '1.4rem', margin: 0 }}>Hakkilo XR</h1>
        <p style={{ maxWidth: '32rem', margin: 0 }}>
          Ce site est une expérience 3D et ton navigateur ne permet pas d&apos;afficher
          la 3D (WebGL désactivé ou indisponible). Essaie un autre navigateur, ou
          réactive l&apos;accélération matérielle dans les réglages.
        </p>
      </div>
    );
  }

  return (
    <AudioProvider>
      <SceneProvider>
        <GlobalAudioEnabler />
        <div className="app">
          {/* Full screen 3D Canvas */}
          <div className="canvas-wrapper">
            <Canvas
              camera={{
                position: [0, 0.2, 28],
                fov: 60,
                near: 0.1,
                far: 150
              }}
              gl={{
                antialias: settings.antialias,
                alpha: false,
                powerPreference: settings.powerPreference,
                localClippingEnabled: true,
                // Only refuse software rendering when hardware WebGL exists —
                // otherwise accept the slow context (PerformanceMonitor will
                // downgrade the tier) instead of hanging at the preloader.
                failIfMajorPerformanceCaveat: WEBGL_SUPPORT === 'hardware'
              }}
              dpr={settings.dpr}
              shadows={settings.shadows}
              onCreated={() => bootLog('Canvas onCreated — contexte WebGL créé')}
            >
              <color attach="background" args={['#fafafa']} />
              <fog attach="fog" args={['#fafafa', 15, 50]} />

              {/* Scale performance down if fps drops */}
              <PerformanceMonitor
                onDecline={() => downgradeTier()}
                flipflops={3}
                onFallback={() => downgradeTier()}
              />

              {/* Advanced FPS & Performance Monitor */}
              {/* <Perf position="top-left" minimal={false} /> */}

              <Suspense fallback={null}>
                <Experience
                  isLoaded={isLoaded}
                  onSceneReady={handleSceneReady}
                  performanceTier={tier}
                />
                <Preload all />
              </Suspense>
            </Canvas>
          </div>

          {/* Navigation UI - Hamburger, Map, Back, Audio */}
          {isLoaded && (
            <>
              <NavigationUI />
              {VILLE_MODE && <VilleNavToggle />}
              {VILLE_MODE && <VilleThemeToggle />}
              {VILLE_MODE && <VilleDoorPrompt />}
              {VILLE_MODE && <VilleInfoCard />}
              {VILLE_MODE && <VilleSelfieButton />}
              <GlobalOverlay />
              <PaperTransition />
              <ScreenReaderOverlay />
            </>
          )}

          {/* RGPD/CNIL analytics consent — shown once until answered */}
          <ConsentBanner />

          {/* 2D Preloader */}
          <Preloader
            ready={sceneReady}
            onComplete={() => setIsLoaded(true)}
          />
        </div>
      </SceneProvider>
    </AudioProvider>
  );
}

import { AchievementsProvider } from './context/AchievementsContext';

export default function App() {
  // Preload browser-based images (for standard <img> tags) immediately upon mounting App
  // This ensures they are in the network waterfall during the initial loading phase.
  useEffect(() => {
    const filteredImages = filterTexturesByDevice(IMAGE_ASSETS, supportsHover);
    // console.log(`[Preload] Triggering browser-level image preloads for ${filteredImages.length} assets.`);
    filteredImages.forEach(path => preloadBrowserImage(path));
  }, []);

  return (
    <RootErrorBoundary>
      <PerformanceProvider>
        <AchievementsProvider>
          <AppContent />
        </AchievementsProvider>
      </PerformanceProvider>
    </RootErrorBoundary>
  );
}
