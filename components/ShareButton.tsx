"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

export function ShareButton({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    if (navigator.share) {
      try {
        return await navigator.share({ title, url });
      } catch (e) {
        if ((e as Error).name === "AbortError") return; // user closed the share sheet
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Nokopē saiti:", url);
    }
  }
  return (
    <button type="button" onClick={share} className="btn btn-ghost">
      {copied ? <Check className="size-4" aria-hidden /> : <Share2 className="size-4" aria-hidden />}
      <span aria-live="polite">{copied ? "Saite nokopēta" : "Dalīties"}</span>
    </button>
  );
}
