import React from "react";
import HeroMasonryGrid from "./HeroMasonryGrid.jsx";

export default function Hero() {
  return (
    <section className="hero">
      <div className="site-container" style={{minHeight: 'var(--hero-height)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
        <h2 className="text-4xl font-bold mb-4" style={{color: 'var(--hero-text)'}}>Laipni lūgti ZanesPušķīšos!</h2>
        <p className="text-lg" style={{color: 'var(--muted)'}}>Roku darbs ziedi un dekori katrai īpašai dienai</p>
        <HeroMasonryGrid />
      </div>
    </section>
  );
}
