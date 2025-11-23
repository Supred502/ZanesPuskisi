import React, { createContext, useCallback, useEffect, useRef, useState } from "react";

// RotationContext provides a shared "tick" signal that ImageRotator instances
// can subscribe to so multiple rotators update in sync. The provider runs
// a single interval that increments an internal counter which consumers watch.
export const RotationContext = createContext({
  tick: 0,
  interval: 3000,
  setIntervalMs: () => {},
  running: true,
  start: () => {},
  stop: () => {},
});

export function RotationProvider({ children, interval = 3000 }) {
  const [tick, setTick] = useState(0);
  const [running, setRunning] = useState(true);
  const intervalRef = useRef(interval);
  const timerRef = useRef(null);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    clear();
    if (running) {
      timerRef.current = setInterval(() => {
        setTick((t) => t + 1);
      }, intervalRef.current);
    }
    return () => clear();
  }, [running, clear]);

  const setIntervalMs = useCallback((ms) => {
    intervalRef.current = ms;
    // restart
    clear();
    if (running) {
      timerRef.current = setInterval(() => setTick((t) => t + 1), ms);
    }
  }, [running, clear]);

  const start = useCallback(() => setRunning(true), []);
  const stop = useCallback(() => setRunning(false), []);

  return (
    <RotationContext.Provider
      value={{ tick, interval: intervalRef.current, setIntervalMs, running, start, stop }}
    >
      {children}
    </RotationContext.Provider>
  );
}

export default RotationProvider;
