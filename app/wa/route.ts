import type { NextRequest } from "next/server";

// Sends the visitor to WhatsApp with the shop's number, kept server-side (WHATSAPP_PHONE secret)
// so it isn't scraped from the page.
export function GET(req: NextRequest) {
  const phone = (process.env.WHATSAPP_PHONE ?? "").replace(/\D/g, "");
  if (!phone) return new Response("WhatsApp nav iestatīts", { status: 503 });
  const text = (req.nextUrl.searchParams.get("text") ?? "").slice(0, 1000);
  const target = `https://api.whatsapp.com/send/?phone=${phone}&text=${encodeURIComponent(text)}&type=phone_number&app_absent=0`;
  return new Response(null, { status: 302, headers: { Location: target, "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
}
