# FIDO-Guard: Human-Verified Security Gateway for AI-Agent Actions

FIDO-Guard is a TypeScript and LangGraph-based security workflow prototype that prevents high-risk AI-agent actions from executing automatically. The project simulates a DevOps AI agent attempting to perform a sensitive production action, then requires human approval and a simulated FIDO2/WebAuthn verification step before execution is allowed.

This project demonstrates how human-in-the-loop security controls can be added to AI-agent workflows to reduce the risk of unauthorized, unsafe, or unverified automated actions.

---

## Problem Statement

AI agents are increasingly being used to automate operational tasks such as deployment, credential rotation, infrastructure changes, and security workflows. However, some actions are too sensitive to allow without human verification.

Examples of high-risk AI-agent actions include:

* Rotating production API keys
* Deploying a new production model version
* Modifying cloud infrastructure
* Changing identity and access controls
* Executing privileged DevOps tasks

FIDO-Guard addresses this problem by requiring a human-verified approval gate before an AI agent can execute a critical action.

---

## Project Scenario

In this prototype, an AI DevOps agent requests permission to:

> Rotate the production AI API key and deploy a new model version to the Production Model API.

FIDO-Guard classifies this as a critical-risk action because it affects production secrets and a production model endpoint.

The AI agent is not allowed to execute automatically. The workflow requires:

1. Security planning and risk classification
2. Human approval
3. Simulated FIDO2/WebAuthn verification
4. Execution only after approval is verified
5. Audit logging
6. Final security decision report generation

---

## Security Workflow

```text
AI-agent action request
        ↓
Planning node reviews the request
        ↓
Risk is classified as Critical
        ↓
Approval node requires human approval
        ↓
Simulated FIDO/WebAuthn challenge is generated
        ↓
FIDO/WebAuthn verification succeeds
        ↓
Execution node performs the approved action
        ↓
Audit log is written
        ↓
Security decision report is generated
```

---

## Features Completed

| Feature                           |   Status | Description                                                                    |
| --------------------------------- | -------: | ------------------------------------------------------------------------------ |
| LangGraph workflow                | Complete | Uses planning, approval, and execution nodes                                   |
| Human-in-the-loop approval        | Complete | Requires an approval phrase before execution                                   |
| Simulated FIDO/WebAuthn challenge | Complete | Generates a challenge and verifies approval                                    |
| Audit logging                     | Complete | Writes approved AI-agent actions to `audit-log.json`                           |
| Security decision report          | Complete | Produces a final report describing risk, approval, execution, and audit status |
| GitHub version control            | Complete | Project is committed and pushed to GitHub                                      |

---

## Project Architecture

```text
src/
├── index.ts                    # Main workflow entry point
├── state.ts                    # LangGraph state definition
├── model.ts                    # Chat model configuration
├── utils.ts                    # Helper functions
├── auditLogger.ts              # Writes audit events to audit-log.json
├── fidoChallenge.ts            # Generates and verifies simulated FIDO/WebAuthn challenges
├── securityDecisionReport.ts   # Generates the final security decision report
└── nodes/
    ├── planning.ts             # Reviews the AI-agent action request
    ├── approval.ts             # Handles approval and FIDO verification
    └── execution.ts            # Executes approved actions and writes audit logs
```

---

## Audit Logging

FIDO-Guard writes approved execution events to:

```text
audit-log.json
```

This file is intentionally excluded from GitHub using `.gitignore` because audit logs may contain sensitive security activity.

Example audit event:

```json
{
  "eventType": "AI_AGENT_ACTION",
  "actor": "FIDO-Guard AI DevOps Agent",
  "action": "Rotate production AI API key and deploy model version",
  "status": "APPROVED_AND_EXECUTED",
  "details": {
    "approvalMethod": "Simulated FIDO/WebAuthn human approval",
    "securityGateway": "FIDO-Guard",
    "riskLevel": "High",
    "environment": "Production",
    "targetResource": "Production Model API",
    "fidoRequired": true,
    "fidoUserPresenceRequired": true,
    "fidoUserVerificationRequired": true,
    "fidoVerified": true
  }
}
```

---

## Security Decision Report

After successful approval and execution, FIDO-Guard generates a final security decision report.

Example output:

```md
## FIDO-Guard Security Decision Report

**Original Request:** An AI DevOps agent wants to rotate the production AI API key and deploy a new model version to the Production Model API.
**Requested Action:** Rotate production AI API key and deploy new model version
**Target Resource:** Production Model API

### Security Classification
**Risk Level:** Critical
**Policy Decision:** Block automatic execution
**Required Approver:** Cloud Admin
**Required Authentication:** FIDO2/WebAuthn passkey or security key

### Approval Verification
**Approval Status:** Verified
**FIDO/WebAuthn Verified:** Yes

### Execution Outcome
**Execution Status:** Approved and executed
**Audit Status:** Logged

### Final Decision
The AI-agent action was allowed only after verified human approval using a simulated FIDO/WebAuthn challenge.
```

---

## How to Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/chimbama001/FIDO-guard-ai-agent-security.git
cd FIDO-guard-ai-agent-security
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the workflow

```bash
npm run dev
```

---

## Current Limitations

This is a prototype. The current FIDO/WebAuthn step is simulated in TypeScript and does not yet connect to a browser-based passkey, platform authenticator, or physical security key.

The current implementation proves the security workflow pattern:

```text
High-risk AI action → human approval → simulated FIDO verification → execution → audit log → security report
```

---

## Future Improvements

Planned improvements include:

* Add real WebAuthn/FIDO2 approval using SimpleWebAuthn
* Add browser-based approval UI
* Store audit logs in a secure database
* Add policy rules for different AI-agent action types
* Add role-based approval requirements
* Add cryptographic signing for audit records
* Add dashboard view for approval history
* Add denial workflow for failed or expired FIDO challenges

---

## Security Value

FIDO-Guard demonstrates an important AI security control: AI agents should not be allowed to perform privileged production actions without verified human approval.

This aligns with security principles such as:

* Least privilege
* Human-in-the-loop authorization
* Strong authentication
* Auditability
* Separation of duties
* Controlled execution of high-risk actions

---

## Tech Stack

* TypeScript
* Node.js
* LangGraph.js
* LangChain
* GitHub
* Simulated FIDO2/WebAuthn challenge flow

---

## Author

**Kirk Chimbama**
Cybersecurity Student
GitHub: [chimbama001](https://github.com/chimbama001)
