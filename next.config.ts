import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Product photos live in Firebase Storage; next/image resizes them to WebP/AVIF per screen size.
    // No `search` key: Firebase links carry ?alt=media&token=…, which a URL() pattern would reject.
    remotePatterns: [{ protocol: "https", hostname: "firebasestorage.googleapis.com", pathname: "/v0/b/zanes-puskisi-web.firebasestorage.app/o/**" }],
    formats: ["image/avif", "image/webp"],
  },
  // Old site links still shared around (WhatsApp, TikTok, Google) keep working.
  async redirects() {
    return [
      { source: "/produkti", has: [{ type: "query", key: "p", value: "(?<id>[^/]+)" }], destination: "/produkti/:id", permanent: true },
      { source: "/s/:id", destination: "/produkti/:id", permanent: true },
      { source: "/share/:id", destination: "/produkti/:id", permanent: true },
      { source: "/about", destination: "/par-mani", permanent: true },
      { source: "/privacy", destination: "/privatums", permanent: true },
      { source: "/wishlist", destination: "/velmes", permanent: true },
    ];
  },
  // Basic hardening: no framing, no MIME sniffing, no full URLs leaked to other sites, HTTPS only
  async headers() {
    return [{
      source: "/sw.js", // never cache the old-worker remover, so browsers always see it
      headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }],
    }, {
      source: "/:path*",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
      ],
    }];
  },
};

export default nextConfig;
