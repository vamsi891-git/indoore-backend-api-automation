# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: modules/HES-COMMANDS/tests/commands-query-meter-job.spec.ts >> HES Commands — Query Meter Job >> Validate GET /commands/query-meter-job/:jobName — known job status
- Location: src/modules/HES-COMMANDS/tests/commands-query-meter-job.spec.ts:18:7

# Error details

```
Error: Cannot map unsuccessful query-meter-job response
```

# Test source

```ts
  1  | export interface QueryMeterJobSummary {
  2  |   requested: number;
  3  |   successful: number;
  4  |   failed: number;
  5  |   inProgress: number;
  6  |   rejected: number;
  7  | }
  8  | 
  9  | export interface QueryMeterJobHesResponse {
  10 |   message?: string;
  11 |   /** HTTP status code (number) or HES operation status (e.g. "SUCCESS"). */
  12 |   status?: number | string;
  13 |   meterId?: string;
  14 |   failureStep?: string;
  15 |   progress?: unknown;
  16 |   response?: unknown[];
  17 |   [key: string]: unknown;
  18 | }
  19 | 
  20 | export interface QueryMeterJobMeterResult {
  21 |   meterId: string;
  22 |   action: string;
  23 |   status: string;
  24 |   hesStatusCode: number;
  25 |   errorMessage?: string | null;
  26 |   message?: string | null;
  27 |   note?: string | null;
  28 |   hesResponse?: QueryMeterJobHesResponse | null;
  29 | }
  30 | 
  31 | export interface QueryMeterJobData {
  32 |   jobName: string;
  33 |   synced: boolean;
  34 |   autoSynced: boolean;
  35 |   hesJobStatus: string | null;
  36 |   hesStatusCode: number;
  37 |   summary: QueryMeterJobSummary;
  38 |   meterResults: QueryMeterJobMeterResult[];
  39 |   message?: string | null;
  40 |   note?: string | null;
  41 | }
  42 | 
  43 | export interface QueryMeterJobResponse {
  44 |   success: boolean;
  45 |   message?: string;
  46 |   data?: QueryMeterJobData;
  47 |   error?: { code?: string; message?: string };
  48 | }
  49 | 
  50 | export interface MappedQueryMeterJobData {
  51 |   message: string;
  52 |   job: QueryMeterJobData;
  53 | }
  54 | 
  55 | export class CommandsQueryMeterJobMapper {
  56 |   static mapResponse(body: QueryMeterJobResponse): MappedQueryMeterJobData {
  57 |     if (!body.success || !body.data) {
> 58 |       throw new Error("Cannot map unsuccessful query-meter-job response");
     |             ^ Error: Cannot map unsuccessful query-meter-job response
  59 |     }
  60 | 
  61 |     const { data } = body;
  62 |     return {
  63 |       message: body.message?.trim() ?? "",
  64 |       job: {
  65 |         jobName: data.jobName.trim(),
  66 |         synced: data.synced,
  67 |         autoSynced: data.autoSynced,
  68 |         hesJobStatus: data.hesJobStatus?.trim() ?? null,
  69 |         hesStatusCode: data.hesStatusCode,
  70 |         summary: {
  71 |           requested: data.summary.requested,
  72 |           successful: data.summary.successful,
  73 |           failed: data.summary.failed,
  74 |           inProgress: data.summary.inProgress,
  75 |           rejected: data.summary.rejected,
  76 |         },
  77 |         meterResults: data.meterResults.map((row) => ({
  78 |           meterId: row.meterId.trim(),
  79 |           action: row.action.trim(),
  80 |           status: row.status.trim(),
  81 |           hesStatusCode: row.hesStatusCode,
  82 |           errorMessage: row.errorMessage?.trim() ?? null,
  83 |           message: row.message?.trim() ?? null,
  84 |           note: row.note?.trim() ?? null,
  85 |           hesResponse: row.hesResponse ?? null,
  86 |         })),
  87 |         message: data.message?.trim() ?? null,
  88 |         note: data.note?.trim() ?? null,
  89 |       },
  90 |     };
  91 |   }
  92 | }
  93 | 
```