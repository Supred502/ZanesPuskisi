import React, { useEffect, useState, useRef } from "react";

export default function ImageRotator({
  images = [],
  autoRotateInterval = 3000,
  className = "",
  imgClassName = "",
}) {
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

  // 🔥 Rotate WITHOUT unmounting images
  useEffect(() => {
    if (imageCount < 2) return;
    const id = setInterval(() => {
      setCurrent((c) => (c + 1) % imageCount);
    }, autoRotateInterval);
    return () => clearInterval(id);
  }, [imageCount, autoRotateInterval]);

  const currSrc = images[current];

  return (
    <div className={`relative w-full h-full ${className}`} style={{ overflow: "hidden" }}>
      {images.map((src, idx) => (
        <img
          key={src} // important for caching
          src={src}
          loading="lazy"
          className={imgClassName}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: idx === current ? 1 : 0,
            transition: "opacity 500ms ease",
          }}
        />
      ))}
    </div>
  );
}
