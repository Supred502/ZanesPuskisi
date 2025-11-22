import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle } from "react";

export default forwardRef(function ImageRotator({
  images = [],
  autoRotateInterval = 3000,
  className = "",
  imgClassName = "",
  onImageClick,
  onIndexChange,
  pauseOnInteraction = false,
  pause: externalPause,
  setPause: externalSetPause,
  ...rest
}, ref) {
  const imageCount = images.length;
  const [current, setCurrent] = useState(0);
  // 🔥 cache: preload all images once
  const cacheRef = useRef({});
  useEffect(() => {
    images.forEach((url) => {
      if (!cacheRef.current[url]) {
        const img = new Image();
        img.src = url;
        cacheRef.current[url] = img;
      }
    });
  }, [images]);

  // local pause state (used if parent doesn't control pause)
  const [internalPaused, setInternalPaused] = useState(false);
  const paused = typeof externalPause === "boolean" ? externalPause : internalPaused;
  const setPausedLocal = typeof externalSetPause === "function" ? externalSetPause : setInternalPaused;

  // 🔥 Rotate WITHOUT unmounting images
  useEffect(() => {
    if (imageCount < 2 || paused) return;
    const id = setInterval(() => {
      setCurrent((c) => (c + 1) % imageCount);
    }, autoRotateInterval);
    return () => clearInterval(id);
  }, [imageCount, autoRotateInterval, paused]);

  // notify parent when index changes
  useEffect(() => {
    if (typeof onIndexChange === "function") onIndexChange(current);
  }, [current, onIndexChange]);

  // expose imperative controls to parent via ref
  useImperativeHandle(ref, () => ({
    next: () => setCurrent((c) => (imageCount ? (c + 1) % imageCount : 0)),
    prev: () => setCurrent((c) => (imageCount ? (c - 1 + imageCount) % imageCount : 0)),
    pause: () => setPausedLocal(true),
    resume: () => setPausedLocal(false),
    setCurrent: (i) => setCurrent(Math.max(0, Math.min(i, Math.max(0, imageCount - 1)))),
  }));

  const handleClick = (idx) => {
    if (typeof onImageClick === "function") onImageClick(idx);
    if (pauseOnInteraction) setPausedLocal(true);
  };

  return (
    <div className={`relative w-full h-full ${className}`} style={{ overflow: "hidden" }} {...rest}>
      {images.map((src, idx) => (
        <img
          key={src || idx}
          src={src}
          loading="lazy"
          className={imgClassName}
          onClick={() => handleClick(idx)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: idx === current ? 1 : 0,
            transition: "opacity 500ms ease",
            cursor: onImageClick ? "pointer" : undefined,
          }}
        />
      ))}
    </div>
  );
});
