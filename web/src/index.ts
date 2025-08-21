import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import docsRouter from "./routes/docs.routes";
import githubRouter from "./routes/github.routes";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/", (_req, res) => {
  res.type("text/plain").send("RepoDocs API — try GET /health or /api/github/...");
});

app.use("/api/docs", docsRouter);
app.use("/api/github", githubRouter);

const port = Number(process.env.PORT) || 8080;
app.listen(port, () => console.log(`API listening on :${port}`));
