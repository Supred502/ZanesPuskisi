import React, {
  useEffect,
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
  useContext,
  useCallback,
  useMemo,
} from "react";
import { RotationContext } from "../contexts/rotation-context";
import normalizeFirebaseStorageUrl from "../utils/normalizeFirebaseStorageUrl";

export default forwardRef(function ImageRotator({
  images = [],
  autoRotateInterval = 3000,
  className = "",
  imgClassName = "",
  objectFit = "cover",
  onImageClick,
  onIndexChange,
  pauseOnInteraction = false,
  pause: externalPause,
  setPause: externalSetPause,
  useClock = false,
  priority = false,
  preloadAdjacent = true,
  fallback = null,
  alt = "",
  ...rest
}, ref) {
  const normalizedImages = useMemo(() => {
    return Array.isArray(images)
      ? images.map((u) => normalizeFirebaseStorageUrl(u))
      : [];
  }, [images]);
  const imageCount = normalizedImages.length;
  const [current, setCurrent] = useState(0);

  // Preload only adjacent images to avoid downloading everything.
  const cacheRef = useRef({});

  const clampIndex = useCallback(
    (i) => {
      if (!imageCount) return 0;
      return Math.max(0, Math.min(i, imageCount - 1));
    },
    [imageCount]
  );

  // Keep a short-lived previous image for fade transitions.
  const [prevIndex, setPrevIndex] = useState(null);
  const [fadeIn, setFadeIn] = useState(true);

  // Progressive loading state (per URL): start blurred until the image is decoded.
  const [loadedUrls, setLoadedUrls] = useState(() => new Set());

  const markLoaded = useCallback((url) => {
    if (!url) return;
    setLoadedUrls((prev) => {
      if (prev.has(url)) return prev;
      const next = new Set(prev);
      next.add(url);
      return next;
    });
  }, []);

  const isLoaded = useCallback(
    (url) => {
      return !!url && loadedUrls.has(url);
    },
    [loadedUrls]
  );

  const setCurrentWithFade = useCallback(
    (nextOrUpdater) => {
      setCurrent((prev) => {
        const nextRaw =
          typeof nextOrUpdater === "function" ? nextOrUpdater(prev) : nextOrUpdater;
        const next = clampIndex(nextRaw);
        if (next === prev) return prev;
        setPrevIndex(prev);
        setFadeIn(false);
        return next;
      });
    },
    [clampIndex]
  );

  useEffect(() => {
    if (prevIndex === null) return;
    const raf = requestAnimationFrame(() => setFadeIn(true));
    const t = setTimeout(() => setPrevIndex(null), 520);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [prevIndex, current]);

  useEffect(() => {
    if (!preloadAdjacent) return;
    if (!imageCount) return;
    const nextUrl = normalizedImages[(current + 1) % imageCount];
    const prevUrl = normalizedImages[(current - 1 + imageCount) % imageCount];

    const urls = [nextUrl, prevUrl].filter(Boolean);
    if (urls.length === 0) return;

    const cb = () => {
      for (const url of urls) {
        if (!url) continue;
        if (!cacheRef.current[url]) {
          const img = new Image();
          img.decoding = "async";
          img.src = url;
          cacheRef.current[url] = img;
        }
      }
    };

    const idle = (window.requestIdleCallback || ((fn) => setTimeout(fn, 150)))(cb);
    return () => {
      if (window.cancelIdleCallback) {
        try {
          window.cancelIdleCallback(idle);
        } catch {
          // ignore
        }
      } else {
        clearTimeout(idle);
      }
    };
  }, [normalizedImages, imageCount, current, preloadAdjacent]);

  // local pause state (used if parent doesn't control pause)
  const [internalPaused, setInternalPaused] = useState(false);
  const paused = typeof externalPause === "boolean" ? externalPause : internalPaused;
  const setPausedLocal = typeof externalSetPause === "function" ? externalSetPause : setInternalPaused;

  const rotation = useContext(RotationContext);

  // Rotation behavior:
  // - If `useClock` is true, listen to the shared rotation tick and advance
  //   in sync with other rotators. This keeps modal and grid in-step.
  // - Otherwise, fall back to local interval behavior.
  useEffect(() => {
    if (useClock) return; // global clock handled separately
    if (imageCount < 2 || paused) return;
    const id = setInterval(() => {
      setCurrentWithFade((c) => (c + 1) % imageCount);
    }, autoRotateInterval);
    return () => clearInterval(id);
  }, [imageCount, autoRotateInterval, paused, useClock, setCurrentWithFade]);

  // Respond to shared rotation tick when `useClock` is enabled.
  useEffect(() => {
    if (!useClock) return;
    if (!rotation) return;
    // advance when the global tick changes, unless paused or not enough images
    if (imageCount < 2 || paused) return;
    // schedule update async to avoid sync state update inside effect
    const t = setTimeout(() => setCurrentWithFade((c) => (c + 1) % imageCount), 0);
    return () => clearTimeout(t);
    // run whenever rotation.tick changes (dependency below)
  }, [rotation, rotation?.tick, imageCount, paused, useClock, setCurrentWithFade]);

  // notify parent when index changes
  useEffect(() => {
    if (typeof onIndexChange === "function") onIndexChange(current);
  }, [current, onIndexChange]);

  // expose imperative controls to parent via ref
  useImperativeHandle(ref, () => ({
    next: () => setCurrentWithFade((c) => (imageCount ? (c + 1) % imageCount : 0)),
    prev: () => setCurrentWithFade((c) => (imageCount ? (c - 1 + imageCount) % imageCount : 0)),
    pause: () => setPausedLocal(true),
    resume: () => setPausedLocal(false),
    setCurrent: (i) => setCurrentWithFade(i),
  }));

  const handleClick = (idx) => {
    if (typeof onImageClick === "function") onImageClick(idx);
    if (pauseOnInteraction) setPausedLocal(true);
  };

  return (
    <div className={`relative w-full h-full ${className}`} style={{ overflow: "hidden" }} {...rest}>
      {imageCount === 0 && fallback}
      {imageCount > 0 && prevIndex !== null && normalizedImages[prevIndex] && (
        <img
          key={`prev-${normalizedImages[prevIndex]}-${prevIndex}`}
          src={normalizedImages[prevIndex]}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          alt={alt}
          className={imgClassName}
          onClick={() => handleClick(prevIndex)}
          onLoad={(e) => {
            const url = normalizedImages[prevIndex];
            try {
              const img = e.currentTarget;
              if (img?.decode) {
                img.decode().then(() => markLoaded(url)).catch(() => markLoaded(url));
              } else {
                markLoaded(url);
              }
            } catch {
              markLoaded(url);
            }
          }}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: objectFit,
            opacity: fadeIn ? 0 : 1,
            transition: "opacity 500ms ease",
            cursor: onImageClick ? "pointer" : undefined,
            filter: isLoaded(normalizedImages[prevIndex]) ? "none" : "blur(14px)",
            transform: isLoaded(normalizedImages[prevIndex]) ? "none" : "scale(1.02)",
          }}
        />
      )}

      {imageCount > 0 && normalizedImages[current] && (
        <img
          key={`cur-${normalizedImages[current]}-${current}`}
          src={normalizedImages[current]}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          alt={alt}
          className={imgClassName}
          onClick={() => handleClick(current)}
          onLoad={(e) => {
            const url = normalizedImages[current];
            try {
              const img = e.currentTarget;
              if (img?.decode) {
                img.decode().then(() => markLoaded(url)).catch(() => markLoaded(url));
              } else {
                markLoaded(url);
              }
            } catch {
              markLoaded(url);
            }
          }}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: objectFit,
            opacity: prevIndex !== null ? (fadeIn ? 1 : 0) : 1,
            transition: "opacity 500ms ease",
            cursor: onImageClick ? "pointer" : undefined,
            filter: isLoaded(normalizedImages[current]) ? "none" : "blur(14px)",
            transform: isLoaded(normalizedImages[current]) ? "none" : "scale(1.02)",
          }}
        />
      )}
    </div>
  );
});
