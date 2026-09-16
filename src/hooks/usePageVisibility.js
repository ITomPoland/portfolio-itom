import { useEffect, useState } from 'react';

export function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(() =>
    typeof document === 'undefined' || document.visibilityState !== 'hidden'
  );

  useEffect(() => {
    const update = () => setIsVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', update);
    update();
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  return isVisible;
}
