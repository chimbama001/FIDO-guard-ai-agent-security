type SecurityDecisionReportInput = {
  originalRequest: string;
  requestedAction: string;
  targetResource: string;
  riskLevel: string;
  requiredApprover: string;
  requiredAuthentication: string;
  approvalStatus: string;
  fidoVerified: boolean;
  executionStatus: string;
  auditStatus: string;
};

export function generateSecurityDecisionReport(
  input: SecurityDecisionReportInput
): string {
  return [
    "## FIDO-Guard Security Decision Report",
    "",
    `**Original Request:** ${input.originalRequest}`,
    `**Requested Action:** ${input.requestedAction}`,
    `**Target Resource:** ${input.targetResource}`,
    "",
    "### Security Classification",
    `**Risk Level:** ${input.riskLevel}`,
    `**Policy Decision:** Block automatic execution`,
    `**Required Approver:** ${input.requiredApprover}`,
    `**Required Authentication:** ${input.requiredAuthentication}`,
    "",
    "### Approval Verification",
    `**Approval Status:** ${input.approvalStatus}`,
    `**FIDO/WebAuthn Verified:** ${input.fidoVerified ? "Yes" : "No"}`,
    "",
    "### Execution Outcome",
    `**Execution Status:** ${input.executionStatus}`,
    `**Audit Status:** ${input.auditStatus}`,
    "",
    "### Final Decision",
    input.fidoVerified
      ? "The AI-agent action was allowed only after verified human approval using a simulated FIDO/WebAuthn challenge."
      : "The AI-agent action was denied because verified FIDO/WebAuthn approval was not completed.",
  ].join("\n");
}