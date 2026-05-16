export type MessageAuthor = "me" | "companion";

export interface ChatMessage {
  id: string;
  text: string;
  author: MessageAuthor;
  timestamp: string;
}
