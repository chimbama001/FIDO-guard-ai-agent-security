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
      "### Result",
      "",
      `Goal: ${originalAsk.slice(0, 200)}${originalAsk.length > 200 ? "…" : ""}`,
      "",
      `Following the approved plan, the next step would be to carry out: ${plan.slice(0, 300)}…`,
      "",
      "_Mock execution (set `OPENAI_API_KEY` for a live run)._",
    ].join("\n");
  }

  return {
    messages: [executionMessage(body)],
    currentStep: "done",
    pendingApproval: null,
  };
}
