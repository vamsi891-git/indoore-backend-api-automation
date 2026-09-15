# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: modules/ENERGY-AUDITS/tests/loss-analysis-feeder.spec.ts >> Energy Audit Loss Analysis — Feeder >> Validate BILLING loss analysis
- Location: src/modules/ENERGY-AUDITS/tests/loss-analysis.harness.ts:23:9

# Error details

```
Error: Loss Analysis API failed — status 500: {"success":false,"error":{"code":"INTERNAL_ERROR","message":"An unexpected error occurred"}}
```

# Test source

```ts
  1  | import { APIRequestContext, APIResponse } from "@playwright/test";
  2  | import {
  3  |   LossAnalysisQuery,
  4  |   LossAnalysisResponse,
  5  | } from "../Mapper/loss-analysis.mapper";
  6  | import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
  7  | import { printApiResponse } from "../../../core/utils/response-console.util";
  8  | 
  9  | export interface LossAnalysisApiResult {
  10 |   rawResponse: APIResponse;
  11 |   responseBody: LossAnalysisResponse;
  12 |   responseTime: number;
  13 | }
  14 | 
  15 | const RETRY_STATUSES = new Set([500, 502, 503, 504]);
  16 | const MAX_ATTEMPTS = 3;
  17 | const RETRY_DELAY_MS = 5_000;
  18 | 
  19 | function sleep(ms: number): Promise<void> {
  20 |   return new Promise((resolve) => setTimeout(resolve, ms));
  21 | }
  22 | 
  23 | export class LossAnalysisApi {
  24 |   constructor(private readonly authenticatedApi: APIRequestContext) {}
  25 | 
  26 |   async getLossAnalysis(
  27 |     query: LossAnalysisQuery,
  28 |   ): Promise<LossAnalysisApiResult> {
  29 |     let lastResponse: APIResponse | undefined;
  30 |     let lastBodyText = "";
  31 |     let responseTime = 0;
  32 | 
  33 |     for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
  34 |       const start = Date.now();
  35 |       lastResponse = await getWithAutoRefresh(
  36 |         this.authenticatedApi,
  37 |         "/indore/energy-audit/loss-analysis",
  38 |         { params: query as unknown as Record<string, string | number> },
  39 |       );
  40 |       responseTime = Date.now() - start;
  41 |       lastBodyText = await lastResponse.text();
  42 | 
  43 |       if (!RETRY_STATUSES.has(lastResponse.status()) || attempt === MAX_ATTEMPTS) {
  44 |         break;
  45 |       }
  46 |       await sleep(RETRY_DELAY_MS);
  47 |     }
  48 | 
  49 |     const rawResponse = lastResponse!;
  50 |     if (!rawResponse.ok()) {
  51 |       printApiResponse({
  52 |         apiName: "Energy Audit Loss Analysis",
  53 |         status: rawResponse.status(),
  54 |         body: lastBodyText,
  55 |         requestParams: query,
  56 |       });
> 57 |       throw new Error(
     |             ^ Error: Loss Analysis API failed — status 500: {"success":false,"error":{"code":"INTERNAL_ERROR","message":"An unexpected error occurred"}}
  58 |         `Loss Analysis API failed — status ${rawResponse.status()}: ${lastBodyText}`,
  59 |       );
  60 |     }
  61 | 
  62 |     const responseBody = (
  63 |       lastBodyText
  64 |         ? JSON.parse(lastBodyText)
  65 |         : { success: false }
  66 |     ) as LossAnalysisResponse;
  67 | 
  68 |     return {
  69 |       rawResponse,
  70 |       responseBody,
  71 |       responseTime,
  72 |     };
  73 |   }
  74 | }
  75 | 
```