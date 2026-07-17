# Indoore Backend API Automation — Living Framework Notes

Last reviewed: 17 July 2026

> This is a living document. The framework is still under development, so inventory counts, endpoint coverage, environment values, and known gaps must be refreshed as new APIs and tests are added.

## 1. Framework purpose

This repository automates backend API testing for the Indoore MDMS application.

Primary goals:

- Verify HTTP status, JSON content type, response time, and sensitive-data safety.
- Verify response schemas and mandatory fields.
- Verify pagination, sorting, filters, hierarchy, aggregation, and domain business rules.
- Cover positive, negative, edge, authentication, authorization, security, database, and end-to-end flows.
- Produce Playwright HTML, JSON, Allure, performance, and developer-friendly defect reports.
- Keep tests repeatable in shared environments by dynamically provisioning data where possible.
- Separate test defects from backend defects.

Technology stack:

- Node.js 20 in CI.
- TypeScript with strict mode.
- Playwright Test as runner and HTTP client.
- Zod for runtime response schemas.
- PostgreSQL (`pg`) for optional read-only API-vs-DB checks.
- Allure and Playwright HTML/JSON reporters.
- ExcelJS for generated manual-test workbooks and bulk-upload test files.
- Optional IMAP integration for invitation-email token capture.

Current inventory snapshot from `npm run test:inventory`:

- 24 modules.
- 139 API-layer files.
- 195 spec files.
- 458 detected test cases.
- 138 smoke-tagged cases.
- 124 negative cases.
- 94 auth cases.
- 62 edge cases.
- 41 end-to-end cases.
- 11 API files reported without a matching spec by the filename-based inventory script.

Important: inventory matching is heuristic. A reported “missing spec” may already be exercised through a harness, multi-API flow, differently named spec, or direct fixture call. Verify before declaring a real coverage gap.

## 2. Repository entry points

Important root files:

- `package.json` — commands and dependencies.
- `playwright.config.ts` — global runner configuration and reporters.
- `tsconfig.json` — strict TypeScript configuration.
- `.env.example` — safe environment-variable template.
- `.gitignore` — excludes secrets and generated artifacts.
- `README.md` — setup, common commands, CI, Allure, and repository guidance.
- `src/global.setup.ts` — validates environment and warms/reuses the authenticated session.
- `src/fixtures/` — Playwright fixtures.
- `src/core/` — reusable engines, clients, schemas, auth, DB, reporting, and utilities.
- `src/modules/` — business/API modules.
- `scripts/` — module runner, inventory, report processing, Swagger launcher, DB utilities, and manual workbook generation.
- `.github/workflows/` — full/smoke and module-specific CI workflows.

## 3. Installation and first run

Prerequisites:

1. Install Node.js LTS. CI currently uses Node 20.
2. Install npm.
3. Install Java 17+ if generating Allure locally.
4. Obtain valid API credentials.
5. Obtain VPN/database access only if running `@db` tests.

Setup on Windows:

```powershell
npm install
Copy-Item .env.example .env
```

Set at minimum in `.env`:

```dotenv
BASE_URL=https://api.bestinfra.app
EMAIL=your-login-email
PASSWORD=your-password
```

`USERNAME` can replace `EMAIL`. `DEVICE_ID` is needed when login requires device selection.

Run:

```powershell
npm test
```

The global setup creates or reuses:

```text
playwright/.auth/token.json
```

Never commit `.env`, auth tokens, database credentials, generated reports, or test output.

## 4. Playwright configuration

`playwright.config.ts` currently configures:

- Test root: `src`.
- Global setup: `src/global.setup.ts`.
- Fully parallel mode enabled.
- Worker count from `PLAYWRIGHT_WORKERS`; invalid/missing values resolve to 1.
- Default test timeout from `DEFAULT_TEST_TIMEOUT_MS`.
- One retry globally; individual suites can override retries/timeouts.
- Base URL from `BASE_URL`.
- Reporters:
  - Console list reporter.
  - Playwright HTML report in `playwright-report/`.
  - JSON report in `reports/playwright-results.json`.
  - Allure raw results in `allure-results/`.

For shared authenticated environments, prefer:

```powershell
$env:PLAYWRIGHT_WORKERS = "1"
```

