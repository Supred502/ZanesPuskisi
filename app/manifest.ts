import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/site";

// Same URL as the old site's manifest (/manifest.webmanifest), so phones that installed it pick up the new name and colours.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    start_url: "/",
    display: "standalone",
    background_color: "#fbf8f2",
    theme_color: "#13254f",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
