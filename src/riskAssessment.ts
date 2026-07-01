export type RiskLevel = "low" | "medium" | "high" | "critical";

export type RiskAssessmentInput = {
  requestedAction: string;
  targetResource?: string;
  environment?: string;
};

export type RiskAssessmentResult = {
  riskLevel: RiskLevel;
  reasons: string[];
  matchedKeywords: string[];
};

const criticalKeywords = [
  "production",
  "prod",
  "api key",
  "secret",
  "credential",
  "password",
  "private key",
  "delete database",
  "drop database",
  "rotate key",
  "rotate api key",
  "deploy to production",
  "modify iam",
  "change iam",
  "admin access",
  "root access",
  "disable mfa",
  "disable logging",
  "security group",
  "firewall rule",
];

const highRiskKeywords = [
  "deploy",
  "delete",
  "remove",
  "shutdown",
  "restart service",
  "change permissions",
  "change access",
  "modify infrastructure",
  "create admin",
  "grant access",
  "revoke access",
  "database migration",
  "network configuration",
  "cloud configuration",
];

const mediumRiskKeywords = [
  "restart",
  "update",
  "patch",
  "configure",
  "change setting",
  "staging",
  "test environment",
  "backup",
  "scan",
  "run vulnerability scan",
];

const lowRiskKeywords = [
  "read",
  "list",
  "view",
  "get",
  "check status",
  "fetch logs",
  "summarize",
  "generate report",
  "research",
];

function findMatches(text: string, keywords: string[]): string[] {
  return keywords.filter((keyword) => text.includes(keyword));
}

export function assessActionRisk(
  input: RiskAssessmentInput
): RiskAssessmentResult {
  const combinedText = [
    input.requestedAction,
    input.targetResource ?? "",
    input.environment ?? "",
  ]
    .join(" ")
    .toLowerCase();

  const criticalMatches = findMatches(combinedText, criticalKeywords);
  const highMatches = findMatches(combinedText, highRiskKeywords);
  const mediumMatches = findMatches(combinedText, mediumRiskKeywords);
  const lowMatches = findMatches(combinedText, lowRiskKeywords);

  if (criticalMatches.length > 0) {
    return {
      riskLevel: "critical",
      reasons: [
        "Action affects production, secrets, credentials, identity, network controls, or security logging.",
      ],
      matchedKeywords: criticalMatches,
    };
  }

  if (highMatches.length > 0) {
    return {
      riskLevel: "high",
      reasons: [
        "Action can change system behavior, access, infrastructure, deployment, or availability.",
      ],
      matchedKeywords: highMatches,
    };
  }

  if (mediumMatches.length > 0) {
    return {
      riskLevel: "medium",
      reasons: [
        "Action may affect configuration, maintenance, scanning, or non-production operations.",
      ],
      matchedKeywords: mediumMatches,
    };
  }

  if (lowMatches.length > 0) {
    return {
      riskLevel: "low",
      reasons: ["Action appears read-only, informational, or reporting-focused."],
      matchedKeywords: lowMatches,
    };
  }

  return {
    riskLevel: "medium",
    reasons: [
      "Risk could not be confidently classified, so the action defaults to medium risk.",
    ],
    matchedKeywords: [],
  };
}