One worker reduces token-refresh races, shared-data collisions, rate limiting, and HES command conflicts.

## 5. End-to-end execution lifecycle

The complete execution path is:

1. Playwright loads `playwright.config.ts`.
2. `src/global.setup.ts` loads `.env`.
3. Required environment variables are validated.
4. Runtime folders are ensured.
5. A stale token-refresh lock is removed.
6. `TokenManager` attempts to reuse a still-valid session from disk.
7. If no valid session exists, `AuthApi.login()` performs login.
8. The access token and CSRF token are seeded and persisted.
9. Playwright discovers specs under `src`.
10. `base.fixture.ts` applies Allure module labels before each test.
11. `api.fixture.ts` creates a Playwright `APIRequestContext`.
12. The context’s GET/POST/PUT/PATCH/DELETE methods are wrapped with auth refresh and CSRF handling.
13. The spec calls a module API class.
14. The API class builds the path/query/body and returns raw response, parsed body, and response time.
15. A mapper normalizes the response where needed.
16. A validator checks schema and business behavior.
17. `ValidationEngine` records every check without stopping at the first failure.
18. The summary is printed.
19. On failure, a Markdown defect report and JSON triage file are generated and attached when `testInfo` is supplied.
20. Playwright and Allure reporters write final artifacts.

Typical flow:

```text
Spec
  -> Fixture
  -> Authenticated request wrapper
  -> Module API class
  -> Mapper
  -> Validator
  -> ValidationEngine
  -> Defect/report output
```

## 6. Authentication and session management

Key files:

- `src/global.setup.ts`
- `src/core/utils/auth.util.ts`
- `src/core/utils/token-manager.ts`
- `src/core/utils/authenticated.request.ts`
- `src/fixtures/api.fixture.ts`
- `src/fixtures/auth.fixture.ts`

Session behavior:

- Tokens are cached under `playwright/.auth/`.
- Token refresh begins before actual expiry using a refresh buffer.
- Workers synchronize token state through the token file.
- A filesystem lock prevents simultaneous refresh attempts.
- Stale refresh locks are removed.
- On HTTP 401, the wrapper reloads or refreshes the token and retries once.
- Mutating requests add the CSRF token in `x-csrf-token` and the CSRF cookie.
- On `CSRF_MISMATCH`, the session is force-refreshed and the request is repeated.
- Login is the fallback if refresh fails.

Critical auth-negative rule:

Do not use `authenticatedApi`, `getWithAutoRefresh`, or module retry helpers when testing missing authentication. Those helpers inject a valid Bearer token and invalidate the negative scenario.

Use `unauthenticatedApi` from `src/fixtures/auth.fixture.ts` and call the raw context:

```ts
const response = await unauthenticatedApi.get(path, { params });
```

For invalid-token tests, use the raw unauthenticated context with an explicit invalid `Authorization` header.

## 7. Request and retry architecture

There are multiple request layers because modules have different latency and stability characteristics.

### Core authenticated wrapper

`src/core/utils/authenticated.request.ts`:

- Supports GET, POST, PUT, PATCH, and DELETE.
- Adds Bearer and CSRF headers.
- Uses the default request timeout.
- Retries 502, 503, and 504 once.
- Recovers from selected network errors.
- Does not retry generic timeout or disposed-context errors.
- Refreshes auth after 401 or CSRF mismatch.

### Generic timed API client

`src/core/base/timed-api.client.ts`:

- Offers typed `getJson`, `postJson`, `putJson`, `patchJson`, and `deleteJson`.
- Returns `rawResponse`, `responseBody`, and `responseTime`.
- Retries 429, 500, 502, 503, and 504 up to four attempts.
- Handles transient HTML and rate-limit bodies.
- Safely reports non-JSON responses.

### Module request helpers

Some modules have dedicated helpers for:

- Higher request timeouts.
- Endpoint-specific retry status codes.
- Exponential backoff.
- Safe JSON parsing.
- Slow aggregation APIs.
- HES asynchronous commands.
- Billing/master-data/report endpoints.

Use the existing helper for that module before creating another request implementation.

Retry guidance:

