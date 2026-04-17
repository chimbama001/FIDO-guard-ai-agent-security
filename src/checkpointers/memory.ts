import { MemorySaver } from "@langchain/langgraph";

/** In-memory checkpoints — swap for SqliteSaver / PostgresSaver in production */
export function createMemoryCheckpointer(): MemorySaver {
  return new MemorySaver();
}
