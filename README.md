# langgraph-ts-workflow

**LangGraph.js stateful agent workflows with checkpoints**  
Clone → `npm install` → `npm run dev` → graph-based orchestration.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![LangGraph.js](https://img.shields.io/badge/LangGraph.js-1.2-3178C6)](https://langchain-ai.github.io/langgraphjs/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org/)

---

## What is this?

`langgraph-ts-workflow` is a **production-ready TypeScript starter** for building stateful, multi-step AI agents using [LangGraph.js](https://langchain-ai.github.io/langgraphjs/) — a low-level orchestration framework for controllable, graph-based AI workflows.

Unlike simple function chains, real-world agents need **branching logic, persistent memory, and human oversight**. LangGraph models your agent as a **directed graph**: each node performs work (call an LLM, validate a plan, execute), edges define flow, and state accumulates at every step.

**Good fits:**

- Multi-step research pipelines (plan → review → execute)
- Human-in-the-loop approval (plan → approve → run)
- Long-running tasks with **checkpoint persistence** across invocations
- Prototypes that must run **without an API key** (deterministic mock LLM)

---

## Features

| Feature | Description |
|--------|-------------|
| **Graph state machine** | Nodes: `planning` → `approval` → `execution` with conditional routing to `END` until approved. |
| **Checkpoint persistence** | `MemorySaver` in development; swap for Sqlite/Postgres/Redis in production. |
| **Two-turn demo** | First message creates a plan; second message with **approve** (or standalone **yes**) resumes the same `thread_id` and runs execution. |
| **Full TypeScript** | `Annotation.Root` state with typed reducers. |
| **Offline-friendly** | Without `OPENAI_API_KEY`, planning and execution use clear mock outputs. |

---

## Installation

```bash
cd langgraph-ts-workflow
npm install
```

Requires **Node.js 20+**.

---

## Quick start

### 1. Environment

```bash
cp .env.example .env.local
# Edit .env.local — set OPENAI_API_KEY for live LLM calls
```

### 2. Run the demo CLI

```bash
npm run dev
```

Optional: `npm run dev -- --thread my-user-id` to set the checkpoint `thread_id`.  
The demo sends two turns automatically: a planning request, then an approval message.

### 3. Build and run compiled output

```bash
npm run build
npm start
```

`npm start` runs `node dist/index.js`. A **`prestart`** hook runs **`npm run build`** automatically, so a plain `npm start` after clone still works (omit `prestart` in your fork if you prefer not to rebuild each time).

### Scripts reference

| Script | Purpose |
|--------|---------|
| `npm run dev` | Run the CLI with **tsx** (no build). |
| `npm run build` | Emit **`dist/`** with **tsc**. |
| `npm start` | **`prestart`** → build, then **`node dist/index.js`**. |
| `npm test` | Vitest: utils, graph, checkpoint (no API key). |
| `npm run test:watch` | Vitest in watch mode. |
| `npm run test:integration` | Live OpenAI path (skipped without `OPENAI_API_KEY`). |
| `npm run test:checkpoint` | Checkpoint listing smoke test only. |

---

## Architecture

```
User message
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│                   StateGraph (LangGraph)                    │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌───────┐  │
│  │ Planning │───▶│ Approval │───▶│ Execution│───▶│  END  │  │
│  └──────────┘    └──────────┘    └──────────┘    └───────┘  │
│                       │ (conditional)                     │
│                       └──────────▶ END (not approved)      │
└─────────────────────────────────────────────────────────────┘
```

- **`planning`** — Produces a markdown plan (OpenAI if configured, else mock). If a plan already exists from a prior checkpoint and the new user message is clearly an approval, it marks the plan approved without re-planning.
- **`approval`** — Routes to `execution` only when `pendingApproval.approved` is true.
- **`execution`** — Final response; clears `pendingApproval` (the reducer treats **`null` as an explicit clear**, not “keep previous”).

Checkpoints are keyed by `configurable.thread_id` so the same conversation can continue across process restarts when using a durable checkpointer.

---

## API notes

### Compile with a checkpointer

```typescript
import { MemorySaver } from "@langchain/langgraph";
import { agentGraph } from "./workflows/agent.js";

const agent = agentGraph.compile({ checkpointer: new MemorySaver() });
await agent.invoke(input, { configurable: { thread_id: "user-123" } });
```

### State (`src/state.ts`)

- **`messages`** — Appended via reducer (`HumanMessage` / `AIMessage`).
- **`pendingApproval`** — `{ approved, planText, message? } | null`; return **`null`** from a node to clear pending approval (the channel reducer uses `undefined` to mean “no update” and `null` to mean “clear”).
- **`currentStep`** — `"planning" | "approval" | "execution" | "done"` for observability.

### LLM wiring

OpenAI is configured in **`src/nodes/model.ts`** (`getChatModel`). Planning uses temperature `0.2`, execution `0.3`. Without `OPENAI_API_KEY`, nodes use deterministic mock text.

**Execution** passes the **first** human message in state as the original user goal (and the **latest** human message separately), so a second turn that only says “approve” does not replace the task for the model or the mock output.

---

## Docker (Ollama)

```bash
docker compose up -d ollama
```

This exposes Ollama on `http://localhost:11434`. To use it from this repo, add [`ChatOllama`](https://js.langchain.com/docs/integrations/chat/ollama) in `src/nodes/planning.ts` / `execution.ts` (optional extension — not wired by default).

---

## Testing

Vitest loads **`.env.local`** / **`.env`** via `tests/setup.ts` (same idea as the CLI), so `OPENAI_API_KEY` in a local env file is visible to **`npm run test:integration`**.

```bash
npm test                 # unit + graph + checkpoint (no API key)
npm run test:integration # live OpenAI test (skipped if OPENAI_API_KEY unset)
npm run test:checkpoint  # checkpoint listing smoke test
```

---

## Project structure

```
langgraph-ts-workflow/
├── src/
│   ├── state.ts              # Annotation.Root state
│   ├── nodes/                # planning, approval, execution, model, utils
│   ├── workflows/
│   │   └── agent.ts          # StateGraph definition
│   ├── checkpointers/
│   │   └── memory.ts         # MemorySaver factory
│   └── index.ts              # CLI demo
├── tests/
│   ├── setup.ts              # loads .env.local / .env for vitest
│   ├── utils.test.ts
│   ├── graph.test.ts
│   ├── checkpoint.test.ts
│   └── integration.test.ts   # live OpenAI (skipped without key)
├── .env.example
├── .gitignore
├── docker-compose.yml
├── LICENSE
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

## Troubleshooting

| Issue | What to try |
|-------|-------------|
| `npm start` fails with missing `dist/` | Run `npm run build`, or use plain `npm start` (runs `prestart` → build). |
| Integration test always skipped | Set `OPENAI_API_KEY` in `.env.local` / `.env` or the shell; vitest loads those files in `tests/setup.ts`. |
| Approval ignored on first message | Long prompts that contain “yes” are intentionally not treated as approval; use **approve** / **proceed** or a standalone **yes**. |

---

## Resources

- [LangGraph.js documentation](https://langchain-ai.github.io/langgraphjs/)
- [LangGraph graph API](https://docs.langchain.com/oss/javascript/langgraph/graph-api)

---

## License

MIT — see [LICENSE](./LICENSE).
