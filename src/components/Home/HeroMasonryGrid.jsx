import React, { useEffect, useMemo, useState } from "react";
import useReadImages from "../../hooks/useReadImages";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(!!mq.matches);
    update();

    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", update);
      return () => mq.removeEventListener("change", update);
    }

    mq.addListener(update);
    return () => mq.removeListener(update);
  }, []);

  return reduced;
}

export default function HeroMasonryGrid() {
  const allUrls = useReadImages();
  const prefersReducedMotion = usePrefersReducedMotion();

  const urls = useMemo(() => {
    // Use most-recently-seen first.
    return allUrls.slice(-60).reverse();
  }, [allUrls]);

  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  useEffect(() => {
    let rafId = 0;
    function onResize() {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        setWindowWidth(window.innerWidth);
      });
    }
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      window.removeEventListener("resize", onResize);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  const columnsCount =
    windowWidth >= 1280 ? 6 : windowWidth >= 1024 ? 5 : windowWidth >= 768 ? 4 : windowWidth >= 640 ? 3 : 2;

  const columns = useMemo(() => {
    const cols = Array.from({ length: columnsCount }, () => []);
    for (let i = 0; i < urls.length; i += 1) {
      cols[i % columnsCount].push(urls[i]);
    }
    return cols;
  }, [urls, columnsCount]);

  if (!urls || urls.length === 0) return null;

  return (
    <div className="zp-hero-masonry" aria-hidden="true">
      <div className="zp-hero-masonry__viewport" style={{ "--zp-cols": columnsCount }}>
        <div className="zp-hero-masonry__columns">
          {columns.map((col, colIndex) => {
            const base = col.filter(Boolean);
            if (base.length === 0) return <div key={`c-${colIndex}`} />;

            const shouldAnimate = !prefersReducedMotion && base.length >= 4;
            const dir = colIndex % 2 === 0 ? "up" : "down";
            const duration = Math.max(18, Math.min(44, base.length * 3.2));
            const track = shouldAnimate ? [...base, ...base] : base;

            return (
              <div key={`c-${colIndex}`} className="zp-hero-masonry__col">
                <div
                  className="zp-hero-masonry__track"
                  data-dir={dir}
                  style={
                    shouldAnimate
                      ? {
                          animationDuration: `${duration}s`,
                        }
                      : undefined
                  }
                >
                  {track.map((src, i) => (
                    <div key={`${src}-${i}`} className="zp-hero-masonry__tile">
                      <img
                        src={src}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="zp-hero-masonry__img"
                        draggable={false}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
