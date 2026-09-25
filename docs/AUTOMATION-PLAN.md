# MDMS Test Automation Plan

**Web (UI) vs API — current frameworks (not a greenfield rewrite)**  
Indore MDMS (AMR / AMI / HES / MDM) smart-metering platform

|             |                                                 |
| ----------- | ----------------------------------------------- |
| Prepared by | Vamsi — QA Automation Engineer / SDET           |
| Document    | Version 1.1                                     |
| Replaces    | Draft v1.0 “built from scratch” folder redesign |

This file is the strategy. Day-to-day commands: [SOLO-QA.md](./SOLO-QA.md), [MODULE_GUIDE.md](./MODULE_GUIDE.md), [../README.md](../README.md).  
UI rules and module shape: sibling repo `INDOORE/ui-automation` — [CLAUDE.md](../../INDOORE/ui-automation/CLAUDE.md), [docs/MDMS_UI_VS_API_TESTING.md](../../INDOORE/ui-automation/docs/MDMS_UI_VS_API_TESTING.md).

---

## 1. Objective

Two **existing**, independently maintainable Playwright + TypeScript repos that a solo engineer can run today:

| Repo | Path                                         | Proves                                                                      |
| ---- | -------------------------------------------- | --------------------------------------------------------------------------- |
| API  | `AUTOMATION TESTING/Indoore_backend_testing` | Business rules, schema/contract, negatives, optional read-only DB           |
| UI   | `AUTOMATION TESTING/INDOORE/ui-automation`   | What the page **shows** equals the JSON **that same page already received** |

They share conventions, not code, and not a second HTTP client from the UI suite.

**Do not** create a third `api-automation/` tree or flatten UI into top-level `clients/` / `pages/` / `locators/`. Coverage grows by **copying a sibling module**, not by scaffolding empty layers.

---

## 2. Scope

### 2.1 In scope

- Expand API GET coverage on the current module layout (`src/modules/<MODULE>/`)
- Expand UI modules with the same **flat** files as `CONSUMER-DASHBOARD`
- Cross-check: UI capture vs displayed value
- Master data: Consumer, Meter, DTR, Feeder, Substation (and meter communication when the live page is confirmed)
- Commercial: PF / LF / MD, consumption compare / pattern (exclude commercial day-night stub)
- Revenue Protection, Command Center, bulk upload / replacement — **API first**; UI only after the contract is stable

### 2.2 Out of scope (until functional coverage is boring)

- Load / performance
- Automating every drill-down click path (manual / later phase)
- Production writes (POST/PUT create meter/DTR/consumer stay skipped unless an isolated env + `ALLOW_WRITE_TESTS`)
- n8n / Trello / extra AI publishers as part of the default suite

---

## 3. Strategy

Pyramid: **API is the wide base**. UI is a **thin** top. Manual covers layout, full click-through, and exploratory work.

| Layer | Owns                                                                                 | Does not do                                    |
| ----- | ------------------------------------------------------------------------------------ | ---------------------------------------------- |
| API   | Business rules, computed totals, Zod/contract, DB state, edge / auth                 | Rendering, layout, click paths                 |
| UI    | Displayed value vs **captured** SPA response; tables, filters, cards, chart tooltips | A second API client; Postgres; re-deriving SQL |

**Cross-validation:** start listening, then navigate or click, use **that** xhr/fetch body. Never a second GET “to verify.” Never hardcode live totals.

**Target mix**

- API: functional + contract + negative + optional `@db`
- UI: count/value, table vs page of API rows, filter singles + pairwise (not full cartesian), cards, graph tooltips
- Manual: remaining drill-downs and visual review

---

## 4. Architecture (as built)

### 4.1 API — `Indoore_backend_testing`

**Flow:** Spec → Api (HTTP only) → Mapper → Validator + Zod → `ApiValidationHelper` / ValidationEngine  
On fail: defect markdown + triage under `reports/defects/` (optional LLM).  
Optional: `@db`, `@contract-snapshot`, `@mutation-proof` (off in the default module command).

```text
src/modules/<MODULE>/
  Api/          HTTP GET (or gated writes) — no assertions
  Data/         paths, EXPECTED_*_COLUMNS, tags, nonEmptyExpected
  Mapper/       raw JSON → stable types
  Validator/    business expects
  schemas/      Zod
  Db/           read-only SQL, only if @db + DB_* env
  tests/        smoke, negative, contract, mutation, db — not one giant file
src/core/       auth, token, TimedApiClient, engines — do not add module rules here
src/extras/     db, contract, AI triage, observability, one-off scripts
src/fixtures/   authenticatedApi
```

**Add an endpoint:** scaffold or copy a sibling → live 200 sample → columns + Zod → run that spec with `--workers=1`.

Workers stay **1**. Empty lists are valid unless `@smoke` + `nonEmptyExpected`.

### 4.2 UI — `INDOORE/ui-automation`

**Flow:** capture (listen first) → Mapper → page read → Validator → spec

```text
src/modules/<MODULE_NAME>/
  locators.ts     one named constant per element (hand-written from DOM)
  api.ts          one capture function per real call (full URL + distinguishing query)
  page.ts         one method per user action — no raw selectors
  mapper.ts       captured JSON → comparable numbers / rows
  validators.ts   UI ↔ mapped API
  test-data.ts    filter options, search strings — no live totals
  tests/          checklist specs
src/shared/       env, TOTP login, generic count parse — no module knowledge
```

Auth: worker fixture + live TOTP. **No** captcha path for the 2FA account. **No** `.auth/user.json` / `storageState` unless a future env forces it.

**Do not add:** global `screens.ts` registry that tests import, selector builders, widget lookup maps, `components/` inside modules.

