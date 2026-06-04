import { HumanMessage } from "@langchain/core/messages";
import type { AgentStateType } from "../state.js";
import { getChatModel } from "./model.js";
import {
  executionMessage,
  getFirstHumanText,
  getLastHumanText,
} from "./utils.js";
import { writeAuditLog } from "../auditLogger.js";
import { generateSecurityDecisionReport } from "../securityDecisionReport.js";

export async function executionNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  const plan = state.pendingApproval?.planText ?? "(no plan)";
  const originalAsk = getFirstHumanText(state.messages) ?? "";
  const latestHuman = getLastHumanText(state.messages) ?? "";
  const model = getChatModel(0.3);

    let body: string;

  if (model) {
    const res = await model.invoke([
      new HumanMessage({
        content: `Execute this plan for the user. Be concise.\n\nPlan:\n${plan}\n\nOriginal user request:\n${originalAsk}\n\nLatest message:\n${latestHuman}`,
      }),
    ]);

    const c = res.content;
    body = typeof c === "string" ? c : JSON.stringify(c);
  } else {
    body = generateSecurityDecisionReport({
      originalRequest:
        "An AI DevOps agent wants to rotate the production AI API key and deploy a new model version to the Production Model API.",
      requestedAction: "Rotate production AI API key and deploy new model version",
      targetResource: "Production Model API",
      riskLevel: "Critical",
      requiredApprover: "Cloud Admin",
      requiredAuthentication: "FIDO2/WebAuthn passkey or security key",
      approvalStatus: "Verified",
      fidoVerified: true,
      executionStatus: "Approved and executed",
      auditStatus: "Logged",
    });
  }

  writeAuditLog({
    eventType: "AI_AGENT_ACTION",
    actor: "FIDO-Guard AI DevOps Agent",
    action: "Rotate production AI API key and deploy model version",
    status: "APPROVED_AND_EXECUTED",
    details: {
      approvalMethod: "Simulated FIDO/WebAuthn human approval",
      securityGateway: "FIDO-Guard",
      riskLevel: "High",
      environment: "Production",
      targetResource: "Production Model API",
      fidoRequired: true,
      fidoUserPresenceRequired: true,
      fidoUserVerificationRequired: true,
      fidoVerified: true,  
    },
  });

  return {
    messages: [executionMessage(body)],
    currentStep: "done",
    pendingApproval: null,
  };
}
