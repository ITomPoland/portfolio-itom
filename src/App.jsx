import { useState, Suspense, useEffect, useCallback, lazy } from 'react';
import { Canvas } from '@react-three/fiber';
import { useTexture, PerformanceMonitor } from '@react-three/drei';
import Preloader from './components/dom/Preloader';
import PaperTransition from './components/dom/PaperTransition';
import { AudioProvider, useAudio } from './context/AudioManager';
import { PerformanceProvider, usePerformance } from './context/PerformanceContext';
import { SceneProvider, useScene } from './context/SceneContext';
import { AchievementsProvider } from './context/AchievementsContext';
import NavigationUI from './components/ui/NavigationUI';
import GlobalOverlay from './components/ui/GlobalOverlay';
import ScreenReaderOverlay from './components/ui/ScreenReaderOverlay';
import { useDocumentMeta } from './hooks/useDocumentMeta';
import { usePageVisibility } from './hooks/usePageVisibility';
import { initAnalytics } from './services/analytics';
import { ENTRANCE_TEXTURES, filterTexturesByDevice } from './config/texturePreloadList';
import './styles/main.scss';

// Optional analytics should not be part of the critical 3D startup bundle.
initAnalytics();

const Experience = lazy(() => import('./components/canvas/Experience'));
const supportsHover = typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;

// Prioritize entrance assets only. Room assets load on entry, not behind the
// initial loading screen, competing for bandwidth and GPU memory.
filterTexturesByDevice(ENTRANCE_TEXTURES, supportsHover).forEach(path => useTexture.preload(path));

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

function DocumentMetaBridge() {
  useDocumentMeta();
  const { initialRoom, deeplinkHandled, hasEntered, teleportTo } = useScene();

  useEffect(() => {
    if (initialRoom && hasEntered && !deeplinkHandled.current) {
      const timer = setTimeout(() => {
        deeplinkHandled.current = true;
        teleportTo(initialRoom);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [initialRoom, hasEntered, teleportTo, deeplinkHandled]);

  return null;
}

function AppContent() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const isPageVisible = usePageVisibility();
  const { settings, downgradeTier, tier } = usePerformance();
  const handleSceneReady = useCallback(() => setSceneReady(true), []);

  return (
    <AudioProvider>
      <SceneProvider>
        <DocumentMetaBridge />
        <GlobalAudioEnabler />
        <div className="app">
          <div className="canvas-wrapper">
            <Canvas
              onPointerMissed={() => {
                window.dispatchEvent(new CustomEvent('portraitInspectExit'));
              }}
              camera={{ position: [0, 0.2, 28], fov: 60, near: 0.1, far: 150 }}
              gl={{
                antialias: settings.antialias,
                alpha: false,
                powerPreference: settings.powerPreference,
                localClippingEnabled: true,
                failIfMajorPerformanceCaveat: true
              }}
              dpr={settings.dpr}
              shadows={settings.shadows}
              frameloop={isPageVisible ? 'always' : 'never'}
            >
              <color attach="background" args={['#fafafa']} />
              <fog attach="fog" args={['#fafafa', 15, 50]} />
              <PerformanceMonitor
                onDecline={downgradeTier}
                flipflops={3}
                onFallback={downgradeTier}
              />
              <Suspense fallback={null}>
                <Experience
                  isLoaded={isLoaded}
                  onSceneReady={handleSceneReady}
                  performanceTier={tier}
                />
              </Suspense>
            </Canvas>
          </div>

          {isLoaded && (
            <>
              <NavigationUI />
              <GlobalOverlay />
              <PaperTransition />
              <ScreenReaderOverlay />
            </>
          )}
          <Preloader ready={sceneReady} onComplete={() => setIsLoaded(true)} />
        </div>
      </SceneProvider>
    </AudioProvider>
  );
}

export default function App() {
  return (
    <PerformanceProvider>
      <AchievementsProvider>
        <AppContent />
      </AchievementsProvider>
    </PerformanceProvider>
  );
}