- Retry infrastructure/transient failures only.
- Do not hide deterministic validation failures.
- Do not retry auth-negative raw requests through auth-injecting helpers.
- Keep total retry duration below the enclosing Playwright test timeout.
- Fail clearly after retries are exhausted.

## 8. Fixture types

### `base.fixture.ts`

- Re-exports Playwright’s base test, request, expect, and API context type.
- Adds Allure labels before each test.

### `api.fixture.ts`

- Provides `authenticatedApi`.
- Creates a baseURL-aware API context.
- Wraps all HTTP verbs with token refresh and CSRF handling.

### `auth.fixture.ts`

- Provides `unauthenticatedApi`.
- Used for login, refresh, missing-auth, malformed-token, and invalid-token contracts.

### `api-db.fixture.ts`

- Extends authenticated API tests with `db` and `archiveDb`.
- Soft-skips DB tests if DB variables are missing.
- Soft-skips when CI cannot reach a configured private DB.
- Closes pools after use.

## 9. Module design pattern

Most modules use:

```text
src/modules/<MODULE>/
  Api/
  Data/
  Mapper/
  Validator/
  schemas/
  utils/
  Db/
  tests/
```

Not every module needs every folder.

### API layer

Responsibilities:

- Accept typed query/body input.
- Build path, query parameters, and request body.
- Call the correct request helper/client.
- Return raw response, parsed body, and response time.

Avoid:

- Assertions.
- Business-rule checks.
- Hidden test branching.
- Hardcoded environment-specific records when runtime discovery is possible.

### Data layer

Responsibilities:

- Positive request data.
- Negative and edge case matrices.
- Expected labels/enums.
- Timeout thresholds.
- Dynamic builders.
- Environment fallback rules.

Prefer builders for mutating flows so every run receives unique identifiers.

### Mapper layer

Responsibilities:

- Define raw and normalized response types.
- Normalize numbers, nulls, strings, dates, and nested rows.
- Isolate response-shape differences.
- Remain tolerant enough to let validators report contract failures cleanly.

Avoid throwing from a mapper before status and error-envelope checks can run.

### Validator layer

Responsibilities:

- Response-envelope checks.
- Mandatory fields and whitelist checks.
- Type/range/enum/date checks.
- Pagination consistency.
- Sorting and duplicate detection.
- Aggregation and business rules.
- Request/response echo.
- Identity preservation in CRUD flows.
- Error contract checks.

### Spec layer

Responsibilities:

- Arrange data and prerequisites.
- Call API classes.
- Run standard and domain checks.
- Add defect context.
- Finalize validation.
- Use tags.
- Clean up/deactivate created records when an API supports it.

## 10. Standard test structure

Recommended structure:

```ts
test("descriptive API behavior", { tag: ["@smoke", "@module"] }, async ({
  authenticatedApi,
}, testInfo) => {
  const api = new FeatureApi(authenticatedApi);
  const { rawResponse, responseBody, responseTime } =
    await api.getFeature(query);

  const assert = new AssertionEngine();
  const validation = new ValidationEngine();
  const validator = new FeatureValidator();

  const defectContext = {
    module: "MODULE",
    endpoint: rawResponse.url(),
    requestParams: query,
    responseStatus: rawResponse.status(),
    responseBody,
    expectedBehavior: "Precise backend contract.",
  };

  try {
    ApiValidationHelper.runStandardChecks(validation, assert, {
      apiName: "Feature API",
      rawResponse,
      responseBody,
      responseTime,
      expectedStatus: 200,
      maxResponseTimeMs: 120_000,
    });

    if (rawResponse.status() !== 200) return;

    validation.execute("Response contract", () =>
      validator.validateResponse(responseBody),
    );
  } finally {
    ApiValidationHelper.finalize(validation, {
      apiName: "Feature API",
      responseTime,
      testInfo,
      defectContext,
    });
  }
});
```

Why the `finally` matters:

- The checklist is printed even if mapping or business validation fails.
- Defect reports are consistently produced.
- A single failed validation does not hide the remaining checks.

## 11. Assertion and validation engines

### `AssertionEngine`

Provides reusable technical checks:

- Exact status.
- Content type.
- Maximum response time.
- Non-empty arrays.
- Required fields.
- Sensitive credential/token leakage.
- Final validation-result assertion.

