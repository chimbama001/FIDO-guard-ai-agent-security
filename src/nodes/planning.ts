import { HumanMessage } from "@langchain/core/messages";
import type { AgentStateType } from "../state.js";
import { getChatModel } from "./model.js";
import {
  getLastHumanText,
  planMessage,
  shortCircuitApprovalIfNeeded,
} from "./utils.js";

function mockPlan(userAsk: string): string {
  return [
    "## FIDO-Guard AI Agent Action Request",
    "",
    `**Original Request:** ${userAsk.slice(0, 200)}`,
    "",
    "**Requested Action:** Rotate production AI API key",
    "**Target Resource:** Production Model API",
    "**Risk Level:** Critical",
    "**Required Approver Role:** Cloud Admin",
    "**Required Authentication:** FIDO2 security key or passkey",
    "",
    "### Security Decision",
    "- This action is classified as high-risk because it affects production secrets.",
    "- The AI agent is not allowed to execute this action automatically.",
    "- Human approval is required before execution.",
    "- Final approval should require phishing-resistant authentication.",
    "",
    "_FIDO-Guard mock mode: using deterministic AI-agent risk request. Set `OPENAI_API_KEY` for live LLM output._",
  ].join("\n");
}

export async function planningNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  const shortcut = shortCircuitApprovalIfNeeded(state);
  if (shortcut) {
    return {
      pendingApproval: shortcut,
      currentStep: "approval",
    };
  }

  const ask = getLastHumanText(state.messages) ?? "(empty)";
  const model = getChatModel(0.2);

  let planBody: string;
  if (model) {
    const res = await model.invoke([
      new HumanMessage({
        content: `You are FIDO-Guard, a security approval gateway for AI-agent actions. 
                Analyze the user's request as if it came from an AI agent inside an AI company.

                Return a short markdown security review with:
                - Requested action
                - Target resource
                - Risk level
                - Required approver role
                - Required authentication method
                - Whether human approval is required

                User request:
                ${ask}`,
                  }),
                ]);
    const c = res.content;
    planBody = typeof c === "string" ? c : JSON.stringify(c);
  } else {
    planBody = mockPlan(ask);
  }

  const planText = planBody.trim();
  return {
    messages: [planMessage(planBody)],
    pendingApproval: {
      approved: false,
      planText,
      message: "Review the plan. Send a message containing approve (or yes/ok/proceed) to continue.",
    },
    currentStep: "approval",
  };
}
