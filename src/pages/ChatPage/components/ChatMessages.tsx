import { forwardRef } from "react";
import { ChatMessage } from "../types";

interface ChatMessagesProps {
  messages: ChatMessage[];
  isAwaitingResponse: boolean;
}

const ChatMessages = forwardRef<HTMLDivElement, ChatMessagesProps>(
  ({ messages, isAwaitingResponse }, ref) => {
    return (
      <div ref={ref} className="chat-messages" role="log" aria-live="polite">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`chat-message chat-message--${message.author}`}
          >
            <p className="chat-message__text">{message.text}</p>
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
