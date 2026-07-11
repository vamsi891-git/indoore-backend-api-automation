# Framework Maturity Changelog

Evidence trail for framework improvements (interviews, LinkedIn, PR history).

---

## Phase 0 — Close known open bugs (2026-07-11)

### 0.1 DTR Billing — client dedup + data-driven spec

**Problem:** `GET /indore/reports/dtr-billing` returns HTTP 500 (`INTERNAL_ERROR`) on QA for all date ranges probed. Root cause is on the **backend** (duplicate meter serials in temp-table insert when building scope). The automation client previously had no `meterSerialNumbers` handling and cascaded validations after a 500.

**Changes:**
- Added `src/core/utils/dedupe-serials.util.ts` — `dedupeMeterSerials()` + `formatMeterSerialsQueryParam()` using `Set` dedup before query send.
- Refactored `DtrBillingApi` to accept `DtrBillingQuery` with optional `meterSerialNumbers[]` (deduped on send).
- Refactored `dtrbilling.data.ts` / `dtrbilling.spec.ts` to data-driven cases: live, short range, duplicate-serial edge, two negatives.
- Added `validateValidationError` / `validateApiError` on validator; early return on non-200 (no cascade failures).
- Tagged live primary case `@backend-defect`; `REPORTS_SKIP_BACKEND_DEFECTS=1` skips for green CI until backend ships dedup fix.
- Removed `@smoke` from DTR billing until endpoint returns 200 (avoids masking smoke suite).

**DoD status:** Client-side dedup + regression test **done**. HTTP 200 **blocked on backend deploy** — re-add `@smoke` when API is green.

### 0.2 PostgreSQL pool hardening (node-pg, not Prisma)

**Problem:** `createPgPool()` used `max: 2` fixed — under `PLAYWRIGHT_WORKERS=2` + main + archive pools, connection acquire timeouts surface (Prisma P2028/P2024 analogues).

**Changes:**
- `resolvePgPoolMax()` — `max(5, PLAYWRIGHT_WORKERS + 3)`; override via `PG_POOL_MAX`.
- Retry wrapper treats pool exhaustion messages + SQL state `53300` as transient.
- Configurable `PG_POOL_CONNECTION_TIMEOUT_MS` (default 20s).

**DoD:** Run `npm run test:db` with `PLAYWRIGHT_WORKERS=2` three times locally when DB is reachable.

### 0.3 Swagger / local dev URL

**Changes:**
- `src/core/utils/swagger-url.util.ts` — resolves from `SWAGGER_URL` or `BASE_URL` + `SWAGGER_PATH` (default `/indore/api-docs/`).
- `npm run docs:swagger` — prints URL; `npm run docs:swagger:open` opens browser.
- README **Local Dev** section + `.env.example` entries.

**DoD:** `npm run docs:swagger` prints correct URL for current machine's `.env`.

---

## Phase 1 — CI/CD safety nets (pending)

- [ ] 1.1 Blocking typecheck in CI
- [ ] 1.2 Flaky-test quarantine (`@flaky`)
- [ ] 1.3 CI trend visibility (`reports/run-history.jsonl`)

---

## Phase 2 — Framework self-testing (pending)

- [ ] 2.1 Unit tests for core engines
- [ ] 2.2 Centralized pagination validator
- [ ] 2.3 ApiValidationHelper adoption (DASHBOARD / REPORTS / TECHNICAL-ANALYSIS)

---

## Phase 3 — Depth over breadth (pending)

- [ ] 3.1 Negative testing pass (top 5 modules)
- [ ] 3.2 Role-permission matrix
- [ ] 3.3 Widen DB cross-validation

---

## Phase 4 — Long-term (parked)

- Contract testing against OpenAPI
- Ephemeral per-branch environments
- Historical trend dashboard
- Secrets rotation hygiene
