# Indoore Backend API Automation

Playwright + TypeScript suite that proves Indoore MDMS **GET** APIs return a complete, stable payload. One shared login session. **No writes on production.**

Maintained by one QA engineer — prefer copying an existing module over inventing new layers. See [docs/SOLO-QA.md](./docs/SOLO-QA.md).

## Architecture

```mermaid
flowchart TD
  boot[global.setup.ts<br/>loadEnv + login once] --> fixtures
  fixtures[fixtures/api.fixture<br/>authenticatedApi] --> spec
  spec[modules/*/tests/*.spec.ts] --> api
  api[modules/*/Api<br/>TimedApiClient GET] --> assert
  assert[ApiValidationHelper<br/>status · schema · columns] --> data
  data[modules/*/Data<br/>EXPECTED_*_COLUMNS]
  assert -.->|on failure| defect[extras/ai<br/>defect report]
  spec -.->|@db only| db[extras/db]
  spec -.->|@contract-snapshot| snap[extras/contract]
```

| Layer        | Role                                                  |
| ------------ | ----------------------------------------------------- |
| `Api/`       | HTTP GET only — no assertions                         |
| `Data/`      | Paths, tags, `EXPECTED_*_COLUMNS`, `nonEmptyExpected` |
| `Mapper/`    | Raw JSON → stable mapped types                        |
| `Validator/` | Business `expect` checks                              |
| `schemas/`   | Zod shape                                             |
| `tests/`     | Specs call helper + validator                         |

Optional subsystems live under [`src/extras/`](./src/extras/index.ts) (`@db`, `@contract-snapshot`, observability, defect LLM).

## Add an endpoint in 5 steps

1. **Scaffold** (or copy a sibling endpoint in the same module):

   ```bash
   npm run scaffold -- --module DASHBOARD --endpoint my-widget --path /indore/dashboard/my-widget
   ```

2. **Call the live API** (Swagger / Postman) with a real token; paste a sample 200 into notes.
3. **Update `Data/*.data.ts`**: set `EXPECTED_*_COLUMNS` to the **exact** table headers the API returns. If headers change later, update only this list.
4. **Tighten Zod** in `schemas/` and mapping in `Mapper/` against that sample (no hardcoded live totals).
5. **Run**:

   ```bash
   npx playwright test src/modules/DASHBOARD/tests/my-widget.spec.ts --workers=1
   ```

   Smoke cases set `nonEmptyExpected: true`. Regression keeps empty lists valid.

## Tag strategy

| Tag                    | Meaning                                                    | Default module command                                        |
| ---------------------- | ---------------------------------------------------------- | ------------------------------------------------------------- |
| `@smoke`               | Critical path; expects non-empty primary data when flagged | Included                                                      |
| _(none / module tags)_ | Regression GET — **empty list is valid**                   | Included                                                      |
| `@db`                  | Read-only Postgres compare                                 | **Excluded** (`--grep-invert @db`)                            |
| `@contract-snapshot`   | Column/header snapshot drift                               | Separate `test:<slug>:contract`                               |
| `@mutation-proof`      | Zod rejects broken fixtures                                | **Excluded** unless `INCLUDE_MUTATION_PROOF` or explicit grep |

## How to run

```bash
npm install
copy .env.example .env   # set BASE_URL, EMAIL/USERNAME, PASSWORD, TOTP_SECRET
```

| Command                             | What it runs                    |
| ----------------------------------- | ------------------------------- |
| `npm run test:smoke`                | All `@smoke` (workers=1)        |
| `npm run test:dashboard`            | One module, GET only (no `@db`) |
| `npm run test:shard -- --shard=1/4` | Sharded GET suite               |
| `npm run test:dashboard:db`         | `@db` for that module           |
| `npm run test:dashboard:contract`   | Contract snapshots              |
| `npm run typecheck`                 | `tsc --noEmit`                  |

Workers default to **1** (`WORKERS` / `PLAYWRIGHT_WORKERS`). Module scripts force `--workers=1`.

## Deliberately not tested

- **UI / browser flows** — we validate APIs that feed dashboards, not the React UI.
- **Production writes** — POST/PUT/PATCH create meter/DTR/consumer stay in `skippedWriteSpecs`; never set `ALLOW_WRITE_TESTS=true` on prod.
- **Mutation-proof** in the default module command — opt-in only.
- **DB compare** unless `@db` and `DB_*` are configured.
- **Live totals / counts hardcoded in assertions** — Zod shape + columns; totals only when the API returns them for cross-check.
- **Captcha OCR accuracy as a product test** — login helper only; flaky OCR is infra, not a dashboard defect.
- **Third-party HES callback timing SLAs** beyond documented poll windows.

## Decisions & deeper docs

- **[docs/AUTOMATION-PLAN.md](./docs/AUTOMATION-PLAN.md)** — API vs UI strategy (v1.1 — expand these repos, do not rebuild)
- [docs/SOLO-QA.md](./docs/SOLO-QA.md) — day-to-day solo maintainer guide
- [docs/MODULE_GUIDE.md](./docs/MODULE_GUIDE.md) — add an endpoint
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — layered design
- [docs/ASSERTIONS.md](./docs/ASSERTIONS.md) — assertion flow

## CI

GitHub Actions (`.github/workflows/playwright.yml`): nightly + push + manual — **smoke first**, then one job per module. Artifacts: HTML report, Allure, `reports/defects/`.