### `ValidationEngine`

Behavior:

- `execute(name, fn)` catches and records pass/fail.
- The test continues through all checks.
- `printSummary`/`finalize` prints the checklist.
- Any recorded failure ultimately throws and fails the test.
- Failure triggers heuristic defect triage.
- `finalizeAsync` can include optional LLM enrichment.

Do not call `validation.printSummary()` before all intended checks have been added.

## 12. Schema validation

Zod schemas are used where strict runtime shape validation adds value.

Typical schema checks:

- Success literal.
- Required message/data.
- Positive integer identifiers.
- Non-empty strings.
- Boolean status flags.
- Pagination.
- Nested row arrays.

Use `.passthrough()` when additional backend fields are allowed. Use strict field whitelists only when the API contract explicitly forbids extra fields.

Schema validation complements business validation; it does not replace it.

## 13. Test categories

### Positive

- Valid inputs return the expected status and data.
- Business rules and request echo are correct.

### Smoke

- Small, high-value path proving the service is available and core behavior works.
- Run on pull requests and quick checks.

### Negative

- Missing required parameters.
- Invalid enums, ranges, identifiers, dates, pagination, or body fields.
- Unknown/out-of-scope records.
- Duplicate records.
- Invalid methods when relevant.

Rule: if invalid data is accepted, the test should fail. Do not rewrite the test to accept 200/201 unless the verified API contract intentionally defaults or permits the value.

### Auth/security

- Missing token.
- Invalid/malformed/expired token.
- Role/scope restrictions.
- Method restrictions.
- Sensitive-data leakage.

### Edge

- Page boundaries.
- `limit=1`.
- Empty datasets.
- Optional/default parameters.
- Zero/null behavior.
- Date boundaries.
- Alternate report types.

### E2E/lifecycle

- Create prerequisites dynamically.
- Reuse returned IDs.
- Validate identity and persistence across calls.
- Deactivate/clean up at the end.

Example now present in Master Data:

```text
Create meter
  -> capture meterLookupTblRefId
  -> update meter
  -> validate update response and identity
  -> DELETE/deactivate
  -> repeat DELETE to verify idempotency
```

### DB comparison

- Read-only SQL only.
- API and DB fields/counts are normalized and compared.
- DB tests use `@db`.
- Tests skip when DB access is unavailable.

## 14. Data management principles

Preferred order:

1. Dynamically create/provision the required entity.
2. Discover a suitable entity through an API.
3. Resolve a stable value from environment variables.
4. Hardcode only when the contract requires a known fixture and document why.

Why dynamic data is preferred:

- Shared test environments mutate.
- Fixed serial numbers become assigned/inactive.
- Repeated create calls collide.
- CI and local environments may have different IDs.

For related IDs, use the ID the endpoint actually expects. Example:

- Meter update/deactivate path uses `meterLookupTblRefId`, not `meterTblRefId`.

## 15. Database validation

Key files:

- `src/core/db/postgres.client.ts`
- `src/core/db/db-compare.engine.ts`
- Module `Db/` folders and `*.db.spec.ts`.

Safety:

- Only `SELECT` and `WITH` queries are allowed.
- INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, CREATE, GRANT, and REVOKE are blocked.
- Queries retry selected transient connection/pool errors.
- Pool size considers worker count and can be overridden with `PG_POOL_MAX`.

Commands:

```powershell
npm run db:ping
npm run db:list
npm run test:db
npm run test:master-data:db
npm run test:billing:db
npm run test:asset-management:db
```

## 16. Performance tracking

`PerformanceTracker` records:

- DNS time.
- Connection time.
- Estimated server processing.
- Estimated download time.
- Total response time.

Output is appended under:

```text
reports/performance/
```

Important limitation: these values include estimates and an additional network capture. Treat them as test diagnostics, not authoritative production APM measurements.

## 17. Failure and defect workflow

On validation failure:

1. `ValidationEngine` retains all failed checks.
2. The response and request context can be printed.
3. `DeveloperReportEngine` writes a Markdown report.
4. Heuristic triage writes a `.triage.json` file.
5. Severity, classification, likely owner, confidence, and suggested steps are included.
6. Reports can be attached to Playwright/Allure when `testInfo` is provided.
7. Optional LLM enrichment is available through `finalizeAsync`.

