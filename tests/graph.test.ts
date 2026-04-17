import { describe, it, expect, beforeEach } from "vitest";
import { HumanMessage } from "@langchain/core/messages";
import { agentGraph } from "../src/workflows/agent.js";
import { createMemoryCheckpointer } from "../src/checkpointers/memory.js";

describe("agent graph", () => {
  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  it("stops after approval when user has not approved", async () => {
    const agent = agentGraph.compile({ checkpointer: createMemoryCheckpointer() });
    const config = { configurable: { thread_id: "test-graph-1" } };
    const out = await agent.invoke(
      { messages: [new HumanMessage("Research LangGraph")] },
      { configurable: config.configurable }
    );
    expect(out.pendingApproval?.approved).toBe(false);
    expect(out.currentStep).toBe("approval");
    const names = out.messages.map((m) => m.name).filter(Boolean);
    expect(names).not.toContain("execution");
  });

  it("runs execution after approval on second invoke", async () => {
    const agent = agentGraph.compile({ checkpointer: createMemoryCheckpointer() });
    const config = { configurable: { thread_id: "test-graph-2" } };
    await agent.invoke(
      { messages: [new HumanMessage("Research LangGraph")] },
      { configurable: config.configurable }
    );
    const out = await agent.invoke(
      { messages: [new HumanMessage("approve")] },
      { configurable: config.configurable }
    );
    expect(out.currentStep).toBe("done");
    expect(out.pendingApproval).toBeNull();
    const names = out.messages.map((m) => m.name).filter(Boolean);
    expect(names).toContain("execution");
    const last = out.messages[out.messages.length - 1];
    const text = typeof last.content === "string" ? last.content : "";
    expect(text).toContain("Research LangGraph");
  });
});
