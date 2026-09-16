import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { SETTINGS, detectPerformanceTier, nextLowerTier } from '../config/performance';
export { TIERS } from '../config/performance';

const PerformanceContext = createContext(null);

// The provider and its hook intentionally share one context instance.
// eslint-disable-next-line react-refresh/only-export-components
export const usePerformance = () => {
  const context = useContext(PerformanceContext);
  if (!context) throw new Error('usePerformance must be used within a PerformanceProvider');
  return context;
};

export const PerformanceProvider = ({ children }) => {
  const [tier, setTier] = useState(() =>
    detectPerformanceTier(typeof navigator === 'undefined' ? {} : navigator)
  );
  const downgradeTier = useCallback(() => setTier(nextLowerTier), []);
  const value = useMemo(() => ({
    tier,
    settings: SETTINGS[tier],
    isDetecting: false,
    downgradeTier,
  }), [tier, downgradeTier]);

  return <PerformanceContext.Provider value={value}>{children}</PerformanceContext.Provider>;
};