Generated location:

```text
reports/defects/
```

Always pass rich defect context:

- Module.
- HTTP method.
- Endpoint.
- Request parameters/body.
- Response status.
- Response body.
- Exact expected backend behavior.

## 18. Reporting

### Console

Each test prints a checklist such as:

```text
[PASS] API Name — 12/12 checks, 1045ms
  1. Status — PASS
  2. Content Type — PASS
```

Set `API_TEST_VERBOSE_SUMMARY=true` for a larger banner.

### Playwright HTML

```powershell
npm run report
```

### Allure

```powershell
npm run allure:generate
npm run allure:open
```

Java 17+ is required. Do not open Allure’s `index.html` directly through `file://`; serve it with the Allure command.

Allure labels are automatically derived from module path, describe block, spec, and test title.

### JSON

Machine-readable Playwright results:

```text
reports/playwright-results.json
```

## 19. Commands cheat sheet

Install and validate:

```powershell
npm install
npm run typecheck
npm run test:unit
```

Run suites:

```powershell
npm test
npm run test:smoke
npm run test:modules:list
npm run test:module -- master-data
npm run test:module -- master-data --smoke
npx playwright test src/modules/MASTER-DATA/tests --workers=1
npx playwright test --grep "@negative"
npx playwright test --grep "@auth"
npx playwright test --grep "@e2e" --workers=1
```

Run one file/test:

```powershell
npx playwright test src/modules/MASTER-DATA/tests/meter-crud-lifecycle.spec.ts --workers=1
npx playwright test -g "Create meter, update and validate"
```

Debug:

```powershell
npm run test:ui
npx playwright test --debug
npx playwright test --list
```

Reports and inventory:

```powershell
npm run report
npm run report:allure
npm run report:defects
npm run test:inventory
```

Swagger:

```powershell
npm run docs:swagger
npm run docs:swagger:open
```

## 20. Tagging conventions

Common tags:

- `@smoke`
- `@positive`
- `@negative`
- `@edge`
- `@auth`
- `@security`
- `@e2e`
- `@db`
- `@backend-defect`
- Module tag, for example `@master-data`.
- Feature tag, for example `@update-meter`.

Tag each test by:

1. Scope/category.
2. Module.
3. Feature.
4. Special behavior when relevant.

Avoid creating multiple spellings for the same tag.

## 21. Module inventory

Available module slugs:

- `asset-management`
- `audit-logs`
- `auth`
- `billing`
- `commericial-analysis`
- `consumers`
- `consumption`
- `dashboard`
- `dtrs`
- `energy-audits`
- `feeder`
- `hes-commands`
- `master-data`
- `meter-replacement`
- `mis-dashboard`
- `modules-permissions`
- `notifications`
- `overall-dashboard`
- `reports`
- `role-permissions`
- `technical-analysis`
- `users-admin`
- `users-profile-image`
- `utils-lookup`

Module intent:

- ASSET-MANAGEMENT — organization/network hierarchy and asset scope.
- AUDIT-LOGS — audit listing and export behavior.
- AUTH — login, refresh, session, devices, invitations, acceptance, and security.
- BILLING — billing APIs and optional database validation.
- COMMERICIAL-ANALYSIS — commercial summary, PF, MD, LF, consumption comparison, and consumption patterns.
- CONSUMERS — consumer profile, communication, power quality, consumption graphs, billing history, and event logs.
- CONSUMPTION — daily/hourly/monthly/yearly reports, comparisons, patterns, and net-meter data.
- DASHBOARD — dashboard metrics and DTR status/unbalance/consumption widgets.
- DTRS — DTR profile, statistics, capacity, feeders, events, power triangle, and threshold charts.
- ENERGY-AUDITS — network trends, loss analysis, hourly loss, and DTR/feeder variants.
- FEEDER — alerts, daily consumption, electrical parameters, and profile.
- HES-COMMANDS — command initiation, history, jobs, meter operations, billing/payment/configuration, and polling.
- MASTER-DATA — master lists, meter/DTR/consumer creation and validation, bulk uploads, CRUD lifecycle, communication, hierarchy, and DB checks.
- METER-REPLACEMENT — validation, consumer search/detail, submission lifecycle, history/detail/progress, dashboard, and bulk validation.
- MIS-DASHBOARD — communication and event-priority/data dashboards.
- MODULES-PERMISSIONS — module permission listing and authorization behavior.
- NOTIFICATIONS — web/mobile notifications.
- OVERALL-DASHBOARD — overall and DTR communication widgets.
- REPORTS — billing, event, and report grids.
- ROLE-PERMISSIONS — role permission listing and authorization behavior.
- TECHNICAL-ANALYSIS — technical report variants.
- USERS-ADMIN — user listing, security, devices, and advanced behavior.
- USERS-PROFILE-IMAGE — profile-image lifecycle and negatives.
- UTILS-LOOKUP — reusable dropdown/search/lookups used by other modules.

