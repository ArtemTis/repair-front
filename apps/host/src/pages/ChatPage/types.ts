export type MessageAuthor = "me" | "companion";

/** Ссылка для превью (data URL изображение / аудио) */
export interface ChatBubbleAttachmentRef {
  kind: "image" | "audio";
  dataUrl: string;
}

export interface ChatMessage {
  id: string;
  /** Подпись пользователя или полный текст ответа помощника */
  text: string;
  author: MessageAuthor;
  timestamp: string;
  /**
   * Исходная строка для API / БД (`text` сообщения пользователя может быть JSON-конвертом с медиа).
   * Если не задано — сохраняем `text`.
   */
  persistedText?: string;
  attachments?: ChatBubbleAttachmentRef[];
  /** Сообщения-ошибки в UI не передаём в модель повторно */
  omitFromAiHistory?: boolean;
}
