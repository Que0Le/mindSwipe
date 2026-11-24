import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Ports are configurable via env so you can avoid clashes and expose the app to
// other devices on your network:
//   WEB_PORT   - port the Vite dev server listens on (default 5173)
//   API_PORT   - port the Express backend runs on   (default 4000)
// `host: true` binds to all interfaces (0.0.0.0) so a phone on the same Wi-Fi
// can open http://<your-computer-ip>:<WEB_PORT>. The /api proxy runs on this
// machine, so it keeps talking to the backend over localhost regardless.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const webPort = Number(env.WEB_PORT || 5173);
  const apiPort = env.API_PORT || "4000";

  return {
    plugins: [react()],
    server: {
      host: true,
      port: webPort,
      proxy: {
        "/api": `http://localhost:${apiPort}`,
      },
    },
  };
});
