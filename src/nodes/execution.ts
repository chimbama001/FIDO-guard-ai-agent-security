import { HumanMessage } from "@langchain/core/messages";
import type { AgentStateType } from "../state.js";
import { getChatModel } from "./model.js";
import {
  executionMessage,
  getFirstHumanText,
  getLastHumanText,
} from "./utils.js";

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
        content: `Execute this plan for the user. Be concise.\n\nPlan:\n${plan}\n\nOriginal user request:\n${originalAsk}\n\nLatest message (may be approval only):\n${latestHuman}`,
      }),
    ]);
    const c = res.content;
    body = typeof c === "string" ? c : JSON.stringify(c);
  } else {
   body = [
  "## FIDO-Guard Execution Result",
  "",
  "**Status:** Approved and executed",
  "**Action:** Rotate production AI API key and deploy new model version",
  "**Target Resource:** Production Model API",
  "**Approval Gate:** Passed",
  "**Required Authentication:** FIDO2 security key or passkey",
  "**Approver Role:** Cloud Admin",
  "**Audit Status:** Logged",
  "",
  "The AI-agent action was executed only after verified human approval.",
  "",
  "In the final version, this approval step will require a phishing-resistant FIDO2/WebAuthn challenge before `approved` can become `true`.",
  "",
  "_FIDO-Guard mock execution mode._",
].join("\n");
  }

  return {
    messages: [executionMessage(body)],
    currentStep: "done",
    pendingApproval: null,
  };
}
