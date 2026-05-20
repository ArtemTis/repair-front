import type { IRepairHistory } from "../types";
import {
  joinRepairReportSections,
  splitRepairReportSections,
} from "./repairHistoryReports";

export type ChatReportLink = {
  messageId: string;
  repairHistoryId: number;
};

export function buildRepairChatRefMarker(chatId: number, messageId: string): string {
  return `<!-- repair-chat-ref:chat=${chatId};msg=${messageId} -->`;
}

/** Служебные метки привязки к чату — не показываем в UI */
export const CHAT_REPORT_REF_MARKER_RE =
  /<!-- repair-chat-ref:chat=\d+;msg=[^\s>]+ -->\s*/g;

const CHAT_REF_SINGLE_RE =
  /<!-- repair-chat-ref:chat=(\d+);msg=([^\s>]+) -->/;

export function parseChatRefFromSection(
  sectionText: string
): { chatId: number; messageId: string } | null {
  const match = sectionText.match(CHAT_REF_SINGLE_RE);
  if (!match) return null;
  return { chatId: Number(match[1]), messageId: match[2] };
}

export function stripChatReportRefMarkers(text: string): string {
  return text.replace(CHAT_REPORT_REF_MARKER_RE, "").trim();
}

export function withChatReportRef(
  chatId: number,
  messageId: string,
  markdown: string
): string {
  const marker = buildRepairChatRefMarker(chatId, messageId);
  const body = markdown.trim();
  if (body.startsWith(marker)) return body;
  return `${marker}\n\n${body}`;
}

const chatRefPattern = (chatId: number) =>
  new RegExp(`<!-- repair-chat-ref:chat=${chatId};msg=([^\\s>]+) -->`, "g");

/** Сообщения чата, для которых уже есть сохранённый фрагмент в истории починок */
export function getSavedChatReportLinks(
  records: IRepairHistory[],
  chatId: number
): Map<string, ChatReportLink> {
  const links = new Map<string, ChatReportLink>();

  for (const record of records) {
    const text = [record.result_notes, record.work_performed].filter(Boolean).join("\n");
    const pattern = chatRefPattern(chatId);
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      links.set(match[1], { messageId: match[1], repairHistoryId: record.id });
    }
  }

  return links;
}

export function repairNotesContainChatRef(
  notes: string | null | undefined,
  chatId: number,
  messageId: string
): boolean {
  if (!notes?.trim()) return false;
  return notes.includes(buildRepairChatRefMarker(chatId, messageId));
}

/** Удаляет секцию отчёта, привязанную к сообщению чата. null — записей не осталось */
export function removeChatReportSection(
  notes: string | null | undefined,
  chatId: number,
  messageId: string
): string | null {
  const marker = buildRepairChatRefMarker(chatId, messageId);
  const source = notes?.trim();
  if (!source) return null;

  const parts = splitRepairReportSections(source);
  const kept = parts.filter((part) => !part.includes(marker));

  if (kept.length === 0) return null;
  return joinRepairReportSections(kept);
}
