# Indoore Backend API Automation

Backend API test automation with [Playwright Test](https://playwright.dev/) and TypeScript. Tests use a shared authenticated API fixture; login runs once in global setup and writes tokens under `playwright/.auth/` (gitignored).

## Prerequisites

- Node.js (LTS recommended)
- npm

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your environment file:

   ```bash
   copy .env.example .env
   ```

   | Variable   | Required | Description |
   |------------|----------|-------------|
   | `BASE_URL` | Yes      | API base URL (used by Playwright config, global setup, and tests). |
   | `EMAIL`    | Yes      | Login email for `POST /indore/auth/login`. |
   | `PASSWORD` | Yes      | Login password for global setup. |

3. Run tests (global setup runs first and creates `playwright/.auth/token.json`):

   ```bash
   npm test
   ```

Do not commit `.env` or anything under `playwright/.auth/`.

## Local Dev

### Swagger / API docs

The Swagger UI URL is derived from your environment — not hardcoded to `localhost`:

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | (required) | API base; Swagger defaults to `{BASE_URL}/indore/api-docs/` |
| `SWAGGER_URL` | — | Full override, e.g. `http://localhost:3000/indore/api-docs/` |
| `SWAGGER_PATH` | `/indore/api-docs/` | Path appended to `BASE_URL` when `SWAGGER_URL` is unset |

```bash
# Print resolved URL (uses .env BASE_URL)
npm run docs:swagger

# Open in default browser (Windows/macOS/Linux)
npm run docs:swagger:open
```

For local backend on port 3000, set in `.env`:

```bash
BASE_URL=http://localhost:3000
# or override explicitly:
SWAGGER_URL=http://localhost:3000/indore/api-docs/
```

## Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests |
| `npm run test:smoke` | Run tests tagged `@smoke` |
| `npm run test:module -- <slug>` | Run **all** tests for one module |
| `npm run test:module -- <slug> --smoke` | Run **@smoke** tests for one module |
| `npm run test:modules:list` | List module slugs (for CI / local runs) |
| `npm run test:ui` | Playwright UI mode |
| `npm run report` | Open the last HTML report |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`) |

### Run one module (full suite)

When a developer finishes a module, run the **entire** test folder for that module:

```bash
npm run test:modules:list
npm run test:module -- energy-audits
npm run test:module -- utils-lookup
npm run test:module -- hes-commands --smoke
```

Slug = folder name lowercased, spaces → hyphens (`ENERGY-AUDITS` → `energy-audits`, `UTILS-LOOKUP` → `utils-lookup`).

### Run by tag or path

```bash
npx playwright test --grep @dashboard
npx playwright test src/modules/REPORTS
```

## Authentication

- **Global setup:** `src/global.setup.ts` (configured in `playwright.config.ts`)
- **Flow:** API login via `POST /indore/auth/login` using `BASE_URL`, `EMAIL`/`USERNAME`, and `PASSWORD` (plus CSRF; optional `DEVICE_ID`)
- **Output:** `playwright/.auth/token.json` (`accessToken`, `expiresAt`, optional `csrfToken`)
- **Tests:** `src/fixtures/api.fixture.ts` provides `authenticatedApi`; request wrappers inject Bearer/CSRF and refresh on 401

## Project layout

```
src/
  core/                 # Shared client, assertion/validation engines, models
  fixtures/             # Playwright test extensions (authenticated API)
  global.setup.ts       # One-time API login before tests
  modules/               # 24 modules — run `npm run test:modules:list` for slugs
    ASSET-MANAGEMENT/
    AUDIT-LOGS/
    AUTH/
    BILLING/
    COMMERICIAL-ANALYSIS/
    CONSUMERS/
    CONSUMPTION/
    DASHBOARD/
    DTRS/
    ENERGY-AUDITS/
    FEEDER/
    HES-COMMANDS/
    MASTER-DATA/
    METER-REPLACEMENT/
    MIS-DASHBOARD/
    MODULES-PERMISSIONS/
    NOTIFICATIONS/
    OVERALL-DASHBOARD/
    REPORTS/
    ROLE-PERMISSIONS/
    TECHNICAL-ANALYSIS/
    USERS-ADMIN/
    USERS-PROFILE-IMAGE/
    UTILS-LOOKUP/
```

Module folder names use hyphens (e.g. `ASSET-MANAGEMENT`, not `ASSET MANAGEMENT`). Older docs or reports may still show the previous spaced names.

Typical module folders:

- `Api/` — HTTP calls, timing, typed responses (no assertions)
- `Mapper/` — Response types and normalization
- `Validator/` — Business rules and field checks
- `Data/` — Query/body payloads (report modules)
- `tests/` — `*.spec.ts` files

## Framework flow

```
Spec (test)
  → API layer
  → Mapper
  → Validator
  → ValidationEngine / AssertionEngine
  → Summary (console)
```

## Naming convention

| Layer     | Example |
|-----------|---------|
| API       | `consumer-search.api.ts` |
| Mapper    | `consumer-search.mapper.ts` |
| Validator | `consumer-search.validator.ts` |
| Test      | `consumer-search.spec.ts` |

## Tags

Tests use Playwright tags on individual cases. Common patterns:

| Tag | Usage |
|-----|--------|
| `@smoke` | Included in `npm run test:smoke` |
| `@dashboard`, `@event-report`, `@consumer-master`, … | Feature-specific filters via `--grep` |

Example:

```bash
npm run test:smoke
npx playwright test --grep "@event-report"
```

## Validation rules

**Validate:**

- Backend behavior and response structure
- Hierarchy, aggregation, and pagination where applicable

**Avoid:**

- Duplicating backend logic unnecessarily
- Hardcoded row counts unless required
- Reimplementing SQL sort/filter in JavaScript
- Frontend-only expectations

## CI (GitHub Actions)

### Promotion flow (module → QA → main)

```text
module-branch ──PR──► QA ──(post-merge)──► module suites
                         │
                         └── green gate ──PR──► main ──push──► full regression
```

1. Create a branch named after the module (example: `dashboard`, `master-data`).
2. Push your changes and open a **pull request into `QA`** (review/approval only — **no module test run on the open PR**).
3. Merge into `QA`.
4. **After merge**, **QA Module Gate** runs on the `QA` push: it diffs the new QA tip against the previous tip, detects affected modules, and runs those suites.
   - Shared/core changes (`src/core`, fixtures, Playwright/package config, workflow scripts) run **all** modules.
   - Docs-only changes skip the API matrix and still pass the gate.
5. If the module gate fails, the code stays on **`QA`** until you fix and merge again (or re-run the workflow). Do **not** promote to `main` yet.
6. When the post-merge gate is green, open a **pull request from `QA` → `main`**. **Main Promotion Policy** requires:
   - source branch is exactly `QA`
   - a successful **QA Module Gate** workflow run exists for that QA tip commit
7. After approval + green policy check, merge into `main`.
8. The push to `main` runs the **full** Playwright suite (`playwright.yml`).

Local detector:

```bash
npm run test:detect-modules
node scripts/detect-changed-modules.mjs --base origin/QA
```

### Workflows

| Workflow | File | When |
|----------|------|------|
| **QA Module Gate** | [qa-module-gate.yml](.github/workflows/qa-module-gate.yml) | **Push** to `QA` (after merge) — detect + run affected modules |
| **Main Promotion Policy** | [main-promotion-policy.yml](.github/workflows/main-promotion-policy.yml) | PR → `main`/`master` — source must be `QA` + green post-merge gate |
| **Playwright API Tests** | [playwright.yml](.github/workflows/playwright.yml) | Push to `main`/`master` (full), manual smoke/full |
| **Playwright Module Tests** | [playwright-module.yml](.github/workflows/playwright-module.yml) | Manual — pick **one module** + all or smoke |
| **Reusable Module Tests** | [reusable-module-tests.yml](.github/workflows/reusable-module-tests.yml) | Called by QA gate and manual module workflow |

### Required GitHub branch protection / rulesets

Configure under **Settings → Rules → Rulesets** (or classic branch protection):

**Ruleset for `QA`**

- Require a pull request before merging
- Require approvals (at least 1)
- Do **not** require **QA Module Gate** on the PR (module tests run **after** merge on push)
- Require branches to be up to date before merging (optional but recommended)
- Block force pushes and deletions
- Restrict direct pushes (no bypass for routine work)

**Ruleset for `main` (and `master` if used)**

- Require a pull request before merging
- Require approvals (at least 1)
- Require status checks to pass: **`Main Promotion Policy`**
- Require branches to be up to date before merging
- Block force pushes and deletions
- Restrict direct pushes
- Do **not** allow merges from feature/module branches; only `QA` → `main` PRs satisfy the policy job

After the first `QA` → `main` PR runs the policy workflow, the status-check name appears in the ruleset dropdown. Use the job name exactly: `Main Promotion Policy`.

### Module workflow (manual / per module)

1. Open **[Actions → Playwright Module Tests](https://github.com/vamsi891-git/indoore-backend-api-automation/actions/workflows/playwright-module.yml)**
2. **Run workflow**
3. **module:** slug, e.g. `energy-audits`, `auth`, `hes-commands` (run `npm run test:modules:list` locally for the full list)
4. **scope:** `all` = every test in that module’s `tests/` folder; `smoke` = `@smoke` only

The **module** job uses **1 worker** (`PLAYWRIGHT_WORKERS=1`). The **main** full-regression workflow uses **2 workers**. Full regression runs on **push to main/master** (after QA promotion), not on pull requests into main. When a run finishes (pass or fail), it generates an **Allure** report and uploads artifacts. If SMTP secrets are configured, the Allure report is emailed to the developer inbox.

Set `PLAYWRIGHT_WORKERS=1` in `.env` if you see token refresh races locally.

### Allure reports (local)

```bash
npm test
npm run report:allure
```

`report:allure` generates `allure-report/` and opens it in the browser. Raw results are stored in `allure-results/` during the test run.

| Script | Purpose |
|--------|---------|
| `npm run allure:generate` | Build HTML from `allure-results/` |
| `npm run allure:open` | Open existing Allure report |
| `npm run report:allure` | Generate + open |

**Module-wise report:** Open the **Suites** or **Behaviors** tab (not Overview). Tests are grouped as:

| Level | Suites tab | Behaviors tab | Example |
|-------|------------|---------------|---------|
| Module | `parentSuite` | `Epic` | `hes-commands` |
| API group | `suite` | `Feature` | `HES Commands — History` |
| Test case | `subSuite` | `Story` | individual test (pass/fail badge) |

Click a module (e.g. **hes-commands**) to expand all specs and tests inside it with passed/failed status. Slugs match `npm run test:modules:list` (`energy-audits`, `hes-commands`, …).

`npm run allure:generate` runs `scripts/patch-allure-module-labels.mjs` so grouping stays correct even when the Playwright reporter writes file paths.

**Note:** Allure CLI requires **Java 17+** locally (`java -version`). GitHub Actions installs Java automatically.

**Do not double-click `index.html`** — browsers show `500 Failed to fetch` when opening Allure via `file://`. Serve it over HTTP instead:

```bash
# After unzip of CI artifact (open the folder that contains index.html + data/)
cd path/to/allure-report
npx allure open .
# or from project root after local generate:
npm run allure:open
```

This starts a local server (e.g. `http://127.0.0.1:xxxx`) and opens the report correctly.

### Repository secrets (required for CI)

CI does **not** use your local `.env` file. You must add secrets on GitHub:

**Repository → Settings → Secrets and variables → Actions → Repository secrets → New repository secret**

| Secret name | Required | Example value |
|-------------|----------|----------------|
| `BASE_URL` | **Yes** | `https://api.bestinfra.app` (no trailing slash) |
| `PASSWORD` | **Yes** | Same as local `.env` |
| `EMAIL` | Yes* | Same as local `.env` |
| `USERNAME` | Yes* | Use instead of `EMAIL` if that is what you use locally |
| `DEVICE_ID` | No | Only if login requires device selection |
| `GMAIL_IMAP_USER` | No | Invite E2E auto-capture in CI |
| `GMAIL_IMAP_APP_PASSWORD` | No | Gmail app password for invite tests |
| `INVITE_INBOX_EMAIL` | No | Invite delivery inbox override |
| `INVITE_ACCEPT_TOKEN` | No | Manual invite token (skips Gmail IMAP when set with E2E vars) |
| `INVITE_E2E_EMAIL` | No | Paired with `INVITE_ACCEPT_TOKEN` for invite read-only specs |
| `INVITE_E2E_INVITATION_ID` | No | Paired with `INVITE_ACCEPT_TOKEN` for invite E2E steps 3–5 |

### Optional secrets (reduce skipped tests)

Master Data onboarding tests skip when hierarchy env vars are unset. The workflow **defaults** these from `.env.example` (no secret required unless your QA values differ):

| Variable | Workflow default |
|----------|------------------|
| `BULK_DTR_ZONE_NAME` | `Hawabangla` |
| `BULK_DTR_SUBSTATION_NAME` | `PragatiNagar` |
| `BULK_DTR_FEEDER_NAME` | `PARMANU NAGAR(CHQ)` |
| `BULK_METER_MANUFACTURER_NAME` | `L&T` |
| `CREATE_DTR_ORGANISATION_LOOKUP_ID` | `30` |
| `CREATE_DTR_SUBSTATION_NETWORK_LOOKUP_ID` | `3` |
| `CREATE_DTR_FEEDER_NETWORK_LOOKUP_ID` | `4` |

Add these **repository secrets** to unlock remaining skipped suites (~20 tests):

| Secret name | Unlocks |
|-------------|---------|
| `DB_HOST`, `DB_USER`, `DB_PASSWORD` | API-vs-DB specs (`@db`) — 11 tests |
| `DB_NAME` | Optional; defaults to `mdms_indore` |
| `VALIDATE_DTR_METER_VALID_SERIAL` | validate-dtr-meter positive case |
| `VALIDATE_DTR_METER_ON_DTR_SERIAL` | DTR meter already mapped negative |
| `VALIDATE_DTR_METER_INACTIVE_SERIAL` | inactive meter negative cases |
| `VALIDATE_DTR_METER_ASSIGNED_SERIAL` | assigned meter negative cases |
| `VALIDATE_ADD_METER_VALID_SERIAL` | validate-add-meter positive case |
| `VALIDATE_ADD_METER_EXISTS_SERIAL` | create-meter duplicate + validate-add-meter negative |

Override any Master Data default by setting the matching secret name (e.g. `BULK_DTR_ZONE_NAME` if your QA zone differs).

### Email report (Allure)

After each workflow run, the **Allure report zip** is sent to:

**`vamsibst@gmail.com`** (configured in `.github/workflows/playwright.yml`)

Add these **SMTP secrets** on GitHub to enable sending:

| Secret name | Required for email | Example |
|-------------|-------------------|---------|
| `SMTP_SERVER` | **Yes** | `smtp.gmail.com` |
| `SMTP_PORT` | **Yes** | `465` |
| `SMTP_USERNAME` | **Yes** | `automation@bestinfra.tech` |
| `SMTP_PASSWORD` | **Yes** | SMTP / app password |
| `REPORT_MAIL_FROM` | No | Defaults to `SMTP_USERNAME` |

If SMTP secrets are missing, the workflow still uploads the `allure-report` artifact from the Actions run page.

**Gmail note:** Gmail SMTP often blocks zip attachments from CI (error `552`). The email includes a **live Allure URL on GitHub Pages** — open that link in the browser (do not double-click downloaded `index.html`).

### One-time: enable GitHub Pages (fixes 404)

The CI job already publishes Allure to the **`gh-pages`** branch (`index.html`, `data/`, `widgets/`).  
A **404** at `https://vamsi891-git.github.io/indoore-backend-api-automation/` means **Pages is not enabled** in repo settings — not a missing report.

1. Open: `https://github.com/vamsi891-git/indoore-backend-api-automation/settings/pages`
2. **Build and deployment** → Source: **Deploy from a branch**
3. Branch: **`gh-pages`** (should appear in the dropdown now)
4. Folder: **`/ (root)`**
5. Click **Save**
6. Wait **2–5 minutes**, then open:

   `https://vamsi891-git.github.io/indoore-backend-api-automation/`

**Also required once:** **Settings** → **Actions** → **General** → **Workflow permissions** → **Read and write permissions** → **Save**

**If `gh-pages` is missing from the dropdown:** run **Actions** → **Playwright API Tests** → **Run workflow**, wait for **Deploy Allure to gh-pages branch** to turn green, then repeat the steps above.

**Private repo:** GitHub Pages on private repos needs **GitHub Pro/Enterprise**. Use a **public** repo or download the **allure-report** artifact instead.

The email **View Allure Report Online** button opens this URL. Do not double-click downloaded `index.html` (shows empty dashboard).

\* At least one of `EMAIL` or `USERNAME` must be set (same as `src/global.setup.ts`).

Secret names are **case-sensitive** — use `BASE_URL`, not `base_url`.

If `BASE_URL` is missing, the workflow fails with: `Missing required environment variable: BASE_URL`.

### Create the GitHub repository

From the project root (first time only):

```bash
git init
git add .
git commit -m "Add Indoore backend API automation and CI workflow"
git branch -M main
git remote add origin https://github.com/YOUR_ORG/indoore_backend_testing.git
git push -u origin main
```

Or create an empty repo on GitHub, then push the local branch as above.

**Note:** Failures with HTTP `500` or `INTERNAL_ERROR` come from the API environment, not from the workflow. Fix the backend or test data; the workflow only runs the same commands as locally.

## Configuration files

| File | Purpose |
|------|---------|
| `playwright.config.ts` | Test runner, retries, HTML + Allure reporters, `globalSetup` |
| `tsconfig.json` | TypeScript compiler options |
| `.env.example` | Environment template (safe to commit) |
| `.gitignore` | Ignored artifacts and secrets |
