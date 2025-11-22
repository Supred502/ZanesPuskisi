import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";

const ImageRotator = forwardRef(function ImageRotator(
  {
    images = [],
    fallback,
    autoRotateInterval = 3000,
    pause = false,
    setPause, // optional setter to notify parent when paused by interaction
    pauseOnInteraction = false,
    current: controlledCurrent,
    onChangeCurrent,
    className = "",
    imgClassName = "",
    onImageClick,
    onIndexChange,
    useClock = false, // if true, compute index from Date.now() so different instances stay in phase
  }, ref
) {
  const isControlled = controlledCurrent !== undefined && onChangeCurrent;
  const [current, setCurrent] = useState(0);
  const [prevIndex, setPrevIndex] = useState(null);
  const [showCurrent, setShowCurrent] = useState(true);
  const [internalPaused, setInternalPaused] = useState(false);
  const mountedRef = useRef(false);

  const imageCount = images ? images.length : 0;
  const effectivePause = pause || internalPaused;

  useEffect(() => {
    mountedRef.current = true;
    return () => (mountedRef.current = false);
  }, []);

  // ensure current is within bounds when images change
  useEffect(() => {
    if (imageCount === 0) {
      if (!isControlled) setCurrent(0);
      setPrevIndex(null);
      return;
    }
    if (isControlled) {
      if (controlledCurrent >= imageCount) onChangeCurrent(0);
    } else {
      if (current >= imageCount) setCurrent(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageCount]);

  // time-based rotation: compute index from clock so multiple instances stay in sync
  const computeTimeIndex = () => {
    if (!imageCount) return 0;
    return Math.floor(Date.now() / autoRotateInterval) % imageCount;
  };

  // timer tick: either update from clock or advance interval when not using clock
  useEffect(() => {
    if (imageCount < 2) return undefined;
    if (effectivePause) return undefined;

    let id = null;
    if (useClock) {
      // check periodically for index change (every 500ms)
      id = setInterval(() => {
        const idx = computeTimeIndex();
        if (isControlled) {
          onChangeCurrent(idx);
        } else {
          setCurrent((prev) => {
            if (prev === idx) return prev;
            setPrevIndex(prev);
            // trigger fade: hide then show
            setShowCurrent(false);
            const next = idx;
            setTimeout(() => {
              if (!mountedRef.current) return;
              setShowCurrent(true);
            }, 20);
            if (typeof onIndexChange === 'function') onIndexChange(next);
            return next;
          });
        }
      }, Math.max(200, Math.min(800, autoRotateInterval / 6)));
    } else {
      id = setInterval(() => {
        if (isControlled) onChangeCurrent((controlledCurrent + 1) % imageCount);
        else setCurrent((c) => {
          setPrevIndex(c);
          setShowCurrent(false);
          const next = (c + 1) % imageCount;
          setTimeout(() => {
            if (!mountedRef.current) return;
            setShowCurrent(true);
          }, 20);
          if (typeof onIndexChange === 'function') onIndexChange(next);
          return next;
        });
      }, autoRotateInterval);
    }

    return () => {
      if (id) clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageCount, effectivePause, autoRotateInterval, useClock]);

  // when controlled current changes, update prev index to animate
  useEffect(() => {
    if (!isControlled) return;
    setPrevIndex((p) => (p === controlledCurrent ? p : p ?? controlledCurrent));
    // animate controlled change
    setShowCurrent(false);
    setTimeout(() => {
      if (!mountedRef.current) return;
      setShowCurrent(true);
    }, 20);
    if (typeof onIndexChange === 'function') onIndexChange(controlledCurrent);
  }, [controlledCurrent, isControlled]);

  const currentIndex = isControlled ? controlledCurrent : current;

  const handleInteraction = (idx) => {
    if (pauseOnInteraction) {
      setInternalPaused(true);
      if (setPause) try { setPause(true); } catch {}
    }
    if (isControlled) onChangeCurrent(idx);
    else {
      setPrevIndex(currentIndex);
      setCurrent(idx);
    }
    if (onImageClick) onImageClick(idx);
  };

  // imperative API for parents
  useImperativeHandle(ref, () => ({
    next: () => {
      if (imageCount < 1) return;
      const nxt = (currentIndex + 1) % imageCount;
      if (isControlled) onChangeCurrent(nxt);
      else {
        setPrevIndex(currentIndex);
        setCurrent(nxt);
      }
    },
    prev: () => {
      if (imageCount < 1) return;
      const prv = (currentIndex - 1 + imageCount) % imageCount;
      if (isControlled) onChangeCurrent(prv);
      else {
        setPrevIndex(currentIndex);
        setCurrent(prv);
      }
    },
    setCurrent: (i) => {
      if (isControlled) onChangeCurrent(i);
      else {
        setPrevIndex(currentIndex);
        setCurrent(i);
      }
    },
    pause: () => {
      setInternalPaused(true);
      if (setPause) try { setPause(true); } catch {}
    },
    resume: () => {
      setInternalPaused(false);
      if (setPause) try { setPause(false); } catch {}
    },
  }));

  const prevSrc = prevIndex != null && images[prevIndex] ? images[prevIndex] : null;
  const currSrc = imageCount ? images[currentIndex] : null;

  return (
    <div className={`relative w-full h-full ${className}`} style={{ overflow: 'hidden' }}>
      {/* previous image (fading out) */}
      {prevSrc && prevSrc !== currSrc && (
        <img
          src={prevSrc}
          alt="prev"
          className={`${imgClassName}`}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'opacity 500ms ease',
            opacity: showCurrent ? 0 : 1,
          }}
        />
      )}

      {/* current image (visible) */}
      {currSrc ? (
        <img
          src={currSrc}
          alt="current"
          onClick={() => handleInteraction(currentIndex)}
          className={`${imgClassName}`}
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            transition: 'opacity 500ms ease',
            opacity: showCurrent ? 1 : 0,
          }}
        />
      ) : (
        fallback && (
          <div className="w-full h-full flex items-center justify-center" onClick={() => handleInteraction(0)}>
            {fallback}
          </div>
        )
      )}
    </div>
  );
});

export default ImageRotator;
