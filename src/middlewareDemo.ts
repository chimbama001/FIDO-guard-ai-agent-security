import { fidoGuardMiddleware } from "./middleware/fidoGuardMiddleware.js";

async function rotateProductionApiKey() {
  console.log("Sensitive action executed: Production API key rotated.");
}

async function main() {
  const decision = await fidoGuardMiddleware({
    agentId: "devops-ai-agent-01",
    requestedAction:
      "Rotate production AI API key and deploy new model version",
    targetResource: "Production Model API",
    environment: "production",
    riskLevel: "critical",
    requiredApproverRole: "Cloud Admin",
    humanApprovalText: "No, deny this action",
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
