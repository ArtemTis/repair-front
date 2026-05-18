import { forwardRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { ChatMessage } from "../types";

interface ChatMessagesProps {
  messages: ChatMessage[];
  isAwaitingResponse: boolean;
}

/** Модели часто вставляют ### и «1.» в середину строки; для CommonMark заголовок/список должны начинаться с новой строки. */
function normalizeAssistantMarkdown(text: string): string {
  return text
    .trim()
    .replace(/\r\n/g, "\n")
    .replace(/([^\n])\s+(#{1,6}\s)/g, "$1\n\n$2")
    .replace(/:\s+(#{1,6}\s)/g, ":\n\n$1")
    .replace(/:\s+(\d+\.\s)/g, ":\n\n$1")
    .replace(/([.!?])\s+(\d+\.\s)/g, "$1\n\n$2");
}

const markdownComponents: Components = {
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
};

const ChatMessages = forwardRef<HTMLDivElement, ChatMessagesProps>(
  ({ messages, isAwaitingResponse }, ref) => {
    return (
      <div ref={ref} className="chat-messages" role="log" aria-live="polite">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`chat-message chat-message--${message.author}`}
          >
            {message.author === "companion" ? (
              <div className="chat-message__markdown">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {normalizeAssistantMarkdown(message.text)}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="chat-message__text">{message.text}</p>
            )}
            <span className="chat-message__time">{message.timestamp}</span>
          </div>
        ))}
        {isAwaitingResponse && (
          <div className="chat-message chat-message--companion chat-message--loader">
            <p className="chat-message__text">
              ИИ думает
              <span className="chat-loader-dots" aria-hidden="true">
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </span>
            </p>
          </div>
        )}
      </div>
    );
  }
);

ChatMessages.displayName = "ChatMessages";

export default ChatMessages;
