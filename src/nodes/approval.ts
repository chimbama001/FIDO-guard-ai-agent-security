import type { AgentStateType } from "../state.js";
import { getLastHumanText } from "./utils.js";
import {
  generateFidoChallenge,
  verifyFidoChallenge,
} from "../fidoChallenge.js";

const approvalPhrases = ["approve", "approved", "yes", "proceed", "authorize"];
const denialPhrases = ["deny", "denied", "reject", "no", "block"];

function includesAnyPhrase(text: string, phrases: string[]): boolean {
  const normalized = text.toLowerCase();
  return phrases.some((phrase) => normalized.includes(phrase));
}

export async function approvalNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  const pending = state.pendingApproval;

  if (!pending) {
    return {
      currentStep: "approval",
      pendingApproval: {
        approved: false,
        planText: "No pending approval request was found.",
        message: "No pending approval request was found.",
        executionBlocked: true,
        denied: true,
        denialReason: "No pending approval request exists.",
      },
    };
  }

  const latestHumanText = getLastHumanText(state.messages) ?? "";

  const userApproved = includesAnyPhrase(latestHumanText, approvalPhrases);
  const userDenied = includesAnyPhrase(latestHumanText, denialPhrases);

  if (userDenied) {
    return {
      pendingApproval: {
        ...pending,
        approved: false,
        denied: true,
        executionBlocked: true,
        fidoVerified: false,
        actualApproverRole: "Human Reviewer",
        denialReason: "Human reviewer denied or blocked the AI-agent action.",
        message: "AI-agent action denied by human reviewer. Execution blocked.",
      },
      currentStep: "approval",
    };
  }

  if (userApproved) {
    const fidoChallenge = generateFidoChallenge();

    const fidoVerified = verifyFidoChallenge(fidoChallenge, latestHumanText);

    if (!fidoVerified) {
      return {
        pendingApproval: {
          ...pending,
          approved: false,
          denied: true,
          executionBlocked: true,
          fidoVerified: false,
          actualApproverRole: "Human Reviewer",
          denialReason:
            "FIDO/WebAuthn challenge failed or expired. Approval denied.",
          message:
            "FIDO/WebAuthn challenge failed or expired. Execution blocked.",
          fidoChallenge: {
            challengeId: fidoChallenge.challengeId,
            requiredUserPresence: fidoChallenge.requiredUserPresence,
            requiredUserVerification: fidoChallenge.requiredUserVerification,
            authenticatorType: fidoChallenge.authenticatorType,
            expiresAt: fidoChallenge.expiresAt,
            verified: false,
          },
        },
        currentStep: "approval",
      };
    }

    return {
      pendingApproval: {
        ...pending,
        approved: true,
        denied: false,
        executionBlocked: false,
        fidoVerified: true,
        actualApproverRole: pending.requiredApproverRole ?? "Cloud Admin",
        message:
          "Plan approved after simulated FIDO/WebAuthn verification.",
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
      denied: false,
      executionBlocked: true,
      fidoVerified: false,
      message:
        "Pending human approval. Execution is blocked until approval is verified.",
    },
    currentStep: "approval",
  };
}