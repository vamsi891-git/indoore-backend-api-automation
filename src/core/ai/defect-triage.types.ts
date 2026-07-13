import { z } from "zod";

export interface DefectReportContext {
  endpoint: string;
  method?: string;
  requestParams?: unknown;
  responseStatus?: number;
  responseBody?: unknown;
  /** What the backend contract / repository logic expects */
  expectedBehavior?: string;
  module?: string;
}

export const DefectTriageSchema = z.object({
  title: z.string().min(1).max(200),
  severity: z.enum(["critical", "high", "medium", "low"]),
  classification: z.enum([
    "backend_crash",
    "auth_permission",
    "contract_mismatch",
    "validation_rejected",
    "not_found",
    "performance",
    "flaky_infra",
    "test_issue",
    "unknown",
  ]),
  likelyOwner: z.enum(["backend", "qa", "devops", "unknown"]),
  confidence: z.number().min(0).max(1),
  summary: z.string().min(1).max(800),
  nextSteps: z.array(z.string().min(1)).min(1).max(8),
  tags: z.array(z.string()).max(12).optional().default([]),
});

export type DefectTriage = z.infer<typeof DefectTriageSchema>;

export type DefectTriageSource = "heuristic" | "llm" | "heuristic+llm";

export interface DefectTriageResult {
  triage: DefectTriage;
  source: DefectTriageSource;
  model?: string;
  error?: string;
}
