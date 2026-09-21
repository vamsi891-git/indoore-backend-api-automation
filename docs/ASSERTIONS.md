# Assertions

Specs talk only to `ApiValidationHelper` (`src/core/helpers/api-validation.helper.ts`). `AssertionEngine` and `ValidationEngine` are internal.

## Canonical flow

```
GET → TimedApiClient
   → const checks = new ApiValidationHelper()
   → checks.runStandardChecks({ apiName, rawResponse, responseBody, responseTime })
   → checks.execute("Schema" | "Columns" | …, () => moduleValidator.…)
   → checks.finalize("API name", responseTime)
     // or checks.finalize({ apiName, responseTime, testInfo, defectContext })
```

`runStandardChecks` records failures without stopping. `finalize` prints the checklist and fails the test if any check failed.

## Checks `runStandardChecks` always runs

| Check          | What it proves                                                   |
| -------------- | ---------------------------------------------------------------- |
| Status         | HTTP status equals `expectedStatus` (default 200)                |
| Content Type   | `Content-Type` contains `application/json`                       |
| Response Time  | Duration is under `maxResponseTimeMs` (default request timeout)  |
| Sensitive Data | Body has no Bearer tokens, JWTs, or password/secret field values |

It also logs 5xx findings and optionally prints the body when `API_TEST_PRINT_RESPONSE` is set.

## Module checks (via `execute`)

After the four HTTP checks, the module validator typically adds:

- **Zod / response contract** — envelope and field types (`.strict()` where used)
- **Columns** — list/table headers match `EXPECTED_*_COLUMNS` in `Data/*.data.ts`
- **Uniqueness** — row/id uniqueness where the screen shows a table
- **Totals** — counts/sums the API itself returns (do not hardcode live totals)

Negative tests skip `runStandardChecks` when the live API does not return JSON 200. Use `checks.execute("Status", () => checks.validateStatusCode(raw, 401, body))` then `finalize`.

### Empty vs non-empty (Phase 5)

- **Regression** (`nonEmptyExpected: false` or unset): empty lists/tables stay valid.
- **Smoke** (`@smoke` + `nonEmptyExpected: true`): after schema/columns, call
  `checks.execute("Non-empty", () => checks.assertNonEmpty(rows, "primary table"))`
  for the primary list/table of that screen. Helper: `src/core/utils/assert-non-empty.util.ts`.
- Prefer relative/live date windows in `Data/*.data.ts` over hardcoded calendar days that go stale.

## How to add a new check

1. Prefer a method on the module `Validator`.
2. In the spec: `checks.execute("Short name", () => validator.yourCheck(data))`.
3. Keep it before `finalize`. Do not call Playwright `expect` outside `execute` if you want it on the checklist.

Do not import `AssertionEngine` or `ValidationEngine` from a spec or harness.
