import type { RepairStoredAttachment } from "../chat/repairAssistantEnvelope";

const REPAIR_API_RESPONSES_URL = "https://api.aitunnel.ru/v1/responses";
const REPAIR_MODEL = "gemini-3-flash-preview";

const SYSTEM_PROMPT = `Ты эксперт в ремонте техники. Помоги пользователю с его проблемой. Ты помогаешь пользователям ремонтировать технику в домашних условиях
Основные правила:
- Ты должен быть вежливым и понятным
- Ты должен быть точным и конкретным
- Если пользователь отклонился от темы ремонта техники, скажи ему, что ты только специалист в ремонте техники и что ты можешь помочь ему с его проблемой
`;

/** Вложения последнего запроса (последовательность так же уходит и в Responses API как часть content user message) */
export type RepairMediaAttachmentForTurn = Extract<
  RepairStoredAttachment,
  { kind: "image" } | { kind: "audio" }
>;

export interface RepairAssistantHistoryTurnUser {
  role: "user";
  caption: string;
  attachments: RepairMediaAttachmentForTurn[];
}

export interface RepairAssistantHistoryTurnAssistant {
  role: "assistant";
  /** Текст ответа помощника без разметки «ошибки сети» */
  text: string;
}

export type RepairAssistantHistoryTurn = RepairAssistantHistoryTurnUser | RepairAssistantHistoryTurnAssistant;

type ResponsesErrorPayload = {
  error?: { message?: string; type?: string };
};

export function stripBase64DataUrlPayload(dataUrl: string): string {
  const comma = dataUrl.indexOf(",");
  if (comma === -1) {
    throw new Error("Некорректный формат вложения (ожидается data URL или base64).");
  }
  return dataUrl.slice(comma + 1).trim();
}

function apiKeyRepair(): string {
  const apiKey = process.env.REACT_APP_API_REPAIR_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "Не задан REACT_APP_API_REPAIR_KEY. Укажите ключ в .env и перезапустите приложение."
    );
  }
  return apiKey;
}

type ResponseContentPart =
  | { type: "input_text"; text: string }
  | { type: "input_image"; image_url: string }
  | { type: "input_audio"; input_audio: { data: string; format: "wav" | "mp3" } };

/** Соответствует структурированному вводу из документации Responses API (AITUNNEL). */
function buildUserMessageBlocks(caption: string, attachments: RepairMediaAttachmentForTurn[]): unknown {
  const content: ResponseContentPart[] = [];
  const trimmed = caption.trim();
  content.push({
    type: "input_text",
    text:
      trimmed ||
      "Пользователь отправил только вложение(я) без текста. Проанализируй вложение в контексте диагностики и ремонта техники; задай уточняющие вопросы если нужно.",
  });

  const orderedAttachments = [...attachments].sort((a, b) => {
    const rank = { image: 0, audio: 1 } as const;
    return rank[a.kind] - rank[b.kind];
  });

  for (const item of orderedAttachments) {
    if (item.kind === "image") {
      const mime = item.mimeType?.trim() || "image/jpeg";
      content.push({
        type: "input_image",
        image_url: `data:${mime};base64,${item.base64}`,
      });
    } else if (item.kind === "audio") {
      content.push({
        type: "input_audio",
        input_audio: { data: item.base64, format: item.format },
      });
    }
  }

  return {
    type: "message",
    role: "user",
    content,
  };
}

function buildAssistantHistoryMessage(text: string, stableId: string): unknown {
  return {
    type: "message",
    role: "assistant",
    id: stableId,
    status: "completed",
    content: [
      {
        type: "output_text",
        text,
        annotations: [],
      },
    ],
  };
}

/** Собирает поле `input` для многоходового диалога (состояние на стороне клиента — см. AITUNNEL docs). */
function buildResponsesInput(history: RepairAssistantHistoryTurn[]): unknown[] {
  const blocks: unknown[] = [];
  for (let i = 0; i < history.length; i++) {
    const turn = history[i];
    if (turn.role === "user") {
      blocks.push(buildUserMessageBlocks(turn.caption, turn.attachments));
    } else {
      const id = `chat-asst-${i}-${hashShort(turn.text)}`;
      blocks.push(buildAssistantHistoryMessage(turn.text, id));
    }
  }
  return blocks;
}

function hashShort(text: string): string {
  let h = 0;
  const s = text.slice(0, 200);
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

function extractResponsesOutputText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const outputs = (payload as { output?: unknown }).output;
  if (!Array.isArray(outputs)) return "";

  const parts: string[] = [];
  for (const item of outputs) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    if (rec.type === "message" && rec.role === "assistant") {
      const content = rec.content;
      if (!Array.isArray(content)) continue;
      for (const c of content) {
        if (c && typeof c === "object" && (c as { type?: string }).type === "output_text") {
          const t = (c as { text?: unknown }).text;
          if (typeof t === "string" && t) parts.push(t);
        }
      }
    }
  }
  return parts.join("").trim();
}

/**
 * Вызывает AITUNNEL Responses API (/v1/responses) для модели с мультимодальным вводом.
 *
 * Форматы частей см. базовое использование Responses API и поддержку input_image / input_audio:
 * https://docs.aitunnel.ru/api/responses/basic-usage
 * https://docs.aitunnel.ru/features/audio
 */
export async function askAIagent(history: RepairAssistantHistoryTurn[]): Promise<string> {
  if (history.length === 0) {
    throw new Error("Пустая история: нечего отправлять модели.");
  }

  const body = {
    model: REPAIR_MODEL,
    instructions: SYSTEM_PROMPT,
    input: buildResponsesInput(history),
    max_output_tokens: 8192,
  };

  let response: Response;
  try {
    response = await fetch(REPAIR_API_RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKeyRepair()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Не удалось подключиться к API ремонта. Проверьте сеть и попробуйте снова.");
  }

  let raw: unknown = null;
  try {
    raw = await response.json();
  } catch {
    /* оставить null — разберём по status */
  }

  if (!response.ok) {
    const errTxt = typeof raw === "object" && raw !== null
      ? (raw as ResponsesErrorPayload).error?.message ??
        (raw as ResponsesErrorPayload).error?.type
      : null;
    throw new Error(
      errTxt?.trim() || `Ответ сервера: ${response.status} ${response.statusText || ""}`.trim()
    );
  }

  const text = extractResponsesOutputText(raw);

  if (!text) {
    const status =
      typeof raw === "object" && raw !== null && "status" in raw
        ? String((raw as { status?: unknown }).status ?? "")
        : "";
    throw new Error(
      status && status !== "completed"
        ? `Модель вернула пустой ответ (status: ${status}).`
        : "Модель вернула пустой ответ."
    );
  }

  return text;
}
