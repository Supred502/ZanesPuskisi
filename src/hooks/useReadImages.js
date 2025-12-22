import { useMemo, useSyncExternalStore } from "react";
import readImagesStore from "../utils/readImagesStore";

export default function useReadImages() {
  const snapshot = useSyncExternalStore(
    readImagesStore.subscribe,
    readImagesStore.getSnapshot,
    readImagesStore.getSnapshot
  );

  return useMemo(() => {
    // Keep stable ordering for nicer layout changes.
    // (Set iteration is insertion-ordered; we preserve that.)
    return Array.isArray(snapshot) ? snapshot : [];
  }, [snapshot]);
}
