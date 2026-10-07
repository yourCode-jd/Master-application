import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return { name: "LocalOps", short_name: "LocalOps", description: "Local business operations workspace", start_url: "/", display: "standalone", background_color: "#f6f7fb", theme_color: "#2457d6", icons: [] };
}
