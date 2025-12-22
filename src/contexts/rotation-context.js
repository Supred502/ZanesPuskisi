import { createContext } from "react";

// RotationContext provides a shared "tick" signal that ImageRotator instances
// can subscribe to so multiple rotators update in sync.
export const RotationContext = createContext({
  tick: 0,
  interval: 3000,
  setIntervalMs: () => {},
  running: true,
  start: () => {},
  stop: () => {},
});
