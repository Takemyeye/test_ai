import express, { type NextFunction, type Request, type Response } from "express";
import { handleAsk } from "./src/routes/ask.ts";

const MAX_BODY_SIZE = "4kb";
const port = Number(process.env.API_PORT) || 4000;
const host = process.env.API_HOST || "127.0.0.1";

const app = express();
app.disable("x-powered-by");

app.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.post("/api/ask", express.json({ limit: MAX_BODY_SIZE }), handleAsk);

app.use((_request, response) => {
  response.status(404).json({ error: "Not found." });
});

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  const status = typeof error === "object" && error !== null && "status" in error ? Number(error.status) : 500;
  if (status >= 500) console.error("[server] unhandled error", error);
  response.status(status >= 400 && status < 600 ? status : 500).json({ error: "Invalid request." });
});

app.listen(port, host, () => {
  console.log(`[server] listening on http://${host}:${port}`);
});
