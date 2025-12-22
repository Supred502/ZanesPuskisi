import React, { useMemo, useState } from "react";
import normalizeFirebaseStorageUrl from "../utils/normalizeFirebaseStorageUrl";

export default function ProgressiveImage({
  src,
  alt,
  className,
  style,
  objectFit = "cover",
  loading = "lazy",
  decoding = "async",
  fetchPriority,
}) {
  const normalized = useMemo(
    () => (src ? normalizeFirebaseStorageUrl(src) : ""),
    [src]
  );
  const [loadedSrc, setLoadedSrc] = useState("");
  const loaded = !!normalized && loadedSrc === normalized;

  if (!normalized) return null;

  return (
    <img
      src={normalized}
      alt={alt}
      loading={loading}
      decoding={decoding}
      fetchPriority={fetchPriority}
      className={className}
      onLoad={(e) => {
        try {
          const img = e.currentTarget;
          if (img?.decode) {
            img.decode().then(() => setLoadedSrc(normalized)).catch(() => setLoadedSrc(normalized));
          } else {
            setLoadedSrc(normalized);
          }
        } catch {
          setLoadedSrc(normalized);
        }
      }}
      style={{
        ...style,
        objectFit,
        filter: loaded ? "none" : "blur(14px)",
        transform: loaded ? "none" : "scale(1.02)",
        transition: "filter 240ms ease, transform 240ms ease, opacity 240ms ease",
        opacity: loaded ? 1 : 0.92,
      }}
    />
  );
}
