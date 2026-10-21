import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ServiceWorker } from "@/components/pwa/service-worker";
import { getEnv } from "@/config/env";
import { THEME_COLOR } from "@/config/theme";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(getEnv().BETTER_AUTH_URL),
  title: "Tapisode",
  description: "Movies and shows, minus the noise.",
  appleWebApp: { capable: true, title: "Tapisode", statusBarStyle: "black-translucent" },
  icons: { apple: "/apple-touch-icon.png" },
};
export const viewport: Viewport = { themeColor: THEME_COLOR, viewportFit: "cover", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrains.variable}`}>
      <body className="text-[15px] leading-normal">
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
