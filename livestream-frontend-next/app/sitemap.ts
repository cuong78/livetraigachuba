import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://traigabaanhem.com",
      lastModified: new Date("2026-11-09"),
      changeFrequency: "daily",
      priority: 1.0,
    },
  ];
}