Naming issue to retain for compatibility:

- `COMMERICIAL-ANALYSIS` is misspelled in the repository and module slug. Renaming it requires coordinated path/import/script/report migration.

Completeness classification (evidence-based, not only inventory filenames):

- Structurally complete / strong suites: AUDIT-LOGS, BILLING, COMMERICIAL-ANALYSIS, CONSUMERS, DASHBOARD, DTRS, ENERGY-AUDITS (harness-driven), FEEDER, HES-COMMANDS, MIS-DASHBOARD, MODULES-PERMISSIONS, NOTIFICATIONS, OVERALL-DASHBOARD, REPORTS, ROLE-PERMISSIONS, TECHNICAL-ANALYSIS, USERS-ADMIN, USERS-PROFILE-IMAGE, UTILS-LOOKUP (harness-driven), ASSET-MANAGEMENT.
- Operationally partial (env/fixture-dependent or incomplete paths): AUTH (invite IMAP/token gated), CONSUMPTION (some `@backend-defect`/500 skips), MASTER-DATA (env/provisioning/DB gated), METER-REPLACEMENT (stub method + env fixtures).
- No module is wholly missing.

Inventory undercount note:

- ENERGY-AUDITS and UTILS-LOOKUP register many tests through harnesses; the inventory regex undercounts them.

## 22. Current coverage gaps

The inventory script currently flags these API files as lacking a filename-matched spec:

- ASSET-MANAGEMENT: `DtrId.api.ts` — likely false gap (`dtrId.spec.ts` exists; casing/name mismatch).
- AUTH: `auth-session.api.ts`, `auth.api.ts`, `invite.api.ts` — covered by flow-named invite/login/session specs.
- CONSUMPTION: `consumption-report.api.ts`, `patternconsumption.api.ts` — covered by feature/shared report specs and negative/edge suites.
- ENERGY-AUDITS: `hourly-loss-report.api.ts`, `loss-analysis.api.ts` — covered by DTR/feeder harness specs.
- MASTER-DATA: `substation-master.api.ts` — covered by typo-named `substation.-master.spec.ts`.
- METER-REPLACEMENT: `create-submission.api.ts` — covered indirectly by create-submission E2E/negative specs.
- UTILS-LOOKUP: `networksearch.api.ts` — covered by `networksearch.api.spec.ts`.

Confirmed real incompleteness:

- `METER-REPLACEMENT/Api/consumer-detail.api.ts` still has a public `detailConsumer()` stub that throws `Method not implemented.` while another implemented method performs the live request.

Other completion work:

- Re-run inventory after each new feature.
- Restore a clean `npm run typecheck` baseline. The 17 July 2026 check currently reports:
  - possible-undefined `profile` access and a missing `occupancyStatus` type in `MASTER-DATA/Validator/create-consumer.validator.ts`;
  - a `string | number` path argument mismatch in `METER-REPLACEMENT/Api/submission-detail.api.ts`;
  - a `ConsumerDetail` mapper/type mismatch in `METER-REPLACEMENT/Mapper/consumer-detail.mapper.ts`.
