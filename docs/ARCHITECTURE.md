# Architecture — Indoore Backend API Automation

Last updated: 25 July 2026

This document describes the **layered design**, request/data flow, and shared engines of the Playwright API automation framework for the Indoore MDMS backend.

For setup and commands, see [README.md](../README.md).  
For adding modules, see [MODULE_GUIDE.md](./MODULE_GUIDE.md).  
For pillar status per module, see [HARDENING-STATUS.md](./HARDENING-STATUS.md).  
For PDF follow/gap analysis (`MDM Presentation_23.12.2025.pdf`), see [MDM-PRESENTATION-COVERAGE.md](./MDM-PRESENTATION-COVERAGE.md).

---

## 1. Purpose

Automate **HTTP API** verification for Indoore MDMS:

- Status, content-type, response time, sensitive-data safety
- Zod / contract shape and business validators
- Pagination, filters, hierarchy, aggregations
- Positive / negative / auth / edge / E2E / optional DB compare
- Separate **test defects** from **backend / infra findings**

This is **not** a UI automation framework. Dashboards and charts in the MDM portal are covered by validating the **APIs that feed them**, not by driving the browser UI.

---

## 2. High-level layout

```text
Indoore_backend_testing/
├── playwright.config.ts          # Runner, workers, reporters, grepInvert
├── src/
│   ├── global.setup.ts           # Env validation + auth warmup
│   ├── fixtures/                 # authenticatedApi, api+db
│   ├── core/                     # Engines, auth, DB, helpers
│   ├── observability/            # Optional run logging / query
│   └── modules/<MODULE>/         # Business API modules
├── contract-snapshots/<slug>/    # Frozen API shape snapshots
├── scripts/                      # Module runners, scaffold, CI helpers
└── docs/                         # This documentation set
```

---

## 3. Module layering (canonical pattern)

Every business module under `src/modules/<MODULE>/` follows the same layers:

| Layer | Folder | Responsibility |
|-------|--------|----------------|
| **Api** | `Api/` | HTTP call, timing, typed envelope — **no assertions** |
| **Data** | `Data/` | Paths, payloads, env-backed defaults, poll config |
| **Mapper** | `Mapper/` | Normalize raw JSON → stable mapped types |
| **Validator** | `Validator/` | Business / field rules (`expect`) |
| **schemas** | `schemas/` | Zod contracts (strict where possible) |
| **Db** | `Db/` | Read-only SQL, accessors, API↔DB compare (gated) |
| **tests** | `tests/` | Specs: smoke, negative, contract, mutation, db, e2e |

```text
Spec
  → Api (requestWithAutoRefresh / TimedApiClient)
  → Mapper
  → Validator + Zod (optional)
  → ValidationEngine / AssertionEngine
  → printSummary / finalize / defect triage hooks
```

**Do not** put HTTP calls in validators or business assertions in the Api layer.

---

## 4. Shared core

| Area | Location | Role |
|------|----------|------|
| Auth login / refresh | `src/core/utils/auth.util.ts`, `token-manager.ts`, `authenticated.request.ts` | Session once in global setup; auto-refresh on 401 |
| Validation orchestration | `src/core/engine/validation.engine.ts` | Named checks + pass/fail summary |
| Assertions / sensitive data | `src/core/engine/assertion.engine.ts` | Status, content-type, timing, PII guards |
| API validation helper | `src/core/helpers/api-validation.helper.ts` | Standard checks + finalize |
| Retry | `src/core/engine/retry.engine.ts` | Transient HTTP retries |
| Timeouts | `src/core/constants/api-timeouts.ts` | Module-specific poll / test budgets |
| Backend findings | `src/core/utils/backend-response.util.ts` | Soft-skip / log 5xx, 429 patterns |
| DB pool | `src/core/db/postgres.client.ts` | Read-only `@db` tests |
| Zod helper | `src/core/utils/zod-validation.helper.ts` | Parse helpers for schemas |

---

## 5. Four quality pillars

```text
┌─────────────────────────────────────────────────────────────┐
│  1. Zod schemas          2. Contract snapshots              │
│  3. Mutation-proof       4. Gated DB cross-validation       │
└─────────────────────────────────────────────────────────────┘
```

1. **Zod** — `schemas/*.schemas.ts`; reject wrong shapes at parse time.  
2. **Contract snapshots** — live response vs `contract-snapshots/<slug>/`; tag `@contract-snapshot`.  
3. **Mutation-proof** — intentionally break fixtures; validators/schemas **must fail**; tag `@mutation-proof` (excluded unless `INCLUDE_MUTATION_PROOF=true`).  
4. **DB compare** — read-only SQL vs API; tag `@db`; gate `<MODULE>_DB_SQL_READY=true`.

Scaffold: `node scripts/scaffold-module-hardening.mjs <MODULE_DIR> <slug> <@tag>`

---

## 6. Auth and request flow

```text
global.setup.ts
  → validate BASE_URL + EMAIL/USERNAME + PASSWORD
  → reuse playwright/.auth/token.json if still valid
  → else POST /indore/auth/login → TokenManager.seed

test ({ authenticatedApi })
  → requestWithAutoRefresh(Bearer + CSRF)
  → on 401: refresh / re-login → retry once
```

Secrets never live in git: `.env`, `playwright/.auth/**`.

---

## 7. HES async jobs (special case)

HES command E2E posts a job (`IN_PROGRESS`) and polls `GET /commands/query-meter-job/:jobName`.

- Completion depends on **HES callback** (environment).  
- Default: validate async init + pending query path; log `BACKEND FINDING` if still `RUNNING`.  
- Strict completion: `HES_E2E_REQUIRE_COMPLETION=true`.  
- Helpers: `src/modules/HES-COMMANDS/utils/commands-job-e2e.helper.ts`

---

## 8. Soft-skips and findings

Prefer **logging a backend finding** over silent green:

| Signal | Typical handling |
|--------|------------------|
| HTTP 5xx on known flaky init | Soft-return / validate error envelope |
| HTTP 429 | Soft-skip rate limit |
| HES callback never finishes | Async-pending assertions (or fail if `HES_E2E_REQUIRE_COMPLETION`) |
| DNS / ENOTFOUND mid-poll | Soft-skip transient network |
| DB gate off / no VPN | `@db` skipped |

Soft-skips are **tech debt signals**, not completed coverage.

---

## 9. Runners and CI

| Script | Purpose |
|--------|---------|
| `scripts/run-module-tests.mjs` | Module all / smoke / api / db (`--workers=1`) |
| `scripts/run-contract-tests.mjs` | `@contract-snapshot` |
| `scripts/run-mutation-proof.mjs` | `@mutation-proof` |
| `scripts/detect-changed-modules.mjs` | CI module selection |
| `.github/workflows/` | QA module gate, regression, reusable module jobs |

Default Playwright config excludes `@mutation-proof` unless `INCLUDE_MUTATION_PROOF=true`.

---

## 10. Phase of the framework

**Architecture is complete.** Current phase is **maintenance and expansion**:

- Add APIs for new product features  
- Keep four pillars healthy  
- Reduce flakes; manage soft-skips  
- Update snapshots only on intentional contract change  
- Deepen DB SQL where business value justifies it  

Do **not** redesign the core layers without a clear, documented need.
