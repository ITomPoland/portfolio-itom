import { createContext, useContext, useState, useEffect } from "react";
import { useThree } from "@react-three/fiber";

/**
 * Performance Tiers enumeration.
 * - HIGH: Full DPR up to 2x, shadows enabled, anti-aliasing on, 100% particles.
 * - MEDIUM: DPR capped at 1.5x, shadows disabled, anti-aliasing on, 60% particles.
 * - LOW: DPR 0.8x-1x, shadows disabled, anti-aliasing off, 30% particles.
 */
export const TIERS = {
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
};

// Settings for each tier
const SETTINGS = {
  [TIERS.HIGH]: {
    dpr: [1, 2], // Allow up to 2x pixel density
    shadows: true, // Enable shadows
    antialias: true,
    powerPreference: "high-performance",
    physicsStep: 1 / 60,
    textureQuality: "high",
    particleCount: 1.0, // 100% particles
  },
  [TIERS.MEDIUM]: {
    dpr: [1, 1.5], // Cap at 1.5x on mobile to balance quality and GPU fillrate
    shadows: false, // Disable shadows for better mobile performance
    antialias: true,
    powerPreference: "default",
    physicsStep: 1 / 60,
    textureQuality: "medium",
    particleCount: 0.6, // 60% particles
  },
  [TIERS.LOW]: {
    dpr: [0.8, 1], // Minimum 0.8x pixel density to avoid extreme pixelation
    shadows: false, // Disable shadows completely
    antialias: false, // Disable AA to maximize FPS
    powerPreference: "low-power",
    physicsStep: 1 / 45, // Slower physics updates if needed
    textureQuality: "low",
    particleCount: 0.3, // 30% particles
  },
};

const PerformanceContext = createContext(null);

/**
 * Custom React hook to access PerformanceContext settings and tier state.
 *
 * @throws {Error} Throws an error if used outside of a PerformanceProvider.
 * @returns {{ tier: string, settings: Object, isDetecting: boolean, downgradeTier: Function }}
 */
export const usePerformance = () => {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error("usePerformance must be used within a PerformanceProvider");
  }
  return context;
};

/**
 * PerformanceProvider Component.
 *
 * Auto-detects device capabilities on mount (mobile UA, CPU cores, RAM)
 * and exposes active tier settings. Supports dynamic tier downgrading via PerformanceMonitor.
 *
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - Children to wrap with context.
 * @returns {React.ReactElement} Provider wrapped children.
 */
export const PerformanceProvider = ({ children }) => {
  const [tier, setTier] = useState(TIERS.HIGH); // Default to HIGH, degrade if needed
  const [isDetecting, setIsDetecting] = useState(true);

  useEffect(() => {
    const detectTier = () => {
      let detectedTier = TIERS.HIGH;

      // 1. Mobile Check
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        detectedTier = TIERS.MEDIUM;
      }

      // 2. Hardware Concurrency (CPU Cores)
      // Low-end devices usually have 4 or fewer cores
      if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) {
        detectedTier = isMobile ? TIERS.LOW : TIERS.MEDIUM;
      }

      // 3. GPU/FPS Estimate (Simplistic)
      // Override for very weak hardware or low RAM (<= 4GB)
      if (navigator.deviceMemory && navigator.deviceMemory <= 4) {
        detectedTier = TIERS.LOW;
      }
      
      // Removed small screen heuristic because modern phones have CSS width < 430px (e.g. iPhone 15 Pro Max is 430px)

      // console.log(
      //   `[Performance] Detected Tier: ${detectedTier} | Cores: ${navigator.hardwareConcurrency} | Mobile: ${isMobile}`
      // );
      setTier(detectedTier);
      setIsDetecting(false);
    };

    detectTier();
  }, []);

  // Function to manually downgrade tier (called by PerformanceMonitor)
  const downgradeTier = () => {
    setTier((current) => {
      if (current === TIERS.HIGH) return TIERS.MEDIUM;
      if (current === TIERS.MEDIUM) return TIERS.LOW;
      return TIERS.LOW;
    });
  };

  const value = {
    tier,
    settings: SETTINGS[tier],
    isDetecting,
    downgradeTier,
  };

  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  );
};
