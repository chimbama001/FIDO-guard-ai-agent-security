import { BaseMessage, AIMessage, isHumanMessage } from "@langchain/core/messages";
import type { AgentStateType } from "../state.js";

/** Avoid matching loose "yes"/"ok" inside longer planning prompts */
export function isApprovalPhrase(text: string): boolean {
  const t = text.trim();
  if (/^\s*(yes|yep|ok|okay)\s*!?\s*$/i.test(t)) return true;
  if (/\b(approve|approved|proceed|confirm|go ahead)\b/i.test(t)) return true;
  return false;
}

export function getLastHumanText(messages: BaseMessage[]): string | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (isHumanMessage(m)) {
      const c = m.content;
      return typeof c === "string" ? c : JSON.stringify(c);
    }
  }
  return undefined;
}

/** First human message — use for “original user goal” when the latest message is only an approval. */
export function getFirstHumanText(messages: BaseMessage[]): string | undefined {
  for (const m of messages) {
    if (isHumanMessage(m)) {
      const c = m.content;
      return typeof c === "string" ? c : JSON.stringify(c);
    }
  }
  return undefined;
}

/**
 * When the user sends an approval phrase and a plan already exists (from a prior checkpoint),
 * we mark approval here so the graph can proceed to execution without re-planning.
 */
export function shortCircuitApprovalIfNeeded(
  state: AgentStateType
): { approved: true; planText: string; message?: string } | null {
  const last = getLastHumanText(state.messages);
  const pending = state.pendingApproval;
  if (!last || !pending?.planText) return null;
  if (pending.approved) return null;
  if (!isApprovalPhrase(last)) return null;
  return {
    approved: true,
    planText: pending.planText,
    message: "Approved via user message.",
  };
}

export function planMessage(content: string): AIMessage {
  return new AIMessage({
    content,
    name: "planning",
  });
}

export function executionMessage(content: string): AIMessage {
  return new AIMessage({
    content,
    name: "execution",
  });
}
