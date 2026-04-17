import type { AgentStateType } from "../state.js";
import { getLastHumanText, isApprovalPhrase } from "./utils.js";

/**
 * Confirms approval from the latest user message when a plan is pending.
 * (Planning may already set `approved: true` when resuming with an approval phrase.)
 */
export async function approvalNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  const pending = state.pendingApproval;
  if (!pending?.planText) {
    return { currentStep: "approval" };
  }
  if (pending.approved) {
    return { currentStep: "execution" };
  }

  const last = getLastHumanText(state.messages);
  if (last && isApprovalPhrase(last)) {
    return {
      pendingApproval: {
        ...pending,
        approved: true,
        message: "Plan approved.",
      },
      currentStep: "execution",
    };
  }

  return {
    pendingApproval: {
      ...pending,
      approved: false,
    },
    currentStep: "approval",
  };
}
