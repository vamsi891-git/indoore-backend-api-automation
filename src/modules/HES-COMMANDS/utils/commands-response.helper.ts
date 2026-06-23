import { APIResponse } from "@playwright/test";

/** Parse body text — avoids SyntaxError when gateway returns plain text (e.g. rate limit). */
export async function parseCommandsResponseBody<T>(
  rawResponse: APIResponse,
): Promise<T> {
  const text = await rawResponse.text();
  if (!text.trim()) {
    return null as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `Commands API returned non-JSON (${rawResponse.status()}): ${text.slice(0, 300)}`,
    );
  }
}
