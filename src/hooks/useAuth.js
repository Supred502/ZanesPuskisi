import { useMemo, useSyncExternalStore } from "react";
import { getSnapshot, subscribe } from "../stores/authStore";

export default function useAuth() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return useMemo(() => {
    const status = snap?.status || "unknown";
    const user = snap?.user || null;
    const optimisticUser = snap?.optimisticUser || null;
    const ready = status !== "unknown";
    return { status, ready, user, optimisticUser };
  }, [snap]);
}
