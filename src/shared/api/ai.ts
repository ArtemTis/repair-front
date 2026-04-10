export interface AiRequestPayload {
  prompt: string;
  context?: string;
}

export interface AiResponse {
  answer: string;
}

/**
 * Shared API client for AI assistant requests.
 * Should be used from features/entities, not directly from pages.
 */
export const requestAiAssistant = async (
  payload: AiRequestPayload
): Promise<AiResponse> => {
  const response = await fetch("/api/ai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`AI request failed with status ${response.status}`);
  }

  return (await response.json()) as AiResponse;
};
