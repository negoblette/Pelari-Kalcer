export default function manifest() {
  return {
    name: "Pelari Kalcer",
    short_name: "Kalcer",
    description: "Tracker lari pribadi untuk absen, rencana, gear, dan streak.",
    start_url: "/",
    display: "standalone",
    background_color: "#1e3bff",
    theme_color: "#1e3bff",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
