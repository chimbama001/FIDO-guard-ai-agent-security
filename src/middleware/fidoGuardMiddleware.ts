import { writeAuditLog } from "../auditLogger.js";
import { assessActionRisk, type RiskLevel } from "../riskAssessment.js";

export type FidoGuardActionRequest = {
  agentId: string;
  requestedAction: string;
  targetResource: string;
  environment: "development" | "staging" | "production";
  riskLevel?: RiskLevel;
  requiredApproverRole?: string;
};

export type FidoGuardDecision = {
  allowed: boolean;
  status: "ALLOWED_LOW_OR_MEDIUM_RISK" | "BLOCKED_HIGH_RISK_ACTION";
  reason: string;
  riskLevel: RiskLevel;
  riskReasons: string[];
  matchedKeywords: string[];
  fidoVerified: boolean;
};

function shouldBlockAction(riskLevel: RiskLevel): boolean {
  return riskLevel === "high" || riskLevel === "critical";
}

export async function fidoGuardMiddleware(
  request: FidoGuardActionRequest
): Promise<FidoGuardDecision> {
  const riskAssessment = assessActionRisk({
    requestedAction: request.requestedAction,
    targetResource: request.targetResource,
    environment: request.environment,
  });

  const evaluatedRiskLevel = request.riskLevel ?? riskAssessment.riskLevel;

  if (shouldBlockAction(evaluatedRiskLevel)) {
    const decision: FidoGuardDecision = {
      allowed: false,
      status: "BLOCKED_HIGH_RISK_ACTION",
      reason:
        "Action blocked because FIDO-Guard classified it as high or critical risk.",
      riskLevel: evaluatedRiskLevel,
      riskReasons: riskAssessment.reasons,
      matchedKeywords: riskAssessment.matchedKeywords,
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
        riskLevel: decision.riskLevel,
        riskReasons: decision.riskReasons,
        matchedKeywords: decision.matchedKeywords,
        environment: request.environment,
        targetResource: request.targetResource,
        requiredApproverRole: request.requiredApproverRole ?? "Cloud Admin",
        fidoRequired: false,
        fidoVerified: false,
        executionBlocked: true,
      },
    });

    return decision;
  }

  const decision: FidoGuardDecision = {
    allowed: true,
    status: "ALLOWED_LOW_OR_MEDIUM_RISK",
    reason:
      "Action allowed because FIDO-Guard classified it as low or medium risk.",
    riskLevel: evaluatedRiskLevel,
    riskReasons: riskAssessment.reasons,
    matchedKeywords: riskAssessment.matchedKeywords,
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
      riskLevel: decision.riskLevel,
      riskReasons: decision.riskReasons,
      matchedKeywords: decision.matchedKeywords,
      environment: request.environment,
      targetResource: request.targetResource,
      fidoRequired: false,
      fidoVerified: false,
      executionBlocked: false,
    },
  });

  return decision;
}