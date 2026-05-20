import type { IDevice, IRepairHistory } from "../types";
import { parseChatRefFromSection, stripChatReportRefMarkers } from "./chatReportLink";
import { formatDeviceName } from "./deviceDisplay";

/** Разделитель секций (не совпадает с markdown `---` в ответах ИИ) */
export const REPAIR_REPORT_SECTION_DIVIDER = "\n\n<!-- repair-report-section -->\n\n";

/** Устаревший разделитель — при чтении не режем по каждому `---` в тексте отчёта */
export const REPAIR_REPORT_SECTION_DIVIDER_LEGACY = "\n\n---\n\n";

const REPORT_SECTION_HEADING_RE = /^##\s+Запись\s+от\s+(.+)$/m;

const RU_MONTH_INDEX: Record<string, number> = {
  января: 0,
  февраля: 1,
  марта: 2,
  апреля: 3,
  мая: 4,
  июня: 5,
  июля: 6,
  августа: 7,
  сентября: 8,
  октября: 9,
  ноября: 10,
  декабря: 11,
};

export type RepairReportAppeal = {
  repairHistoryId: number;
  sectionIndex: number;
  chatId?: number;
  messageId?: string;
  date: Date;
  markdown: string;
  record: IRepairHistory;
};

export type RepairHistoryDeviceGroup = {
  /** Нормализованный ключ для сравнения и URL */
  nameKey: string;
  deviceName: string;
  records: IRepairHistory[];
  latestRecord: IRepairHistory;
  /** Число обращений с учётом секций в объединённых отчётах */
  appealCount: number;
  /** Статус и дата последнего обращения (последняя секция по дате) */
  latestAppealStatus: IRepairHistory["status"];
  latestAppealDate: Date;
};

export function normalizeDeviceNameKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function getRepairRecordDeviceName(
  record: IRepairHistory,
  devicesById: Map<number, IDevice>
): string {
  const device = devicesById.get(record.device_id);
  return device ? formatDeviceName(device) : `Техника #${record.device_id}`;
}

export function repairRecordsShareDeviceName(
  record: IRepairHistory,
  targetDeviceName: string,
  devicesById: Map<number, IDevice>
): boolean {
  const recordName = getRepairRecordDeviceName(record, devicesById);
  return (
    normalizeDeviceNameKey(recordName) === normalizeDeviceNameKey(targetDeviceName)
  );
}

export function parseReportSectionHeadingDate(text: string): Date | null {
  const match = text.match(REPORT_SECTION_HEADING_RE);
  if (!match) return null;

  const label = match[1].trim();
  const ruMatch = label.match(
    /(\d{1,2})\s+([а-яё]+)\s+(\d{4})(?:\s*г\.)?(?:,?\s*(\d{1,2}):(\d{2}))?/i
  );
  if (ruMatch) {
    const month = RU_MONTH_INDEX[ruMatch[2].toLowerCase()];
    if (month !== undefined) {
      return new Date(
        Number(ruMatch[3]),
        month,
        Number(ruMatch[1]),
        ruMatch[4] ? Number(ruMatch[4]) : 0,
        ruMatch[5] ? Number(ruMatch[5]) : 0
      );
    }
  }

  const parsed = Date.parse(label.replace(/\s*г\./, ""));
  return Number.isNaN(parsed) ? null : new Date(parsed);
}

export function isRepairReportSectionStart(text: string): boolean {
  const trimmed = text.trimStart();
  return (
    trimmed.startsWith("<!-- repair-chat-ref:") ||
    trimmed.startsWith("## Запись от ")
  );
}

/** Разбивает объединённый отчёт на секции обращений */
export function splitRepairReportSections(notes: string | null | undefined): string[] {
  const source = notes?.trim();
  if (!source) return [];

  if (source.includes(REPAIR_REPORT_SECTION_DIVIDER)) {
    return source
      .split(REPAIR_REPORT_SECTION_DIVIDER)
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
  }

  const legacyChunks = source.split(REPAIR_REPORT_SECTION_DIVIDER_LEGACY);
  if (legacyChunks.length === 1) {
    return legacyChunks.map((part) => part.trim()).filter((part) => part.length > 0);
  }

  const sections: string[] = [];
  let current = legacyChunks[0] ?? "";

  for (let index = 1; index < legacyChunks.length; index += 1) {
    const chunk = legacyChunks[index];
    if (isRepairReportSectionStart(chunk)) {
      const trimmed = current.trim();
      if (trimmed) sections.push(trimmed);
      current = chunk;
    } else {
      current += REPAIR_REPORT_SECTION_DIVIDER_LEGACY + chunk;
    }
  }

  const tail = current.trim();
  if (tail) sections.push(tail);

  return sections;
}

export function joinRepairReportSections(sections: string[]): string {
  return sections
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .join(REPAIR_REPORT_SECTION_DIVIDER);
}

