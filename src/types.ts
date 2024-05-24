export interface ConversationEntry {
  speaker: "ai" | "human";
  text: string;
  prompts?: { text: string; clicked: boolean }[];
  timestamp?: string; // Add timestamp property
}
