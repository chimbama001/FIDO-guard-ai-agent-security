import { writeAuditLog } from "../auditLogger.js";
import {
  generateFidoChallenge,
  verifyFidoChallenge,
} from "../fidoChallenge.js";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type FidoGuardActionRequest = {
  agentId: string;
  requestedAction: string;
  targetResource: string;
  environment: "development" | "staging" | "production";
  riskLevel: RiskLevel;
  requiredApproverRole?: string;
  humanApprovalText?: string;
};

export type FidoGuardDecision = {
  allowed: boolean;
  status:
    | "ALLOWED_LOW_RISK"
    | "ALLOWED_AFTER_VERIFIED_APPROVAL"
    | "BLOCKED_PENDING_APPROVAL"
    | "DENIED_BY_HUMAN_REVIEWER"
    | "BLOCKED_FIDO_VERIFICATION_FAILED";
  reason: string;
  fidoVerified: boolean;
  challengeId?: string;
};

const approvalPhrases = ["approve", "approved", "yes", "proceed", "authorize"];
const denialPhrases = ["deny", "denied", "reject", "no", "block"];

function includesAnyPhrase(text: string, phrases: string[]): boolean {
  const normalized = text.toLowerCase();
  return phrases.some((phrase) => normalized.includes(phrase));
}

function requiresHumanApproval(riskLevel: RiskLevel): boolean {
  return riskLevel === "high" || riskLevel === "critical";
}

export async function fidoGuardMiddleware(
  request: FidoGuardActionRequest
): Promise<FidoGuardDecision> {
  const approvalText = request.humanApprovalText ?? "";

  if (!requiresHumanApproval(request.riskLevel)) {
    const decision: FidoGuardDecision = {
      allowed: true,
      status: "ALLOWED_LOW_RISK",
      reason: "Low or medium risk action does not require FIDO-Guard approval.",
      fidoVerified: false,
    };

    writeAuditLog({
      eventType: "AI_AGENT_ACTION_ALLOWED",
      actor: request.agentId,
      action: request.requestedAction,
      status: decision.status,
      details: {
        securityGateway: "FIDO-Guard Middleware",
        reason: decision.reason,
        riskLevel: request.riskLevel,
        environment: request.environment,
        targetResource: request.targetResource,
        fidoRequired: false,
        fidoVerified: false,
      },
    });

    return decision;
  }

  const humanDenied = includesAnyPhrase(approvalText, denialPhrases);

  if (humanDenied) {
    const decision: FidoGuardDecision = {
      allowed: false,
      status: "DENIED_BY_HUMAN_REVIEWER",
      reason: "Human reviewer denied or blocked the AI-agent action.",
      fidoVerified: false,
    };

    writeAuditLog({
      eventType: "AI_AGENT_ACTION_BLOCKED",
      actor: request.agentId,
      action: request.requestedAction,
      status: decision.status,
      details: {
        securityGateway: "FIDO-Guard Middleware",
        reason: decision.reason,
        riskLevel: request.riskLevel,
        environment: request.environment,
        targetResource: request.targetResource,
        requiredApproverRole: request.requiredApproverRole ?? "Cloud Admin",
        fidoRequired: true,
        fidoVerified: false,
        executionBlocked: true,
      },
    });

    return decision;
  }

  const humanApproved = includesAnyPhrase(approvalText, approvalPhrases);

  if (!humanApproved) {
    const decision: FidoGuardDecision = {
      allowed: false,
      status: "BLOCKED_PENDING_APPROVAL",
      reason:
        "Execution blocked because verified human approval has not been completed.",
      fidoVerified: false,
    };

    writeAuditLog({
      eventType: "AI_AGENT_ACTION_BLOCKED",
      actor: request.agentId,
      action: request.requestedAction,
      status: decision.status,
      details: {
        securityGateway: "FIDO-Guard Middleware",
        reason: decision.reason,
        riskLevel: request.riskLevel,
        environment: request.environment,
        targetResource: request.targetResource,
        requiredApproverRole: request.requiredApproverRole ?? "Cloud Admin",
        fidoRequired: true,
        fidoVerified: false,
        executionBlocked: true,
      },
    });

    return decision;
  }

  const fidoChallenge = generateFidoChallenge();
  const fidoVerified = verifyFidoChallenge(fidoChallenge, approvalText);

  if (!fidoVerified) {
    const decision: FidoGuardDecision = {
      allowed: false,
      status: "BLOCKED_FIDO_VERIFICATION_FAILED",
      reason:
        fidoChallenge.failureReason ??
        "FIDO/WebAuthn challenge failed or expired.",
      fidoVerified: false,
      challengeId: fidoChallenge.challengeId,
    };

    writeAuditLog({
      eventType: "AI_AGENT_ACTION_BLOCKED",
      actor: request.agentId,
      action: request.requestedAction,
      status: decision.status,
      details: {
        securityGateway: "FIDO-Guard Middleware",
        reason: decision.reason,
        riskLevel: request.riskLevel,
        environment: request.environment,
        targetResource: request.targetResource,
        requiredApproverRole: request.requiredApproverRole ?? "Cloud Admin",
        fidoRequired: true,
        fidoVerified: false,
        executionBlocked: true,
        challengeId: fidoChallenge.challengeId,
      },
    });

    return decision;
  }

  const decision: FidoGuardDecision = {
    allowed: true,
    status: "ALLOWED_AFTER_VERIFIED_APPROVAL",
    reason:
      "Human approval and simulated FIDO/WebAuthn verification completed.",
    fidoVerified: true,
    challengeId: fidoChallenge.challengeId,
  };

  writeAuditLog({
    eventType: "AI_AGENT_ACTION_ALLOWED",
    actor: request.agentId,
    action: request.requestedAction,
    status: decision.status,
    details: {
      securityGateway: "FIDO-Guard Middleware",
      reason: decision.reason,
      riskLevel: request.riskLevel,
      environment: request.environment,
      targetResource: request.targetResource,
      requiredApproverRole: request.requiredApproverRole ?? "Cloud Admin",
      fidoRequired: true,
      fidoVerified: true,
      executionBlocked: false,
      challengeId: fidoChallenge.challengeId,
    },
  });

  return decision;
}
