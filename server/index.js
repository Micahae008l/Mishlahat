import "./env.js";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";
import dashboardRoutes from "./routes/dashboard.js";
import aiRoutes from "./routes/ai.js";
import { isSmtpConfigured } from "./utils/email.js";
import { corsOptions } from "./utils/corsOptions.js";

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL?.trim() || "http://localhost:8080/";

// Middleware
app.use(cors(corsOptions()));
app.use(express.json());

// Root — this process is the JSON API only; the UI is Vite (default :8080)
app.get("/", (_req, res) => {
  res.type("html").send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><title>Mishlahat API</title></head>
<body style="font-family:system-ui;padding:2rem;max-width:40rem">
  <h1>Mishlahat API</h1>
  <p>This port serves <strong>REST only</strong> under <code>/api</code>.</p>
  <p>Open the app: <a href="${FRONTEND_URL}"><strong>${FRONTEND_URL}</strong></a></p>
  <p>Try <a href="/api/health"><code>GET /api/health</code></a></p>
</body></html>`);
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ai", aiRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start server
async function start() {
  if (!process.env.JWT_SECRET?.trim()) {
    console.error("[api] FATAL: JWT_SECRET is missing or empty. Add it to server/.env (see server/.env.example if present).");
    process.exit(1);
  }
  await connectDB();
  app.listen(PORT, () => {
    console.log(`API:  http://localhost:${PORT}  (GET / shows hints)`);
    console.log(`App:  http://localhost:8080/  (npm run dev in repo root)`);
    if (isSmtpConfigured()) {
      console.log("[email] SMTP מוגדר — קודי OTP יישלחו באימייל.");
    } else {
      console.warn(
        "[email] SMTP לא מוגדר (SMTP_HOST / SMTP_USER / SMTP_PASS ב־server/.env). קודי OTP לא יישלחו ל-Gmail; בפיתוח יופיעו בלוג ובממשק."
      );
    }
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
