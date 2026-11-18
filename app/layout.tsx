import type { Metadata, Viewport } from "next";
import { Google_Sans, Pinyon_Script } from "next/font/google";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

// Chosen by the owner: Pinyon Script for the name and big headings, Google Sans for everything readable
const sans = Google_Sans({ variable: "--font-google-sans", subsets: ["latin", "latin-ext"] });
const script = Pinyon_Script({ variable: "--font-pinyon", weight: "400", subsets: ["latin", "latin-ext"] });

const description = "Roku darbi ar mīlestību: dāvanas, dekori un ziedi, kas top Latvijā. Apskati pieejamos darbus un pasūti savu.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — roku darbi, dāvanas un dekori`, template: `%s · ${SITE_NAME}` },
  description,
  applicationName: SITE_NAME,
  openGraph: { siteName: SITE_NAME, type: "website", locale: "lv_LV", description, images: ["/darbnica.jpeg"] },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#13254f" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="lv" className={`${sans.variable} ${script.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col overflow-x-clip font-sans">{children}</body>
    </html>
  );
}
