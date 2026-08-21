import { useEffect, useRef, useState, useCallback } from 'react';

/** Timer de repos simple (compte à rebours en secondes). */
export function useRestTimer() {
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running && remaining > 0) {
      ref.current = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    }
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [running, remaining]);

  useEffect(() => { if (remaining === 0) setRunning(false); }, [remaining]);

  const startRest = useCallback((seconds: number) => { setRemaining(seconds); setRunning(true); }, []);
  const stopRest = useCallback(() => { setRunning(false); setRemaining(0); }, []);
  return { remaining, running, startRest, stopRest };
}
