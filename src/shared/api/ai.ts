import OpenAI from "openai";

const REPAIR_API_BASE = "https://api.aitunnel.ru/v1/";
const REPAIR_MODEL = "gemini-3-flash-preview";

type ErrorBody = {
  message?: string;
  type?: string;
};

function extractMessageContent(raw: unknown): string {
  if (raw === undefined || raw === null) {
    return "";
  }
  if (typeof raw === "string") {
    return raw;
  }
  if (Array.isArray(raw)) {
    return raw
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }
        if (part && typeof part === "object" && "text" in part) {
          const text = (part as { text?: unknown }).text;
          return typeof text === "string" ? text : "";
        }
        return "";
      })
      .join("");
  }
  return "";
}

const SYSTEM_PROMPT = `Ты эксперт в ремонте техники. Помоги пользователю с его проблемой. Ты помогаешь пользователям ремонтировать технику в домашних условиях
Основные правила:
- Ты должен быть вежливым и понятным
- Ты должен быть точным и конкретным
- Если пользователь отклонился от темы ремонта техники, скажи ему, что ты только специалист в ремонте техники и что ты можешь помочь ему с его проблемой
`;

function createRepairOpenAIClient(): OpenAI {
  const apiKey = process.env.REACT_APP_API_REPAIR_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "Не задан REACT_APP_API_REPAIR_KEY. Укажите ключ в .env и перезапустите приложение."
    );
  }

  return new OpenAI({
    apiKey,
    baseURL: REPAIR_API_BASE,
    // Без этого конструктор SDK падает в браузере — сетевой запрос не выполняется.
    dangerouslyAllowBrowser: true,
  });
}

export async function askAIagent(userMessage: string): Promise<string> {
  const client = createRepairOpenAIClient();

  const response = await client.chat.completions.create({
    model: REPAIR_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
  });

  const content = extractMessageContent(response.choices?.[0]?.message?.content);
  const text = content.trim();

  if (!text) {
    const finish = response.choices?.[0]?.finish_reason;
    const errPayload = (response as { error?: ErrorBody | string }).error;
    if (errPayload) {
      const msg =
        typeof errPayload === "string"
          ? errPayload
          : errPayload.message ?? errPayload.type ?? JSON.stringify(errPayload);
      throw new Error(msg || "Модель вернула ошибку без текста.");
    }
    throw new Error(
      finish && finish !== "stop"
        ? `Модель завершила ответ (${finish}), текст пустой.`
        : "Модель вернула пустой ответ."
    );
  }

  return text;
}
