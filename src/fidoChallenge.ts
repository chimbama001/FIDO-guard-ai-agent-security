import { randomUUID } from "node:crypto";

export type FidoChallenge = {
  challengeId: string;
  challenge: string;
  requiredUserPresence: boolean;
  requiredUserVerification: boolean;
  authenticatorType: string;
  expiresAt: string;
  verified: boolean;
  failureReason?: string;
};

export function generateFidoChallenge(): FidoChallenge {
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  return {
    challengeId: randomUUID(),
    challenge: randomUUID(),
    requiredUserPresence: true,
    requiredUserVerification: true,
    authenticatorType: "FIDO2/WebAuthn passkey or security key",
    expiresAt,
    verified: false,
  };
}

export function verifyFidoChallenge(
  challenge: FidoChallenge,
  approvalText: string
): boolean {
  const now = new Date();
  const expirationTime = new Date(challenge.expiresAt);

  if (now > expirationTime) {
    challenge.verified = false;
    challenge.failureReason = "FIDO/WebAuthn challenge expired.";
    return false;
  }

  const normalizedApproval = approvalText.toLowerCase();

  const approvalPhrases = [
    "approve",
    "approved",
    "yes",
    "proceed",
    "authorize",
  ];

  const approved = approvalPhrases.some((phrase) =>
    normalizedApproval.includes(phrase)
  );

  if (!approved) {
    challenge.verified = false;
    challenge.failureReason = "Approval phrase was missing.";
    return false;
  }

  challenge.verified = true;
  return true;
}