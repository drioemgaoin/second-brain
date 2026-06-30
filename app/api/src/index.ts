import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import chat from "./routes/chat.js";
import notes from "./routes/notes.js";
import mcp from "./mcp.js";

const app = new Hono();

// CORS — allow the chat frontend to call this API
app.use(
  "*",
  cors({
    origin: (origin) => {
      const allowed = process.env.CORS_ORIGIN;
      if (!allowed) {
        // Dev fallback: allow any localhost origin
        if (origin && new URL(origin).hostname === "localhost") return origin;
        return "http://localhost:3000";
      }
      // Support comma-separated origins
      const origins = allowed.split(",").map((o) => o.trim());
      if (origin && origins.includes(origin)) return origin;
      // Allow Cloudflare Tunnel quick-tunnel origins
      if (origin && origin.endsWith(".trycloudflare.com")) return origin;
      return origins[0];
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  })
);

// Health check
app.get("/health", (c) => c.json({ ok: true }));

// Routes
app.route("/chat", chat);
app.route("/notes", notes);
app.route("/mcp", mcp);

const port = Number(process.env.PORT) || 3001;

console.log(`API server running on http://localhost:${port}`);

serve({ fetch: app.fetch, port });
