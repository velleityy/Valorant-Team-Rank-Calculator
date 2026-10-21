import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/Valorant-Team-Rank-Calculator/",
  server: {
    host: true,
    allowedHosts: [".csb.app"],
  },
});
