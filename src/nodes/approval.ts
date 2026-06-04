import type { AgentStateType } from "../state.js";
import { getLastHumanText, isApprovalPhrase } from "./utils.js";
import { generateFidoChallenge, verifyFidoChallenge } from "../fidoChallenge.js";

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
 if (pending.approved && pending.fidoChallenge?.verified) {
  return { currentStep: "execution" };
}

  const last = getLastHumanText(state.messages);

 if (last && isApprovalPhrase(last)) {
  const fidoChallenge = generateFidoChallenge();
  const fidoVerified = verifyFidoChallenge(fidoChallenge, last);
  console.log("FIDO/WebAuthn challenge generated:", fidoChallenge);
  console.log("FIDO/WebAuthn verification result:", fidoVerified);

  if (!fidoVerified) {
    return {
      pendingApproval: {
        ...pending,
        approved: false,
        message: "FIDO/WebAuthn challenge failed or expired. Approval denied.",
      },
      currentStep: "approval",
    };
  }

  return {
    pendingApproval: {
      ...pending,
      approved: true,
      message: "Plan approved after simulated FIDO/WebAuthn verification.",
      fidoChallenge: {
        challengeId: fidoChallenge.challengeId,
        requiredUserPresence: fidoChallenge.requiredUserPresence,
        requiredUserVerification: fidoChallenge.requiredUserVerification,
        authenticatorType: fidoChallenge.authenticatorType,
        expiresAt: fidoChallenge.expiresAt,
        verified: true,
      },
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
