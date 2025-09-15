import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  installDependencies,
  generateDataset,
  trainModels,
  getModelPerformance,
  predictWithML,
  getDatasetStats,
} from "./routes/ml";
import { quoteSubmission, computeRiskMatrix } from "./routes/rater";
import { saveQuote, listQuotes } from "./routes/quotes";
import { uploadCsv, validateSubmission } from "./routes/upload";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // ML API routes
  app.post("/api/ml/install-deps", installDependencies);
  app.post("/api/ml/generate-dataset", generateDataset);
  app.post("/api/ml/train-models", trainModels);
  app.get("/api/ml/model-performance", getModelPerformance);
  app.post("/api/ml/predict", predictWithML);
  app.get("/api/ml/dataset-stats", getDatasetStats);

  // Rater API routes
  app.post("/api/rater/quote", quoteSubmission);
  app.post("/api/rater/risk-matrix", computeRiskMatrix);

  // Upload & Validation routes
  app.post("/api/upload/csv", uploadCsv);
  app.post("/api/rater/validate-submission", validateSubmission);

  // Quote storage routes (basic in-memory)
  app.post("/api/rater/save-quote", saveQuote);
  app.get("/api/rater/quotes", listQuotes);

  return app;
}