- Remove or finish the meter-replacement `detailConsumer()` stub.
- Standardize older specs onto `ApiValidationHelper` + rich `defectContext`.
- Normalize stacked retry/timing semantics across module helpers (some report total wall-clock, some final attempt only).
- Treat `PerformanceTracker` as diagnostic only; it uses a separate HEAD probe and estimated download time.
- Sync `.env.example` with code-referenced variables still missing from the template (for example meter-replacement fixtures and invite retry knobs).
- Hygiene: previously tracked `reports/defects/*.md` remain tracked even though the folder is ignored; probe files under `reports/` may need ignore rules.
- Ensure every negative case contains a meaningful error-envelope assertion.
- Ensure every auth endpoint has missing/invalid-token coverage.
- Add response schemas where complex contracts are currently validated only manually.
- Keep endpoint documentation synchronized with Swagger.
- Reduce hardcoded IDs by runtime discovery/provisioning.
- Verify backend-defect tags are intentional and documented.
- Keep README module count, setup path casing, and CI worker notes synchronized with reality.

Documentation drift already identified:

- README previously said 22 modules; filesystem discovery finds 24 (`METER-REPLACEMENT`, `USERS-PROFILE-IMAGE` were missing from the list).
- README referenced `Global.Setup.ts`; actual file is `src/global.setup.ts`.
- README previously implied module CI uses 2 workers; module workflow uses 1.
- README auth token field names (`token`/`refreshToken`/`jwtToken`) do not match current `TokenManager` disk shape (`accessToken`/`expiresAt`/`csrfToken`).

## 23. CI/CD

### Main workflow

`.github/workflows/playwright.yml`:

- Push to main/master: full suite.
- Pull request: smoke suite.
- Manual dispatch: smoke or full.
- Node 20 and Java 17.
- Installs with `npm ci`.
- Runs TypeScript checking but currently allows typecheck failure to continue (`continue-on-error: true`).
- Generates Playwright and Allure reports even after test failure.
- Uploads artifacts for 14 days.
- Deploys Allure to `gh-pages`.
- Optionally sends an email report link through SMTP.
- Uses concurrency cancellation for obsolete runs.
- Main workflow workers: 2.

Risk: because typecheck uses `continue-on-error: true`, CI can proceed with TypeScript problems. Treat CI green as test green, not type-clean, until typecheck is made blocking.

### Module workflow

`.github/workflows/playwright-module.yml`:

- Manual module slug and all/smoke scope.
- Runs **one** worker (`PLAYWRIGHT_WORKERS=1`).
- Lists modules before execution.
- Uploads module-specific reports and defects.
- Deploys Allure and optionally emails the result.
- Note: deploying every module run to the same `gh-pages` branch overwrites the previously published Allure site.

## 24. Environment-variable groups

Do not copy secrets into notes. Record names and purpose only.

Core:

- `BASE_URL`
- `EMAIL` or `USERNAME`
- `PASSWORD`
- `DEVICE_ID`
- `PLAYWRIGHT_WORKERS`