export function parseRepairReportSections(record: IRepairHistory): RepairReportAppeal[] {
  const notes = record.result_notes?.trim();
  const parts = notes
    ? splitRepairReportSections(notes)
    : record.work_performed?.trim()
      ? [record.work_performed.trim()]
      : [];
  const fallbackDate = new Date(record.started_at);

  if (parts.length === 0) {
    return [];
  }

  return parts.map((part, sectionIndex) => {
    const headingDate = parseReportSectionHeadingDate(part);
    const chatRef = parseChatRefFromSection(part);
    const date =
      headingDate ??
      (sectionIndex === 0
        ? fallbackDate
        : new Date(record.updated_at ?? record.started_at));

    return {
      repairHistoryId: record.id,
      sectionIndex,
      chatId: chatRef?.chatId,
      messageId: chatRef?.messageId,
      date,
      markdown: appealSectionDisplayMarkdown(part),
      record,
    };
  });
}

export function flattenRepairAppeals(records: IRepairHistory[]): RepairReportAppeal[] {
  return records
    .flatMap((record) => parseRepairReportSections(record))
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

export function getLatestAppealMeta(records: IRepairHistory[]): {
  status: IRepairHistory["status"];
  date: Date;
  appealCount: number;
} {
  const appeals = flattenRepairAppeals(records);
  if (appeals.length > 0) {
    return {
      status: appeals[0].record.status,
      date: appeals[0].date,
      appealCount: appeals.length,
    };
  }

  const latest = [...records].sort(
    (a, b) => Date.parse(String(b.started_at)) - Date.parse(String(a.started_at))
  )[0];

  return {
    status: latest.status,
    date: new Date(latest.started_at),
    appealCount: 1,
  };
}

export function appealSectionDisplayMarkdown(sectionBody: string): string {
  return stripChatReportRefMarkers(sectionBody)
    .replace(REPORT_SECTION_HEADING_RE, "")
    .trim();
}

export function removeRepairReportSectionAt(
  notes: string | null | undefined,
  sectionIndex: number
): string | null {
  const parts = splitRepairReportSections(notes);
  if (parts.length === 0) return null;
  if (sectionIndex < 0 || sectionIndex >= parts.length) return notes?.trim() ?? null;
  if (parts.length === 1) return null;

  const kept = parts.filter((_, index) => index !== sectionIndex);
  return joinRepairReportSections(kept);
}

export function groupRepairHistoryByDeviceName(
  records: IRepairHistory[],
  devicesById: Map<number, IDevice>
): RepairHistoryDeviceGroup[] {
  const groups = new Map<
    string,
    { deviceName: string; records: IRepairHistory[] }
  >();

  for (const record of records) {
    const deviceName = getRepairRecordDeviceName(record, devicesById);
    const nameKey = normalizeDeviceNameKey(deviceName);
    const bucket = groups.get(nameKey) ?? { deviceName, records: [] };
    bucket.records.push(record);
    groups.set(nameKey, bucket);
  }

  return Array.from(groups.entries())
    .map(([nameKey, { deviceName, records: deviceRecords }]) => {
      const sorted = [...deviceRecords].sort(
        (a, b) => Date.parse(String(b.started_at)) - Date.parse(String(a.started_at))
      );
      const latestMeta = getLatestAppealMeta(sorted);

      return {
        nameKey,
        deviceName,
        records: sorted,
        latestRecord: sorted[0],
        appealCount: latestMeta.appealCount,
        latestAppealStatus: latestMeta.status,
        latestAppealDate: latestMeta.date,
      };
    })
    .sort(
      (a, b) => b.latestAppealDate.getTime() - a.latestAppealDate.getTime()
    );
}

export function filterRepairHistoryByDeviceNameKey(
  records: IRepairHistory[],
  nameKey: string,
  devicesById: Map<number, IDevice>
): IRepairHistory[] {
  const normalizedKey = normalizeDeviceNameKey(nameKey);
  return records
    .filter(
      (record) =>
        normalizeDeviceNameKey(getRepairRecordDeviceName(record, devicesById)) ===
        normalizedKey
    )
    .sort(
      (a, b) => Date.parse(String(b.started_at)) - Date.parse(String(a.started_at))
    );
}

export function groupListPreview(group: RepairHistoryDeviceGroup, maxLen = 140): string {
  const count = group.appealCount;
  const latestIssue = group.latestRecord.issue_description.trim();
  const prefix = count > 1 ? `${count} обращения · ` : "";
  const text = `${prefix}${latestIssue || "Без описания"}`;
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen)}…`;
}

export function formatReportSectionHeading(date: Date | string): string {
  const formatted = new Date(date).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `## Запись от ${formatted}`;
}

export function appendRepairReportSection(
  existingNotes: string | null | undefined,
  sectionMarkdown: string,
  sectionDate: Date | string,
  chatRef?: { chatId: number; messageId: string }
): string {
  const refPrefix = chatRef
    ? `<!-- repair-chat-ref:chat=${chatRef.chatId};msg=${chatRef.messageId} -->\n\n`
    : "";
  const heading = formatReportSectionHeading(sectionDate);
  const section = `${refPrefix}${heading}\n\n${sectionMarkdown.trim()}`;
  const base = existingNotes?.trim();
  if (!base) return section;
  return `${base}${REPAIR_REPORT_SECTION_DIVIDER}${section}`;
}

/** Текст одной записи для отображения в объединённом отчёте (без служебных меток чата) */
export function repairEntryDisplayMarkdown(record: IRepairHistory): string {
  const raw = (record.result_notes ?? record.work_performed ?? "").trim();
  return stripChatReportRefMarkers(raw);
}
