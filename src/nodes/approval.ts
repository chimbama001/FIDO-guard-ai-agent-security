import type { AgentStateType, PendingApprovalState } from "../state.js";
import { getLastHumanText } from "./utils.js";
import {
  generateFidoChallenge,
  verifyFidoChallenge,
} from "../fidoChallenge.js";
import { writeAuditLog } from "../auditLogger.js";

const approvalPhrases = ["approve", "approved", "yes", "proceed", "authorize"];
const denialPhrases = ["deny", "denied", "reject", "no", "block"];

function includesAnyPhrase(text: string, phrases: string[]): boolean {
  const normalized = text.toLowerCase();
  return phrases.some((phrase) => normalized.includes(phrase));
}

function logBlockedAction(
  status: string,
  reason: string,
  pending?: PendingApprovalState
): void {
  writeAuditLog({
    eventType: "AI_AGENT_ACTION_BLOCKED",
    actor: "FIDO-Guard AI DevOps Agent",
    action:
      pending?.planText ??
      "Rotate production AI API key and deploy model version",
    status,
    details: {
      securityGateway: "FIDO-Guard",
      reason,
      riskLevel: "Critical",
      environment: "Production",
      targetResource: "Production Model API",
      requiredApproverRole: pending?.requiredApproverRole ?? "Cloud Admin",
      approved: false,
      denied: pending?.denied ?? false,
      executionBlocked: true,
      fidoRequired: true,
      fidoVerified: pending?.fidoVerified ?? false,
    },
  });
}

export async function approvalNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  const pending = state.pendingApproval;

  if (!pending) {
    logBlockedAction(
      "BLOCKED_NO_PENDING_APPROVAL",
      "No pending approval request exists."
    );

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
    const denialReason =
      "Human reviewer denied or blocked the AI-agent action.";

    logBlockedAction("DENIED_BY_HUMAN_REVIEWER", denialReason, {
      ...pending,
      denied: true,
      fidoVerified: false,
    });

    return {
      pendingApproval: {
        ...pending,
        approved: false,
        denied: true,
        executionBlocked: true,
        fidoVerified: false,
        actualApproverRole: "Human Reviewer",
        denialReason,
        message: "AI-agent action denied by human reviewer. Execution blocked.",
      },
      currentStep: "approval",
    };
  }

  if (userApproved) {
    const fidoChallenge = generateFidoChallenge();

    const fidoVerified = verifyFidoChallenge(fidoChallenge, latestHumanText);

    if (!fidoVerified) {
      const denialReason =
        fidoChallenge.failureReason ??
        "FIDO/WebAuthn challenge failed or expired. Approval denied.";

      logBlockedAction("BLOCKED_FIDO_VERIFICATION_FAILED", denialReason, {
        ...pending,
        denied: true,
        fidoVerified: false,
      });

      return {
        pendingApproval: {
          ...pending,
          approved: false,
          denied: true,
          executionBlocked: true,
          fidoVerified: false,
          actualApproverRole: "Human Reviewer",
          denialReason,
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

  const pendingReason =
    "Execution is blocked because verified human approval has not been completed.";

  logBlockedAction("BLOCKED_PENDING_HUMAN_APPROVAL", pendingReason, pending);

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