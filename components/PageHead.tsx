export function PageHead({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="pt-6 pb-6 md:pt-10 md:pb-8">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-1 font-display text-[2.6rem] leading-[1.2] min-[380px]:text-5xl sm:text-6xl">{title}</h1>
      {children && <div className="mt-3 max-w-2xl text-ink-soft sm:text-lg">{children}</div>}
    </div>
  );
}
