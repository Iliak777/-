import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "THE KLINIQUE",
    short_name: "THE KLINIQUE",
    description: "Book treatments at THE KLINIQUE, Bangkok.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f5ef",
    theme_color: "#161412",
    icons: [
      { src: "/api/icon/192", sizes: "192x192", type: "image/png" },
      { src: "/api/icon/512", sizes: "512x512", type: "image/png" },
      { src: "/api/icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
