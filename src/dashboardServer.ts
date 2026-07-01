import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fidoGuardMiddleware } from "./middleware/fidoGuardMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const projectRoot = path.resolve(__dirname, "..");
const dashboardPath = path.join(projectRoot, "public", "dashboard.html");
const auditLogPath = path.join(projectRoot, "audit-log.json");

type RequestBody = {
  agentId?: string;
  requestedAction?: string;
  targetResource?: string;
  environment?: "development" | "staging" | "production";
  requiredApproverRole?: string;
};

async function readJsonBody(req: any): Promise<RequestBody> {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk: Buffer) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

async function getAuditLogs() {
  if (!existsSync(auditLogPath)) {
    return [];
  }

  const raw = await readFile(auditLogPath, "utf-8");

  if (!raw.trim()) {
    return [];
  }

  const parsed = JSON.parse(raw);

  if (Array.isArray(parsed)) {
    return parsed;
  }

  return [parsed];
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/") {
      const html = await readFile(dashboardPath, "utf-8");

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(html);
      return;
    }

    if (req.method === "GET" && req.url === "/api/audit-logs") {
      const logs = await getAuditLogs();

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ logs }, null, 2));
      return;
    }

    if (req.method === "POST" && req.url === "/api/evaluate") {
      const body = await readJsonBody(req);

      if (!body.requestedAction || !body.targetResource || !body.environment) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error:
              "requestedAction, targetResource, and environment are required.",
          })
        );
        return;
      }

      const decision = await fidoGuardMiddleware({
        agentId: body.agentId ?? "dashboard-user",
        requestedAction: body.requestedAction,
        targetResource: body.targetResource,
        environment: body.environment,
        requiredApproverRole: body.requiredApproverRole ?? "Cloud Admin",
      });

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ decision }, null, 2));
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  } catch (error) {
    console.error("Dashboard server error:", error);

    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: "Internal server error",
      })
    );
  }
});

server.listen(PORT, () => {
  console.log(`FIDO-Guard dashboard running at http://localhost:${PORT}`);
});
