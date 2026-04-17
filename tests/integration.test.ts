import { describe, it, expect } from "vitest";
import { HumanMessage } from "@langchain/core/messages";
import { agentGraph } from "../src/workflows/agent.js";
import { createMemoryCheckpointer } from "../src/checkpointers/memory.js";

/** Set after `tests/setup.ts` loads `.env.local` / `.env` */
function hasOpenAI(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

describe("integration (live OpenAI)", () => {
  it.skipIf(!hasOpenAI())(
    "completes plan → approve → execution with a real model",
    async () => {
      const agent = agentGraph.compile({ checkpointer: createMemoryCheckpointer() });
      const configurable = { thread_id: `int-${Date.now()}` };
      const r1 = await agent.invoke(
        { messages: [new HumanMessage("Say hello in one short sentence.")] },
        { configurable }
      );
      expect(r1.pendingApproval?.approved).toBe(false);

      const r2 = await agent.invoke(
        { messages: [new HumanMessage("approve")] },
        { configurable }
      );
      expect(r2.currentStep).toBe("done");
      expect(r2.pendingApproval).toBeNull();
    },
    60_000
  );
});
