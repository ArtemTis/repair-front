const ENVELOPE_VERSION = 1 as const;

export type RepairStoredImageAttachment = {
  kind: "image";
  mimeType: string;
  /** raw base64 without data URL prefix */
  base64: string;
};

export type RepairStoredAudioAttachment = {
  kind: "audio";
  format: "wav" | "mp3";
  base64: string;
};

export type RepairStoredAttachment = RepairStoredImageAttachment | RepairStoredAudioAttachment;

/** Сохраняется в колонке `text` сообщения пользователя для чатов с вложениями */
export interface RepairAssistantUserEnvelope {
  repairAssistantChat: typeof ENVELOPE_VERSION;
  text: string;
  attachments?: RepairStoredAttachment[];
}

export function isRepairAssistantEnvelope(parsed: unknown): parsed is RepairAssistantUserEnvelope {
  if (!parsed || typeof parsed !== "object") return false;
  const v = parsed as Record<string, unknown>;
  return v.repairAssistantChat === ENVELOPE_VERSION;
}

export function parseRepairAssistantStoredMessage(rawText: string): {
  envelope: RepairAssistantUserEnvelope | null;
  plainFallback: string;
} {
  const trimmed = rawText.trim();
  if (!trimmed.startsWith("{")) {
    return { envelope: null, plainFallback: rawText };
  }
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (!isRepairAssistantEnvelope(parsed)) {
      return { envelope: null, plainFallback: rawText };
    }
    return { envelope: parsed, plainFallback: parsed.text };
  } catch {
    return { envelope: null, plainFallback: rawText };
  }
}

export function captionForRepairChatTitle(rawText: string): string {
  const { envelope } = parseRepairAssistantStoredMessage(rawText);
  if (!envelope) return rawText;
  const t = envelope.text.trim();
  if (t) return envelope.text;
  const hasImg = envelope.attachments?.some((a) => a.kind === "image");
  const hasAu = envelope.attachments?.some((a) => a.kind === "audio");
  if (hasImg && hasAu) return "Изображение и аудио";
  if (hasImg) return "Изображение";
  if (hasAu) return "Аудио";
  return "Вложение";
}

export function dataUrlFromStored(att: RepairStoredAttachment): string {
  if (att.kind === "image") {
    const mime = att.mimeType || "image/jpeg";
    return `data:${mime};base64,${att.base64}`;
  }
  const mime = att.format === "mp3" ? "audio/mpeg" : "audio/wav";
  return `data:${mime};base64,${att.base64}`;
}

export function serializeRepairUserMessageForPersistence(caption: string, attachments: RepairStoredAttachment[]): string {
  if (attachments.length === 0) {
    return caption;
  }
  const payload: RepairAssistantUserEnvelope = {
    repairAssistantChat: ENVELOPE_VERSION,
    text: caption,
    attachments,
  };
  return JSON.stringify(payload);
}
