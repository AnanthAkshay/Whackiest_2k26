import cors from "cors";
import express, { type ErrorRequestHandler, type RequestHandler } from "express";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { getAdminCostsHandler } from "./handlers/admin";
import { startChallengeHandler, uploadArtifactHandler } from "./handlers/challenge";
import { getConfigHandler } from "./handlers/config";
import { generateSeededChallengeDataset } from "./challenge/datasetGenerator";
import { createCredentialHandler, deleteCredentialHandler, getCredentialHandler, shareCredentialHandler } from "./handlers/credential";
import { getHealthHandler } from "./handlers/health";
import { getIntegrationsHandler } from "./handlers/integrations";
import { addTurnHandler, finishSessionHandler, getSessionHandler, startSessionHandler } from "./handlers/sessions";
import { listSkillsHandler } from "./handlers/skills";
import { getJwksHandler, getPublicPassportHandler, verifyCredentialHandler } from "./handlers/verify";
import { config } from "./config";
import { logError } from "./logger";
import type { HttpEvent } from "./types";

const app = express();
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: "15mb" }));

function adapt(handler: (event: HttpEvent<never>) => Promise<{ statusCode: number; body: unknown }>): RequestHandler {
  return async (request, response, next) => {
    try {
      const event = {
        body: request.body,
        pathParameters: request.params as unknown as Record<string, string | undefined>,
        headers: request.headers as Record<string, string | undefined>
      } as HttpEvent<never>;
      const result = await handler(event);
      response.status(result.statusCode).json(result.body);
    } catch (error) {
      next(error);
    }
  };
}

app.get("/health", adapt(getHealthHandler));
app.get("/api/health", adapt(getHealthHandler));
app.get("/api/integrations", adapt(getIntegrationsHandler));
app.get("/api/skills", adapt(listSkillsHandler));
app.get("/api/config", adapt(getConfigHandler));
app.post("/api/session/start", adapt(startSessionHandler));
app.post("/api/session/:id/turn", adapt(addTurnHandler));
app.post("/api/session/:id/finish", adapt(finishSessionHandler));
app.get("/api/session/:id", adapt(getSessionHandler));
app.get("/api/verify/:pageId", adapt(verifyCredentialHandler));
app.get("/verify/:credentialId", adapt(verifyCredentialHandler));
app.get("/.well-known/jwks.json", adapt(getJwksHandler));
app.get("/api/passport/:id", adapt(getPublicPassportHandler));
app.post("/api/session/:id/credential", adapt(createCredentialHandler));
app.get("/api/credential/:pageId", adapt(getCredentialHandler));
app.patch("/api/credential/:pageId/share", adapt(shareCredentialHandler));
app.delete("/api/credential/:pageId", adapt(deleteCredentialHandler));
app.get("/api/admin/costs", adapt(getAdminCostsHandler));
app.post("/api/challenge/:challengeId/start", adapt(startChallengeHandler));
app.post("/api/attempt/:attemptId/upload", adapt(uploadArtifactHandler));
app.get("/api/challenge/:challengeId/starter.xlsx", (request, response) => {
  const seedId = typeof request.query.seedId === "string" && request.query.seedId ? request.query.seedId : "seed_default_demo";
  const challengeId = String(request.params.challengeId || "retail_sales_cleanup");
  const bundle = generateSeededChallengeDataset(seedId, challengeId, "1.0.0");
  response.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  response.setHeader("Content-Disposition", 'attachment; filename="retail_sales_starter.xlsx"');
  response.send(bundle.starterWorkbook);
});

function getWebPublicDirectory(): string {
  const localWeb = resolve(process.cwd(), "web", "public");
  if (existsSync(localWeb)) return localWeb;
  return resolve(process.cwd(), "..", "web", "public");
}

app.get(["/p/:pageId", "/pages/:pageId/index.html", "/passport/:pageId"], async (request, response) => {
  const pageId = String(request.params.pageId);
  const webPublic = getWebPublicDirectory();
  const pagePath = resolve(webPublic, "pages", pageId, "index.html");
  const pPath = resolve(webPublic, "p", pageId, "index.html");
  const target = existsSync(pagePath) ? pagePath : existsSync(pPath) ? pPath : undefined;
  if (target) {
    response.setHeader("Content-Type", "text/html; charset=utf-8");
    response.send(await readFile(target, "utf8"));
  } else {
    response.status(404).send("Page not found");
  }
});
const errorHandler: ErrorRequestHandler = (error: Error, _request, response, _next) => {
  logError("request.failed", error);
  response.status(500).json({ error: "The local API could not complete that request." });
};
app.use(errorHandler);

const port = config.port;
app.listen(port, () => console.log(`Prooffolio mock API listening on http://localhost:${port}`));
