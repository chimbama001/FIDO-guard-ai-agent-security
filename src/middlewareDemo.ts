import { fidoGuardMiddleware } from "./middleware/fidoGuardMiddleware.js";

async function rotateProductionApiKey() {
  console.log("Sensitive action executed: Production API key rotated.");
}

async function main() {
  const decision = await fidoGuardMiddleware({
    agentId: "devops-ai-agent-01",
    requestedAction: "Delete production database and rotate production API key",
    targetResource: "Production Database",
    environment: "production",
    requiredApproverRole: "Cloud Admin",
  });

  console.log("FIDO-Guard decision:", decision);

  if (!decision.allowed) {
    console.log("Execution blocked:", decision.reason);
    return;
  }

  await rotateProductionApiKey();
}

main().catch((error) => {
  console.error("Middleware demo failed:", error);
  process.exit(1);
});