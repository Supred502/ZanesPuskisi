import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RotationContext } from "./rotation-context";

export function RotationProvider({ children, interval = 3000 }) {
  const [tick, setTick] = useState(0);
  const [running, setRunning] = useState(true);
  const [intervalMs, setIntervalMsState] = useState(interval);
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
      }, intervalMs);
    }
    return () => clear();
  }, [running, intervalMs, clear]);

  const setIntervalMs = useCallback((ms) => {
    setIntervalMsState(ms);
  }, []);

  const start = useCallback(() => setRunning(true), []);
  const stop = useCallback(() => setRunning(false), []);

  const value = useMemo(
    () => ({ tick, interval: intervalMs, setIntervalMs, running, start, stop }),
    [tick, intervalMs, setIntervalMs, running, start, stop]
  );

  return <RotationContext.Provider value={value}>{children}</RotationContext.Provider>;
}

export default RotationProvider;