DB:

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL`
- `DB_ARCHIVE_NAME`
- `PG_POOL_MAX`
- `PG_POOL_CONNECTION_TIMEOUT_MS`

Reporting/debug:

- `API_TEST_VERBOSE_SUMMARY`
- `API_TEST_PRINT_RESPONSE`
- `DEFECT_LLM_ENABLED`
- `DEFECT_LLM_API_KEY` or `OPENAI_API_KEY`
- `DEFECT_LLM_BASE_URL`, `DEFECT_LLM_MODEL`, `DEFECT_LLM_TIMEOUT_MS`

Invite email:

- `GMAIL_IMAP_USER`
- `GMAIL_IMAP_APP_PASSWORD`
- `GMAIL_IMAP_HOST`
- `INVITE_INBOX_EMAIL`
- `INVITE_ACCEPT_TOKEN`
- `INVITE_E2E_*`

Module-specific:

- HES/commands credentials and meter IDs.
- Consumer IVRS/account anchors.
- Energy-audit network IDs and dates.
- Master-data hierarchy names/IDs and test serials.
- Asset scope IDs and scoped-role credentials.

Use `.env.example` as the authoritative variable catalog.

## 25. Coding conventions

Naming:

- API: `feature.api.ts`
- Data: `feature.data.ts`
- Mapper: `feature.mapper.ts`
- Validator: `feature.validator.ts`
- Spec: `feature.spec.ts`
- DB spec: `feature.db.spec.ts`
- Harness: `feature.harness.ts`

General:

- Use strict TypeScript types; avoid `any` when practical.
- Use relative API paths with the configured base URL.
- Encode dynamic path segments.
- Trim strings when comparing backend values.
- Convert numeric strings only in mapper/normalization code.
- Keep response parsing safe for empty/non-JSON bodies.
- Do not throw immediately for every non-200 in API classes; allow tests to validate status/error envelopes.
- Use `finally` around finalization for rich failure output.
- Use unique test data for create flows.
- Use returned identifiers instead of guessed IDs.
- Keep DB access read-only.
- Never print tokens, passwords, cookies, or database credentials.

## 26. How to add a new API

1. Confirm method, path, query/body, status codes, auth, and examples in Swagger.
2. Probe uncertain behavior safely against disposable data.
3. Add typed Data/Mapper/API/Validator files.
4. Reuse the module request helper or `TimedApiClient`.
5. Add a smoke success test.
6. Add negative parameter/body tests.
7. Add missing-auth and invalid-token tests.
8. Add edge and pagination/default behavior.
9. Add E2E lifecycle coverage if the endpoint mutates data.
10. Add Zod schema for a complex/stable response.
11. Pass rich defect context.
12. Run the new spec with one worker.
13. Run the full module.
14. Run typecheck.
15. Regenerate inventory.
16. Update this document if architecture, environment, commands, or gaps changed.

## 27. How to diagnose failures

Status 401:

- Check token expiry/session cache.
- Confirm credentials and device selection.
- Confirm the test did not accidentally use the unauthenticated fixture.

Status 403:

- Check role/scope.
- Check CSRF mismatch behavior for mutating calls.
- Confirm the endpoint is allowed for the account.

Status 400/422:

- Inspect error code/details.
- Compare query/body field names and enum values with Swagger.
- Verify path ID type (`lookup` ID versus table ID).

Status 429:

- Use one worker.
- Avoid duplicate login and aggressive retries.
- Space mutating tests.

Status 500:

- Reproduce once with the same input.
- Determine whether it is deterministic or transient.
- Do not automatically classify every 500 as a test bug.
- Preserve response body and defect context.

Timeout:

- Confirm request timeout is below test timeout.
- Check backend query latency.
- Avoid multiplying API retries by Playwright retries into an excessive duration.
- Use module-specific slow timeouts only where justified.

Mapper exception:

- Check status before mapping success data.
- Make row-array mapping null-safe.
- Let the validator report the actual contract failure.

DB skip:

- Check DB variables, VPN/firewall, database casing, and pool settings.

Allure blank/500:

- Generate first.
- Open through `allure open`, not `file://`.

## 28. Definition of done for an API

An API is considered covered when applicable items are complete:

- Success contract.
- Status/content type/response time/security.
- Required fields and schema.
- Business rules.
- Pagination/sorting/filtering.
- Empty-data behavior.
- Negative inputs.
- Missing and invalid authentication.
- Role/scope behavior.
- Edge boundaries/defaults.
- Duplicate/idempotency behavior.
- E2E persistence/cleanup.
- Optional DB comparison.
- Defect context.
- Stable execution with one worker.
- Full module run.
- Typecheck.
- Inventory/docs update.

## 29. Maintenance routine

After each API:

```powershell
npx playwright test path/to/new.spec.ts --workers=1
npm run test:module -- module-slug
npm run typecheck
npm run test:inventory
```

Before a pull request:

```powershell
npm run test:smoke
npm run typecheck
git status --short
```

Before release/full validation:

```powershell
npm test
npm run allure:generate
```

Review skipped, flaky, retried, and backend-defect cases—not only final pass count.

## 30. Living-document update checklist

Update this file whenever:

- A module is added/renamed.
- A new core helper or fixture is introduced.
- Authentication flow changes.
- CI behavior changes.
- A new environment-variable group is added.
- Report locations change.
- Test counts materially change.
- Known coverage gaps are closed.
- New permanent backend limitations are discovered.

Regenerate counts with:

```powershell
npm run test:inventory
```

The framework is not “finished” because the backend contract and module inventory continue to evolve. Completion should be tracked per endpoint and per module using the definition of done above.
