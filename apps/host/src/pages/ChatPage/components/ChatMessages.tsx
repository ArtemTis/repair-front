import { forwardRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { ChatMessage } from "../types";
import { Button } from "../../../shared/ui";

export type ReportSaveEntry = {
  status: "idle" | "saving" | "saved" | "error";
  repairHistoryId?: number;
};

interface ChatMessagesProps {
  messages: ChatMessage[];
  isAwaitingResponse: boolean;
  onToggleReport?: (messageId: string) => void;
  getReportSaveEntry?: (messageId: string) => ReportSaveEntry;
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
  ({ messages, isAwaitingResponse, onToggleReport, getReportSaveEntry }, ref) => {
    return (
      <div className="chat-messages" role="log" aria-live="polite">
        {messages.map((message) => {
          const reportEntry = getReportSaveEntry?.(message.id) ?? { status: "idle" as const };
          const reportStatus = reportEntry.status;
          const isSaved = reportStatus === "saved";
          const showReportAction =
            message.author === "companion" &&
            !message.omitFromAiHistory &&
            Boolean(onToggleReport);

          return (
            <div
              key={message.id}
              className={`chat-message chat-message--${message.author}`}
            >
              {message.author === "companion" ? (
                <div className="chat-message__markdown">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {normalizeAssistantMarkdown(message.text)}
                  </ReactMarkdown>
                </div>
              ) : (
                <>
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="chat-message__attachments">
                      {message.attachments
                        .filter((a) => a.kind === "image")
                        .map((a, idx) => (
                          <button
                            type="button"
                            key={`${message.id}-img-${idx}`}
                            className="chat-message__thumb-wrap"
                            onClick={() => window.open(a.dataUrl, "_blank", "noopener,noreferrer")}
                            title="Открыть изображение"
                          >
                            <img className="chat-message__thumb" src={a.dataUrl} alt="Вложение пользователя" />
                          </button>
                        ))}
                      {message.attachments
                        .filter((a) => a.kind === "audio")
                        .map((a, idx) => (
                          <audio
                            key={`${message.id}-snd-${idx}`}
                            controls
                            className="chat-message__audio"
                            src={a.dataUrl}
                          />
                        ))}
                    </div>
                  )}
                  {message.text.trim().length > 0 && (
                    <p className="chat-message__text">{message.text}</p>
                  )}
                </>
              )}

              {showReportAction && (
                <div className="chat-message__report-actions">
                  <Button
                    type="button"
                    variant="ghost"
                    className={`chat-message__report-button${isSaved ? " is-saved" : ""}`}
                    disabled={reportStatus === "saving"}
                    aria-pressed={isSaved}
                    title={
                      isSaved
                        ? "Убрать из истории починок"
                        : "Сохранить в историю починок"
                    }
                    onClick={() => onToggleReport?.(message.id)}
                  >
                    {reportStatus === "saving"
                      ? "Сохранение..."
                      : isSaved
                        ? "В истории починок"
                        : "Сохранить отчет"}
                  </Button>
                  {reportStatus === "error" && (
                    <span className="chat-message__report-error" role="alert">
                      Не удалось обновить
                    </span>
                  )}
                </div>
              )}

              <span className="chat-message__time">{message.timestamp}</span>
            </div>
          );
        })}
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
