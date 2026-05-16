type ApiErrorShape = {
  message?: string;
  type?: string;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
  error?: ApiErrorShape | string;
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

function formatApiError(error: ChatCompletionResponse["error"]): string {
  if (!error) {
    return "Неизвестная ошибка API";
  }
  if (typeof error === "string") {
    return error;
  }
  return error.message ?? error.type ?? JSON.stringify(error);
}

export async function askDeepSeek(userMessage: string): Promise<string> {
  const apiKey = process.env.REACT_APP_API_DEEPSEEK_KEY ?? "";
  const model =
    process.env.REACT_APP_AI_MODEL ?? "Qwen/Qwen3-Coder-Next:novita";

  const response = await fetch(
    "https://router.huggingface.co/v1/chat/completions",
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: userMessage }],
      }),
    }
  );

  let result: ChatCompletionResponse;
  try {
    result = (await response.json()) as ChatCompletionResponse;
  } catch {
    throw new Error("Не удалось прочитать ответ сервера.");
  }

  if (!response.ok || result.error) {
    throw new Error(formatApiError(result.error));
  }

  const content = extractMessageContent(result.choices?.[0]?.message?.content);
  const text = content.trim();

  if (!text) {
    throw new Error("Модель вернула пустой ответ.");
  }

  return text;
}
