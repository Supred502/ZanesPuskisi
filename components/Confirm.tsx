"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Ask = { title: string; text?: string; ok: string; danger?: boolean };
type Req = Ask & { resolve: (yes: boolean) => void };

/** Site-styled replacement for window.confirm: `if (await ask({...})) …`. Render `dialog` somewhere in the component. */
export function useConfirm() {
  const [req, setReq] = useState<Req | null>(null);
  const ask = useCallback((a: Ask) => new Promise<boolean>((resolve) => setReq({ ...a, resolve })), []);
  const close = (yes: boolean) => {
    req?.resolve(yes);
    setReq(null);
  };
  return [ask, req && <ConfirmDialog {...req} onClose={close} />] as const;
}

function ConfirmDialog({ title, text, ok, danger, onClose }: Ask & { onClose: (yes: boolean) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => ref.current?.showModal(), []); // native modal: focus trap, Escape and backdrop for free

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose(false);
      }}
      className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-card border border-line bg-surface p-0 text-ink shadow-xl backdrop:bg-brand/40"
    >
      <div className="p-5">
        <h2 className="text-lg font-semibold">{title}</h2>
        {text && <p className="mt-2 text-sm whitespace-pre-line text-ink-soft">{text}</p>}
      </div>
      <div className="flex justify-end gap-2 border-t border-line bg-soft/60 px-5 py-3">
        <button type="button" className="btn btn-ghost" onClick={() => onClose(false)} autoFocus>Atcelt</button>
        <button type="button" className={`btn ${danger ? "border-danger bg-danger text-white hover:bg-danger/90" : "btn-primary"}`} onClick={() => onClose(true)}>{ok}</button>
      </div>
    </dialog>
  );
}
