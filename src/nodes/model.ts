import { ChatOpenAI } from "@langchain/openai";

/** Shared OpenAI client; `null` when `OPENAI_API_KEY` is unset (mock path). */
export function getChatModel(temperature: number): ChatOpenAI | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new ChatOpenAI({
    apiKey: key,
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    temperature,
  });
}
