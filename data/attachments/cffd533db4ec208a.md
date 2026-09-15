# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: modules/REVENUE-PROTECTION/tests/aberration-entry-by-ivrs.edge.spec.ts >> Revenue Protection — Aberration Entry By IVRS Edge >> IND-REV-ABE-IVRS-EDGE-001 — IVRS with surrounding whitespace is trimmed
- Location: src/modules/REVENUE-PROTECTION/tests/aberration-entry-by-ivrs.edge.spec.ts:21:7

# Error details

```
Error: No IVRS available for aberration-entry PATCH tests. Set RP_ABERRATION_ENTRY_IVRS.
```

# Test source

```ts
  1  | import type { APIRequestContext } from "@playwright/test";
  2  | import { AberrationEntryApi } from "../Api/aberration-entry.api";
  3  | import { resolveAberrationEntryKnownIvrs } from "../Data/aberration-entry-by-ivrs.data";
  4  | import { AberrationEntryMapper } from "../Mapper/aberration-entry.mapper";
  5  | 
  6  | /**
  7  |  * Resolve an editable IVRS for PATCH tests: env override, else first
  8  |  * non-empty IVRS from zone aberration-entry list.
  9  |  */
  10 | export async function resolveAberrationEntryIvrsForUpdate(
  11 |   authenticatedApi: APIRequestContext,
  12 | ): Promise<string> {
  13 |   const fromEnv = resolveAberrationEntryKnownIvrs();
  14 |   if (fromEnv) return fromEnv;
  15 | 
  16 |   const api = new AberrationEntryApi(authenticatedApi);
  17 |   const { responseBody } = await api.getAberrationEntry({
  18 |     entryType: "zone",
  19 |     page: 1,
  20 |     limit: 10,
  21 |   });
  22 |   const mapped = AberrationEntryMapper.mapData(responseBody.data);
  23 |   const ivrs = mapped.rows.map((r) => r.ivrsNo.trim()).find((v) => v.length > 0);
  24 |   if (!ivrs) {
> 25 |     throw new Error(
     |           ^ Error: No IVRS available for aberration-entry PATCH tests. Set RP_ABERRATION_ENTRY_IVRS.
  26 |       "No IVRS available for aberration-entry PATCH tests. Set RP_ABERRATION_ENTRY_IVRS.",
  27 |     );
  28 |   }
  29 |   return ivrs;
  30 | }
  31 | 
```