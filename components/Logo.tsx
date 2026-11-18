import { SITE_NAME } from "@/lib/site";

// The dandelion from the owner's logo concept: gold stalks radiating from a glowing gold heart, a ring of
// white feathery tufts, a gold swoosh for a stem, and seeds flying off to the upper right (the wish = the "magic").
// shortcut: hand-drawn approximation of the AI concept; swap for the final vector logo when one exists.
const CX = 30, CY = 30;
const deg = (d: number) => (d * Math.PI) / 180;
const rnd = (i: number) => { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); }; // fixed "randomness"
const GOLD = "var(--color-gold-bright)";

/** A feathery tuft: fan of fine hairs pointing outwards from (x, y) in direction a. */
function Tuft({ x, y, a, size }: { x: number; y: number; a: number; size: number }) {
  return (
    <g strokeWidth="0.4">
      {[-60, -40, -20, 0, 20, 40, 60].map((t) => (
        <line key={t} x1={x} y1={y} x2={x + Math.cos(deg(a + t)) * size} y2={y + Math.sin(deg(a + t)) * size} />
      ))}
    </g>
  );
}

const STALKS = Array.from({ length: 44 }, (_, i) => ({ a: i * (360 / 44) + (rnd(i) - 0.5) * 5, len: 12 + rnd(i + 3) * 2.5 }));
const TUFTS = Array.from({ length: 24 }, (_, i) => ({ a: i * 15 + (rnd(i + 9) - 0.5) * 6, r: 13.5 + rnd(i + 5) * 1.5 }));
const FLYING = [
  { x: 51, y: 16, a: -35, l: 5.5 },
  { x: 55, y: 7, a: -55, l: 4.5 },
  { x: 61, y: 12, a: -30, l: 4 },
  { x: 61, y: 3, a: -45, l: 3 },
];

export function Dandelion({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden fill="none" stroke="currentColor" strokeLinecap="round">
      <defs>
        <radialGradient id="dandelion-glow">
          <stop offset="0" stopColor="#fff3c4" />
          <stop offset="0.45" stopColor={GOLD} />
          <stop offset="1" stopColor={GOLD} stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* gold swoosh stem sweeping in from the lower left */}
      <path d={`M1 63 C 14 60, 24 50, ${CX - 1} ${CY + 2}`} stroke={GOLD} strokeWidth="1.2" />
      <g stroke={GOLD} strokeWidth="0.35" opacity="0.9">
        {STALKS.map((s) => (
          <line key={s.a} x1={CX} y1={CY} x2={CX + Math.cos(deg(s.a)) * s.len} y2={CY + Math.sin(deg(s.a)) * s.len} />
        ))}
      </g>
      {TUFTS.map((t) => <Tuft key={t.a} x={CX + Math.cos(deg(t.a)) * t.r} y={CY + Math.sin(deg(t.a)) * t.r} a={t.a} size={4.2} />)}
      {FLYING.map((f) => {
        const [c, s] = [Math.cos(deg(f.a)), Math.sin(deg(f.a))];
        const ex = f.x + c * f.l, ey = f.y + s * f.l;
        return (
          <g key={f.x + f.y}>
            <line x1={f.x} y1={f.y} x2={ex} y2={ey} stroke={GOLD} strokeWidth="0.5" />
            <Tuft x={ex} y={ey} a={f.a} size={f.l * 0.55} />
          </g>
        );
      })}
      <circle cx={CX} cy={CY} r="5" fill="url(#dandelion-glow)" stroke="none" />
    </svg>
  );
}

/** Wordmark in the owner's chosen script (Pinyon Script) with the dandelion. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex min-w-0 items-center gap-1 ${className}`}>
      <span className="font-display text-[1.65rem] leading-none whitespace-nowrap min-[380px]:text-[1.9rem] sm:text-[2.2rem]">{SITE_NAME}</span>
      <Dandelion className="-my-2 hidden size-12 shrink-0 text-[#f7f1e3] min-[360px]:block sm:size-14" />
    </span>
  );
}
