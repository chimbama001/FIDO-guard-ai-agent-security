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
    "## Plan",
    "",
    `- Clarify goal: ${userAsk.slice(0, 200)}`,
    "- Outline 2–3 concrete steps",
    "- Execute and verify outcome",
    "",
    "_No API key: using a deterministic mock plan. Set `OPENAI_API_KEY` for live LLM output._",
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
        content: `You are a planning assistant. Reply with a short markdown plan (bullet steps) for:\n\n${ask}`,
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
