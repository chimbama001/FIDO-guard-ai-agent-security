import { describe, it, expect, beforeEach } from "vitest";
import { HumanMessage } from "@langchain/core/messages";
import { agentGraph } from "../src/workflows/agent.js";
import { createMemoryCheckpointer } from "../src/checkpointers/memory.js";

describe("checkpoint persistence", () => {
  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  it("lists checkpoints for a thread after invoke", async () => {
    const checkpointer = createMemoryCheckpointer();
    const agent = agentGraph.compile({ checkpointer });
    const configurable = { thread_id: "cp-1" };
    await agent.invoke(
      { messages: [new HumanMessage("hello")] },
      { configurable }
    );

    const tuples: unknown[] = [];
    for await (const t of checkpointer.list({ configurable })) {
      tuples.push(t);
    }
    expect(tuples.length).toBeGreaterThan(0);
  });
});
