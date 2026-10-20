import type { Metadata, Viewport } from "next";
import { THEME_COLOR } from "@/config/theme";
import "./globals.css";

export const metadata: Metadata = { title: "Tapisode", description: "Movies and shows, minus the noise." };
export const viewport: Viewport = { themeColor: THEME_COLOR, viewportFit: "cover", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
