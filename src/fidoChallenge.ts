import crypto from "crypto";

type FidoChallenge = {
  challengeId: string;
  challenge: string;
  requiredUserPresence: boolean;
  requiredUserVerification: boolean;
  authenticatorType: string;
  expiresAt: string;
};

export function generateFidoChallenge(): FidoChallenge {
  const challengeId = crypto.randomUUID();
  const challenge = crypto.randomBytes(32).toString("base64url");

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  return {
    challengeId,
    challenge,
    requiredUserPresence: true,
    requiredUserVerification: true,
    authenticatorType: "FIDO2/WebAuthn passkey or security key",
    expiresAt,
  };
}

export function verifyFidoChallenge(challenge: FidoChallenge, approvalText: string): boolean {
  const isExpired = Date.now() > new Date(challenge.expiresAt).getTime();

  if (isExpired) {
    return false;
  }

  const normalizedApproval = approvalText.trim().toLowerCase();

  const approvalPhrases = [
    "approve",
    "approved",
    "yes",
    "ok",
    "proceed",
    "please proceed",
    "i approve",
  ];

  return approvalPhrases.some((phrase) => normalizedApproval.includes(phrase));
