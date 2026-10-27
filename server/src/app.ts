import cors from "cors";
import express from "express";
import helmet from "helmet";
import multer from "multer";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { router } from "./routes.js";

export const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: ["http://127.0.0.1:5173", "http://localhost:5173"] }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_request, response) => {
  response.status(200).json({ status: "ok" });
});

app.use("/api/v1", (request, response, next) => {
  const host = request.hostname.toLowerCase();
  const localHosts = new Set(["127.0.0.1", "localhost", "::1"]);
  const origin = request.get("origin");
  const localOrigins = new Set([
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    `http://127.0.0.1:${process.env.PORT ?? "3000"}`,
    `http://localhost:${process.env.PORT ?? "3000"}`,
  ]);
  if (
    !localHosts.has(host) ||
    (origin !== undefined && !localOrigins.has(origin))
  ) {
    response.status(403).json({ error: "Local requests only." });
    return;
  }
  next();
});

app.use("/api/v1", router);

app.use(
  (
    error: unknown,
    _request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) => {
    void next;
    if (error instanceof ZodError) {
      response
        .status(400)
        .json({ error: "Invalid request.", details: error.issues });
      return;
    }
    if (error instanceof multer.MulterError) {
      response
        .status(error.code === "LIMIT_FILE_SIZE" ? 413 : 400)
        .json({ error: "Invalid upload." });
      return;
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const status =
        error.code === "P2002" ? 409 : error.code === "P2025" ? 404 : 500;
      response.status(status).json({
        error:
          status === 500
            ? "Database operation failed."
            : "Conflicting or missing record.",
      });
      return;
    }
    const statusCode = (error as { statusCode?: number }).statusCode;
    response.status(statusCode ?? 500).json({
      error: statusCode ? (error as Error).message : "Internal server error.",
    });
  },
);
