import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRouter from "./routes/auth.js";
import recipesRouter from "./routes/recipes.js";
import mediaRouter from "./routes/media.js";
import dishGenresRouter from "./routes/dish-genres.js";
import dishVarietiesRouter from "./routes/dish-varieties.js";
import discoveryRouter from "./routes/discovery.js";
import dietaryTagsRouter from "./routes/dietary-tags.js";
import parseRouter from "./routes/parse.js";
import ingredientsRouter from "./routes/ingredients.js";
import toolsRouter from "./routes/tools.js";

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
app.use("/media", mediaRouter);
app.use("/dish-genres", dishGenresRouter);
app.use("/dish-varieties", dishVarietiesRouter);
app.use("/discovery", discoveryRouter);
app.use("/dietary-tags", dietaryTagsRouter);
app.use("/parse", parseRouter);
app.use("/ingredients", ingredientsRouter);
app.use("/tools", toolsRouter);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    error: { code: "NOT_FOUND", message: "Route not found." },
  });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("EXPRESS ERROR:", err);
  res.status(500).json({ error: { message: err.message, stack: err.stack } });
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