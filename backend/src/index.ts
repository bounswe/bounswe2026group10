import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRouter from "./routes/auth.js";
import recipesRouter from "./routes/recipes.js";

const app = express();
const PORT = process.env["PORT"] ?? 3000;

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Meta ─────────────────────────────────────────────────────────────────────
app.get("/meta/regions", (_req, res) => {
  res.status(200).json({
    success: true,
    data: ["Turkey", "Greece", "Italy", "Mexico", "India", "Japan"],
    error: null,
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/auth", authRouter);
app.use("/recipes", recipesRouter);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    error: { code: "NOT_FOUND", message: "Route not found." },
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
if (process.env["NODE_ENV"] !== "test") {
  app.listen(PORT, () => {
    console.log(`🚀 Roots & Recipes API running on http://localhost:${PORT}`);
    console.log(`   Environment : ${process.env["NODE_ENV"] ?? "development"}`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
  });
}

export default app;