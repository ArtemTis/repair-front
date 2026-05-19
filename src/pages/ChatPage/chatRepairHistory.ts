import {
  parseRepairAssistantStoredMessage,
  type RepairStoredAttachment,
} from "../../shared/chat/repairAssistantEnvelope";
import type { RepairAssistantHistoryTurn, RepairMediaAttachmentForTurn } from "../../shared/api/ai";
import type { ChatMessage } from "./types";

function storedAttachmentsToModelParts(
  list: RepairStoredAttachment[] | undefined
): RepairMediaAttachmentForTurn[] {
  if (!list?.length) return [];
  return list.map((a) => {
    if (a.kind === "image") {
      return { kind: "image", mimeType: a.mimeType, base64: a.base64 };
    }
    return { kind: "audio", format: a.format, base64: a.base64 };
  });
}

/** История для AITUNNEL Responses API: без служебных пузырей ошибок. */
export function chatMessagesToRepairHistory(messages: ChatMessage[]): RepairAssistantHistoryTurn[] {
  const result: RepairAssistantHistoryTurn[] = [];

  for (const msg of messages) {
    if (msg.omitFromAiHistory) continue;

    if (msg.author === "companion") {
      result.push({ role: "assistant", text: msg.text });
      continue;
    }

    const raw = msg.persistedText ?? msg.text;
    const { envelope, plainFallback } = parseRepairAssistantStoredMessage(raw);
    const caption = (envelope?.text ?? plainFallback).trim();
    const attachments = storedAttachmentsToModelParts(envelope?.attachments);

    result.push({
      role: "user",
      caption,
      attachments,
    });
  }

  return result;
}
