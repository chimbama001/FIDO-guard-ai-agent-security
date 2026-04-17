/**
 * CLI demo: planning → approval → execution with MemorySaver checkpoints.
 * Load `.env.local` / `.env` when present (Node 20+ `--env-file` or dotenv).
 */
import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { HumanMessage } from "@langchain/core/messages";
import { agentGraph } from "./workflows/agent.js";
import { createMemoryCheckpointer } from "./checkpointers/memory.js";

function loadEnvironment(): void {
  const root = process.cwd();
  for (const name of [".env.local", ".env"]) {
    const p = resolve(root, name);
    if (existsSync(p)) {
      loadEnv({ path: p });
    }
  }
}

async function main(): Promise<void> {
  loadEnvironment();

  const args = process.argv.slice(2);
  const threadIdx = args.indexOf("--thread");
  const threadId =
    threadIdx >= 0 && args[threadIdx + 1]
      ? args[threadIdx + 1]
      : "cli-demo";

  const rest = args.filter((_, i) => {
    if (threadIdx >= 0 && (i === threadIdx || i === threadIdx + 1)) return false;
    return true;
  });

  const userLine = rest.join(" ").trim();
  const prompt =
    userLine ||
    "Plan a weekend research sprint on LangGraph.js checkpoints.";

  const checkpointer = createMemoryCheckpointer();
  const agent = agentGraph.compile({ checkpointer });
  const configurable = { thread_id: threadId };

  console.log("--- Turn 1: plan request ---");
  const r1 = await agent.invoke(
    { messages: [new HumanMessage(prompt)] },
    { configurable }
  );
  printStateSummary(r1);

  console.log("\n--- Turn 2: approval (same thread) ---");
  const r2 = await agent.invoke(
    { messages: [new HumanMessage("I approve — please proceed.")] },
    { configurable }
  );
  printStateSummary(r2);
}

function printStateSummary(state: unknown): void {
  if (!state || typeof state !== "object") {
    console.log(JSON.stringify(state, null, 2));
    return;
  }
  const s = state as Record<string, unknown>;
  const step = s.currentStep;
  const pending = s.pendingApproval;
  console.log("currentStep:", step);
  console.log("pendingApproval:", JSON.stringify(pending, null, 2));
  const msgs = s.messages;
  if (Array.isArray(msgs)) {
    const last = msgs[msgs.length - 1];
    if (last && typeof last === "object" && "content" in last) {
      const c = (last as { content: unknown }).content;
      const text = typeof c === "string" ? c : JSON.stringify(c);
      console.log("last message preview:", text.slice(0, 400) + (text.length > 400 ? "…" : ""));
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
