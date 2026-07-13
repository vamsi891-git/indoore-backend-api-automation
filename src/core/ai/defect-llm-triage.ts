import { DefectTriageSchema, type DefectTriageResult } from "./defect-triage.types";
import type { HeuristicTriageInput } from "./defect-heuristic-triage";
import { buildHeuristicTriage } from "./defect-heuristic-triage";

function envFlag(name: string): boolean {
  const value = process.env[name]?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

export function isDefectLlmEnabled(): boolean {
  if (!envFlag("DEFECT_LLM_ENABLED")) {
    return false;
  }
  return Boolean(
    process.env.DEFECT_LLM_API_KEY?.trim() ||
      process.env.OPENAI_API_KEY?.trim(),
  );
}

function truncate(value: unknown, max = 3500): string {
  const text = JSON.stringify(value, null, 2);
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, max)}\n... (truncated)`;
}

function buildPrompt(input: HeuristicTriageInput): string {
  const failed = input.results.filter((r) => r.status === "FAIL");
  return `You are a senior API QA triage assistant for an Indore MDMS backend automation suite.

Return ONLY valid JSON matching this shape:
{
  "title": "short ticket title",
  "severity": "critical|high|medium|low",
  "classification": "backend_crash|auth_permission|contract_mismatch|validation_rejected|not_found|performance|flaky_infra|test_issue|unknown",
  "likelyOwner": "backend|qa|devops|unknown",
  "confidence": 0.0-1.0,
  "summary": "2-4 sentences",
  "nextSteps": ["step1", "step2"],
  "tags": ["tag1"]
}

Rules:
- Prefer backend_crash for HTTP 5xx / INTERNAL_ERROR.
- Prefer test_issue only when evidence clearly shows wrong expectedStatus or bad fixtures.
- Keep nextSteps concrete and actionable (max 6).
- Do not invent stack traces or log lines you were not given.

Context:
API: ${input.apiName}
Test: ${input.testTitle ?? "—"}
Module: ${input.context.module ?? "—"}
Method/Endpoint: ${input.context.method ?? "GET"} ${input.context.endpoint}
HTTP status: ${input.context.responseStatus ?? "—"}
Expected behavior: ${input.context.expectedBehavior ?? "—"}

Failed checks:
${failed.map((f, i) => `${i + 1}. ${f.name}: ${f.message ?? ""}`).join("\n")}

Request params:
${truncate(input.context.requestParams ?? {})}

Response body:
${truncate(input.context.responseBody ?? {})}
`;
}

/**
 * Optional OpenAI-compatible chat completion enrichment.
 * Falls back to heuristic on any error / disabled config.
 */
export async function enrichDefectTriage(
  input: HeuristicTriageInput,
): Promise<DefectTriageResult> {
  const heuristic = buildHeuristicTriage(input);

  if (!isDefectLlmEnabled()) {
    return heuristic;
  }

  const apiKey =
    process.env.DEFECT_LLM_API_KEY?.trim() ||
    process.env.OPENAI_API_KEY?.trim() ||
    "";
  const baseUrl = (
    process.env.DEFECT_LLM_BASE_URL?.trim() || "https://api.openai.com/v1"
  ).replace(/\/$/, "");
  const model = process.env.DEFECT_LLM_MODEL?.trim() || "gpt-4o-mini";
  const timeoutMs = Number(process.env.DEFECT_LLM_TIMEOUT_MS ?? 20_000);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You triage Playwright API automation failures into structured JSON for backend developers.",
          },
          { role: "user", content: buildPrompt(input) },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return {
        ...heuristic,
        source: "heuristic",
        error: `LLM HTTP ${response.status}: ${detail.slice(0, 300)}`,
      };
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      return {
        ...heuristic,
        source: "heuristic",
        error: "LLM returned empty content",
      };
    }

    const parsedJson = JSON.parse(content) as unknown;
    const parsed = DefectTriageSchema.safeParse(parsedJson);
    if (!parsed.success) {
      return {
        ...heuristic,
        source: "heuristic",
        error: `LLM JSON schema mismatch: ${parsed.error.message}`,
      };
    }

    return {
      triage: parsed.data,
      source: "heuristic+llm",
      model,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ...heuristic,
      source: "heuristic",
      error: message,
    };
  }
}
