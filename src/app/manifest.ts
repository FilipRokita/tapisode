import type { MetadataRoute } from "next";
import { THEME_COLOR } from "@/config/theme";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tapisode",
    short_name: "Tapisode",
    description: "Movies and shows, minus the noise.",
    start_url: "/app/watching",
    display: "standalone",
    background_color: THEME_COLOR,
    theme_color: THEME_COLOR,
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