Screen id / path / API fragment live **in that module** (`locators.ts` + `api.ts`). Traceability for humans: [UI MCP testing file](../../INDOORE/ui-automation/docs/MDMS_UI_VS_API_TESTING.md) + `npm run test:inventory` on the API repo.

### 4.3 Rules for both

- Static locators / explicit captures only
- No credentials or environment URLs in specs
- Known product defects: assert **correct** behaviour, Defect ID in the title (may fail until the product is fixed)
- UI download icons: file starts and URL does not navigate
- Commercial day-night: **no UI/API asserts** (backend stub, `totalCount` 0)
- Typecheck after locator/api/validator edits: `npx tsc --noEmit`

---

## 5. Environment

| Item    | Approach                                                                                                    |
| ------- | ----------------------------------------------------------------------------------------------------------- |
| Config  | `.env` from `.env.example` — never commit secrets                                                           |
| API     | `BASE_URL`, `EMAIL` / `USERNAME`, `PASSWORD`, `TOTP_SECRET`                                                 |
| UI      | `UI_BASE_URL`, `API_BASE_URL`, `TEST_EMAIL`, `TEST_PASSWORD`, `TEST_TOTP_SECRET`, `TEST_MONTH`, `TEST_YEAR` |
| DB      | Read-only Postgres when `DB_*` set; no isolated test DB assumed yet                                         |
| CI      | API smoke first, then per-module API jobs. UI suite after API smoke is green (Phase 3)                      |
| Reports | Playwright HTML; API also Allure + `reports/defects/`                                                       |

---

## 6. Entry and exit

**Before UI for a screen**

- API contract / smoke for that endpoint is green (or the gap is explicit)
- Live DOM and live network URL confirmed (MCP or headed once)
- Capture matcher written from the **observed** URL + query param

**Exit for a module**

- API: smoke + contract (and negatives that matter) passing locally / CI
- UI: count cross-check + filter coverage (single + pairwise + a few empty/risky) for that screen
- Sev-1 / Sev-2: fixed or deferred with a Defect ID in the failing test title

---

## 7. Coverage plan

| Type                           | Layer  | Status                                                          |
| ------------------------------ | ------ | --------------------------------------------------------------- |
| Functional GET packs           | API    | In progress — ~25 modules; add by copy                          |
| Contract / Zod / snapshots     | API    | Present; opt-in snapshot refresh                                |
| Negative / auth / edge         | API    | Present where tagged                                            |
| DB cross-check                 | API    | Gated `@db`; depth varies by module                             |
| Bulk upload / replacement      | API    | Specs exist; writes skipped on prod                             |
| Count / KPI / donut vs capture | UI     | `CONSUMER-DASHBOARD` live; next = master-data lists, commercial |
| Table vs captured page         | UI     | Pattern in shared count + list specs; expand per module         |
| Filters (not full cartesian)   | UI     | Next wave on list screens                                       |
| Cards / graph tooltips         | UI     | Consumer Overview donuts; ApexCharts hover                      |
| Full click-through             | Manual | Until a drill-down is stable and high value                     |

---

## 8. Traceability

Not a runtime registry.

| Source                                                 | Use                                                |
| ------------------------------------------------------ | -------------------------------------------------- |
| `npm run test:inventory` → `reports/test-inventory.md` | API: module ↔ spec counts (heuristic; verify gaps) |
| `docs/API-COVERAGE.md`                                 | Human API checklist                                |
| `ui-automation/docs/MDMS_UI_VS_API_TESTING.md`         | Screen ↔ uiPath ↔ apiFragment ↔ countSource        |
| Test titles `IND-*` / `DEF-*`                          | Case id and known defect                           |

Refresh inventory when a module is added. Do not maintain a second matrix by hand.

---

## 9. CI and tooling

- Playwright + TypeScript, Node 16 module resolution on UI
- Zod on API
- API GHA: smoke, then modules; artifacts HTML / Allure / defects
- UI: run `npm run test:dashboard` (then later full `npm test`) after API smoke
- Default GET path must not require n8n, OpenAI, or Trello

---

## 10. Risks

| Risk                       | Mitigation                                                      |
| -------------------------- | --------------------------------------------------------------- |
| Solo owner                 | Copy sibling; no new core engines; three docs you actually open |
| No isolated DB             | `@db` optional; never write on prod                             |
| UI selectors churn         | Static locators, one module folder, confirm from live DOM       |
| “New framework” temptation | This document — expand tests, do not rename layers              |
| Bus factor                 | README 5-step add + SOLO-QA; extras stay fenced                 |

---

## 11. Rollout (from today)

**Phase 1 — done (do not re-scaffold)**

- Both repos exist, login works (API session + UI TOTP)
- API: many modules on GET + contract
- UI: Consumer Overview count / donut / list / download / math

**Phase 2 — next**

- UI: Master Data lists (consumer, meter, DTR, feeder, substation) — same flat module shape
- UI: Commercial overview + PF/LF/MD/compare (skip day-night)
- API: fill real “API without spec” gaps only; keep writes skipped on prod

**Phase 3**

- GitHub Actions: API smoke gates UI job
- Keep inventory + the UI testing MD updated; no generated registry in test code

---

## 12. What we will not do

- Rebuild folder trees from the v1.0 slide (`config/`, `clients/`, `mappers/` at repo root)
- Import a shared `screens.ts` from every spec
- Merge retry helpers into one profile without a measured flake reason
- Rename `COMMERICIAL-ANALYSIS` except as its own quiet commit
- Put one-off scans (network-id sweeps) in `test:smoke` / `test:unit`

If a change does not make **adding the next GET** faster or **debugging a red spec** clearer, do not merge it.
