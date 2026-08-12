"use client";

import { toast } from "sonner";

export const APP_AI_UNAVAILABLE_MESSAGE =
  "AI is temporarily unavailable. Please contact the app creator to continue using it.";;

const APP_AI_UNAVAILABLE_TOAST_ID = "app-ai-unavailable";

type AppAIErrorBody = {
  code?: unknown;
  detail?: { code?: unknown };
};

export class AppAIClientUnavailableError extends Error {
  readonly code = "app_ai_unavailable";

  constructor() {
    super(APP_AI_UNAVAILABLE_MESSAGE);
    this.name = "AppAIClientUnavailableError";
  }
}

/**
 * Browser wrapper for App-owned API routes that invoke App AI server-side.
 * It owns only the common 402 toast; all other responses remain untouched so
 * the feature component can keep its domain-specific error handling.
 */
export async function appAIRequest(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(input, init);
  if (response.status !== 402) return response;

  let body: AppAIErrorBody | null = null;
  try {
    body = (await response.clone().json()) as AppAIErrorBody;
  } catch {
    return response;
  }
  const code = body?.detail?.code ?? body?.code;
  if (code !== "app_ai_unavailable") return response;

  toast.error(APP_AI_UNAVAILABLE_MESSAGE, { id: APP_AI_UNAVAILABLE_TOAST_ID });
  throw new AppAIClientUnavailableError();
}
