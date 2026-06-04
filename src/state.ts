import { Annotation } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";

/** Pending human approval payload carried between steps */
export type PendingApprovalState = {
  approved: boolean;
  planText: string;
  message?: string;
  fidoChallenge?: {
    challengeId: string;
    requiredUserPresence: boolean;
    requiredUserVerification: boolean;
    authenticatorType: string;
    expiresAt: string;
    verified: boolean;
  };
} | null;

export const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  currentStep: Annotation<string>({
    reducer: (_x, y) => y ?? _x,
    default: () => "planning",
  }),
  pendingApproval: Annotation<PendingApprovalState>({
    /** Use `undefined` in updates to leave prior value; `null` clears the pending approval */
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => null,
  }),
});

export type AgentStateType = typeof AgentState.State;
