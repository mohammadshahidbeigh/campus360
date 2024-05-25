export interface ConversationEntry {
  speaker: "ai" | "human";
  text: string;
  timestamp?: string;
  prompts?: { text: string; clicked: boolean }[];
}
