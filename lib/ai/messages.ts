import { HumanMessage, SystemMessage, AIMessage, type BaseMessage } from "@langchain/core/messages";
import type { ChatMessage } from "@/lib/types";

/**
 * Convert app ChatMessage[] to LangChain BaseMessage[].
 * Keeps system messages (e.g. conversation summary from summarizeMessagesLocally) so the coach has full context.
 */
export function toLangChainMessages(messages: ChatMessage[]): BaseMessage[] {
  return messages.map((m) => {
    if (m.role === "system") return new SystemMessage(m.content);
    if (m.role === "user") return new HumanMessage(m.content);
    if (m.role === "assistant") return new AIMessage(m.content);
    return new HumanMessage(m.content);
  });
}

/**
 * Build system messages for the coach: base prompt + mode-specific prompt.
 */
export function buildSystemMessages(systemText: string, modePromptText: string): BaseMessage[] {
  return [
    new SystemMessage(systemText),
    new SystemMessage(modePromptText)
  ];
}
