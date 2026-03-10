import express from "express";
import http from "http";

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  // API routes go here
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/config", (req, res) => {
    res.json({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    // Catch-all middleware for SPA routing
    app.use((req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  const PORT = process.env.PORT || 3000;
  server.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
