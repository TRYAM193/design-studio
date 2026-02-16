import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    allowedHosts: [
      "postscorbutic-petronila-polyrhythmically.ngrok-free.dev", // The URL from your error
      ".ngrok-free.app" // Allows other ngrok URLs if this one changes
    ],
    proxy: {
      // Proxy requests from '/api' to 'https://ipapi.co'
      '/api': {
        target: 'https://ipapi.co',
        changeOrigin: true, // Needed for virtual hosted sites
        rewrite: (path) => path.replace(/^\/api/, ''), // Remove '/api' prefix when forwarding
      },
    },
  }
});
