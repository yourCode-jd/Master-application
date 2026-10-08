import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LocalOps Salon", short_name: "LocalOps", description: "Local salon operations workspace",
    start_url: "/", display: "standalone", background_color: "#f6f7fb", theme_color: "#2457d6",
    icons: [
      { src: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-512.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
