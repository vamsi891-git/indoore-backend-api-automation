# Maintainability Audit — Phase 1 (Read-Only)

**Repository:** indoore-backend-api-automation  
**Generated:** 2026-06-22  
**Scope:** Full `src/` tree, CI workflows, tooling config  
**Phase:** 1 — audit only; no code changes applied

---

## Executive summary

The framework is functional and actively used (22 modules, ~113 API files, ~129 specs, ~203 test cases per inventory). The highest-impact maintainability issues are:

1. **Core-layer boundary violation** — module-specific validator logic lives in `src/core/engine/validation.engine.ts`.
2. **Duplicated request-retry helpers** — five module-specific helpers reimplement retry semantics on top of `authenticated.request.ts` with **inconsistent** retry counts, delays, and status codes.
3. **No shared Mapper/Validator contracts** — 115 validator and 109 mapper files use informal, overlapping method names with no shared interface.
4. **Tooling gap** — ESLint and Prettier are installed but unconfigured; CI typecheck is non-blocking despite existing TS errors.
5. **Naming drift** — folder typo (`COMMERICIAL-ANALYSIS`), mixed file casing, duplicate class names across modules, and inconsistent import paths.

---

## Baseline verification (pre-audit)

Commands run before this audit:

| Command | Result | Notes |
|---------|--------|-------|
| `npm run typecheck` | **FAIL** (exit 2) | 5 TypeScript errors (see below) |
| `npm run test:smoke` | **Incomplete** | Started 152 `@smoke` tests; observed failures on `daywisebilling.spec.ts` (Meter Validation); run did not finish cleanly within audit window (COMMERICIAL-ANALYSIS tests extremely slow / hung) |

### Pre-existing typecheck errors

```
src/modules/MIS-DASHBOARD/tests/eventpriority.spec.ts(23,51): TS2345 — APIResponse | undefined
src/modules/MIS-DASHBOARD/tests/eventpriority.spec.ts(25,56): TS2345 — APIResponse | undefined
src/modules/MIS-DASHBOARD/tests/eventpriority2.spec.ts(29,59): TS2345 — APIResponse | undefined
src/modules/MIS-DASHBOARD/tests/eventpriority2.spec.ts(32,61): TS2345 — APIResponse | undefined
src/modules/OVERALL-DASHBOARD/tests/dashboardmetrics.spec.ts(34,51): TS2345 — DashboardData vs Record<string, unknown>
```

**Implication for Phase 2:** Do not flip `continue-on-error: true` off on the typecheck CI step until these five errors are fixed.

---

## 1. Core-layer boundary violations

**Rule:** `src/core/**` must not import from `src/modules/**`.

### Offenders

| File | Line(s) | Import |
|------|---------|--------|
| `src/core/engine/validation.engine.ts` | 2 | `../../modules/MIS-DASHBOARD/Data/event-classification.data` |
| `src/core/engine/validation.engine.ts` | 3 | `../../modules/MIS-DASHBOARD/Mapper/event-classification.mapper` |

### Additional concern (same file)

`EventClassificationValidator` is **defined inside core** at lines 194–239 of `validation.engine.ts`. This is module-specific business logic (MIS event classification report rules) embedded in the core engine.

**Note:** A separate, correct copy already exists at:
- `src/modules/MIS-DASHBOARD/Validator/event-classification.validator.ts`

There is also a **different** `EventClassificationValidator` for UTILS-LOOKUP (lookup table API, not MIS report):
- `src/modules/UTILS-LOOKUP/Validator/eventclassification.validator.ts`

The core copy appears to be a **stale duplicate** of the MIS-DASHBOARD validator with older `backendRules` shape (`phase-wise` / `category-wise` array vs current `reportTypes` / `expectedCategories` in MIS data).

**Phase 3 target:** Remove imports and delete `EventClassificationValidator` from core; consolidate MIS usage on module validator only.

### Clean scan result

No other files under `src/core/**` import from `src/modules/**` (grep confirmed single file).

---

## 2. Duplicated retry / request-helper logic

### Core reference implementations

| File | Role | Retry semantics |
|------|------|-----------------|
| `src/core/engine/retry.engine.ts` | Generic retry loop | Configurable `retries`, `delayMs`, `shouldRetry` callback |
| `src/core/utils/authenticated.request.ts` | Auth + CSRF + token refresh | **1 retry**, **2000 ms** delay, statuses **502/503/504 only** (explicitly excludes 500) |

### Module-specific helpers (5 files)

| Module | File | HTTP method | Max attempts | Delay | Retry statuses | Also retries network errors? | Response time metric |
|--------|------|-------------|--------------|-------|----------------|------------------------------|----------------------|
| BILLING | `utils/billing-request.helper.ts` | GET | **5** | **5000 ms** | 500, 502, 503, 504 | No | Last attempt only |
| CONSUMPTION | `utils/consumption-request.helper.ts` | GET | **2** | **5000 ms** | 500, 502, 503, 504 | Yes (ECONNRESET, etc.) | Last attempt only |
| CONSUMERS | `utils/consumer-request.helper.ts` | GET | **5** | **8000 ms** | 500, 502, 503, 504 | Yes | **Total elapsed** (all attempts) |
| HES-COMMANDS | `utils/commands-request.helper.ts` | POST | **3** | **3000 ms** | 500, 502, 503, 504 | Yes | Last attempt only |
| COMMERICIAL-ANALYSIS | `utils/commercial-request.helper.ts` | GET | **5** (summary: **10**) | **5000 ms** (summary: **10000 ms**) | 500, 502, 503, 504 | No | Last attempt only |

### Inconsistencies flagged for Phase 4 (decision required before consolidating)

| Dimension | Values across helpers | Risk |
|-----------|----------------------|------|
| Max attempts | 2, 3, 5, 10 | Different flakiness tolerance per module |
| Retry delay | 3000, 5000, 8000, 10000 ms | Total wait time varies widely |
| Status **500** | Retried by all module helpers; **not** retried by `authenticated.request.ts` | Double-layer: module retries 500, core does not |
| Response time | Consumer uses wall-clock total; others use last attempt | Performance assertions not comparable |
| Network errors | Consumption/Consumers/HES retry; Billing/Commercial do not | Inconsistent transport failure handling |

**Phase 4 recommendation:** Build `src/core/utils/request-with-retry.ts` on `RetryEngine`, parameterized by module timeout + retry profile. **Do not pick unified retry counts without explicit approval** — this changes test behavior.

---

## 3. Missing shared contracts (Mapper / Validator)

### Current state

- **`src/core/models/`** — contains `resultModel` etc.; **no** `ApiMapper`, `ApiValidator`, or base validator interface.
- **115** `*.validator.ts` files — all hand-rolled classes, zero `implements` shared interface.
- **109** `*.mapper.ts` files — multiple informal patterns.

### Validator method naming (informal clusters)

| Pattern | Approx. files using | Example modules |
|---------|---------------------|-----------------|
| `validateResponse(...)` | ~60+ | MIS-DASHBOARD, UTILS-LOOKUP, MASTER-DATA, HES-COMMANDS, ENERGY-AUDITS |
| `validateSuccess(...)` + `validateRootStructure(...)` | ~15 | CONSUMERS, REPORTS, FEEDER, CONSUMPTION |
| Domain-specific only (no `validateResponse`) | ~40 | MASTER-DATA harness validators, AUTH (Zod-heavy), DTRS |

Many MIS-DASHBOARD validators use `validateResponse(response: any)` — weak typing.

### Mapper method naming (informal clusters)

| Pattern | Examples |
|---------|----------|
| `static mapData(...)` | MASTER-DATA, UTILS-LOOKUP, ASSET-MANAGEMENT |
| `static map(...)` | DTRS, CONSUMERS, FEEDER, MIS-DASHBOARD |
| Standalone function | `mapMasterDataList()` in `master-data-list.mapper.ts` |
| Inline `return response.data.rows.map(...)` | COMMERICIAL-ANALYSIS mappers |

**Conclusion:** At least **4 distinct mapper shapes** and **3 validator entry-point conventions**. Phase 5 should introduce lightweight interfaces and retrofit 2–3 modules as proof of concept.

---

## 4. Config gaps

### ESLint

| Item | Status |
|------|--------|
| `eslint` in devDependencies | Yes (`^10.3.0`) |
| `eslint.config.js` / `.eslintrc.*` | **None** |
| `@typescript-eslint/*` | **Not installed** |
| `npm run lint` script | **Missing** |

### Prettier

| Item | Status |
|------|--------|
| `prettier` in devDependencies | Yes (`^3.8.3`) |
| `.prettierrc*` / `prettier.config.*` | **None** |
| `.prettierignore` | **None** |
| `npm run format` script | **Missing** |

### Indentation sample (for Phase 2 Prettier decision)

Mixed styles observed:

- **2-space:** `src/core/utils/authenticated.request.ts`, most MASTER-DATA harness files
- **4-space:** `src/modules/CONSUMPTION/utils/consumption-request.helper.ts`, many older CONSUMERS specs
- **Inconsistent within file:** some DTRS specs use irregular spacing around imports

**Recommendation for Phase 2:** Standardize on **2-space** (matches core layer and newer harness code). Run Prettier once with `--write` only after explicit approval (large diff).

### `package.json` `"type": "commonjs"` vs `tsconfig.json` `"module": "ESNext"`

| Config | Value |
|--------|-------|
| `package.json` | `"type": "commonjs"` |
| `tsconfig.json` | `"module": "ESNext"`, `"moduleResolution": "bundler"` |

**Actual runtime behavior:**

- **Playwright tests:** Loaded via `@playwright/test` TypeScript transformer (not `tsc` emit). `playwright.config.ts` uses `require.resolve("./src/global.setup.ts")` — CommonJS `require` in config file. Tests run successfully; mismatch does not block Playwright.
- **Node scripts:** `scripts/*.mjs` are explicit ESM (`.mjs` extension). Unaffected by `"type": "commonjs"`.
- **`npm run typecheck`:** Type-check only (`tsc --noEmit`); no emit, so module setting affects type resolution only.
- **`dist/` output:** If someone runs `tsc` to emit, output would be **ESNext modules** while Node would treat `.js` as CommonJS unless `"type": "module"` — **latent risk** for any future compiled Node entrypoint, not current test runtime.

**Phase 2 action:** Document intentional split or align after verification; do not change blindly.

---

## 5. Naming / casing inconsistencies

### Module folder names

| Issue | Path | Notes |
|-------|------|-------|
| **Typo** | `COMMERICIAL-ANALYSIS` | Should be `COMMERCIAL-ANALYSIS`; slug `commericial-analysis` in `run-module-tests.mjs` |
| Renamed (OK) | `ASSET-MANAGEMENT`, `MIS-DASHBOARD`, etc. | Previously spaced names; now hyphenated |

### API file naming (113 files)

| Convention | Count | Examples |
|------------|-------|----------|
| camelCase / lowercase | ~81 | `dtrsearch.api.ts`, `billingdata.api.ts`, `commands-meter-info.api.ts` |
| kebab-case | ~32 | `meter-master.api.ts`, `consumer-master.api.ts`, `loss-analysis-stats.api.ts` |
| PascalCase | 1 | `DtrId.api.ts` |

### Misplaced / misnamed files

| File | Issue |
|------|-------|
| `COMMERICIAL-ANALYSIS/Data/loadfactor.api.ts` | API class file under `Data/` (should be `Api/loadfactor.api.ts`) |
| `MASTER-DATA/tests/substation.-master.spec.ts` | Stray dot in filename |
| `UTILS-LOOKUP/tests/networksearch.api.spec.ts` | `.api` embedded in spec name |

### Duplicate / confusing class names

| Class name | Locations | Different APIs? |
|------------|-----------|-----------------|
| `EventClassificationValidator` | core `validation.engine.ts`, MIS-DASHBOARD validator, UTILS-LOOKUP validator | **Yes** — MIS report vs lookup table vs stale core copy |

### Feature naming: hyphen vs concatenated

| Style | Example |
|-------|---------|
| kebab | `event-classification.api.ts`, `event-classification.validator.ts` (MIS-DASHBOARD) |
| concatenated | `eventclassification.api.ts`, `eventclassification.validator.ts` (UTILS-LOOKUP) |

Same conceptual domain, different naming conventions across modules.

### Import path depth inconsistency

~70+ spec files import via **`../../../../src/...`** (absolute-from-repo-root style) while newer modules (AUTH, MASTER-DATA harnesses, ENERGY-AUDITS) use **`../../../...`** relative paths. Functionally equivalent but hurts consistency and refactoring.

### README vs filesystem

README references `Global.Setup.ts`; actual file is `src/global.setup.ts` (lowercase).

---

## 6. Logger contention risk

**File:** `src/core/engine/logger.engine.ts`

| Behavior | Detail |
|----------|--------|
| Write API | `fs.appendFileSync(logFile, line, "utf8")` on every log call |
| Log path | `logs/api.log` (single shared file) |
| Parallelism | `playwright.config.ts`: `fullyParallel: true`, default **2 workers** |
| Line format | `[ISO timestamp] [LEVEL] message\n` — single-line atomic append per call |

### Risk assessment

| Risk | Severity | Explanation |
|------|----------|---------------|
| **Interleaved lines** | Low–Medium | Each `appendFileSync` writes one `\n`-terminated line; Node/OpenSSL generally atomic for small appends on local FS, but **not guaranteed** across all platforms/NFS |
| **Worker attribution** | Medium | No worker ID / PID in log line — cannot distinguish parallel workers |
| **Event-loop blocking** | Low | Sync I/O on every API call; acceptable at current volume but scales poorly |
| **Cross-process** | Medium | Multiple CI workers or sharded runs writing same path would contend (CI runs single job per machine today) |

**Phase 6 target:** Buffered/async writes + worker/PID prefix; flush on process exit.

---

## 7. CI gaps

**Workflows reviewed:** `.github/workflows/playwright.yml`, `.github/workflows/playwright-module.yml`

| Gap | Current state | Recommendation (Phase 2) |
|-----|---------------|---------------------------|
| **Typecheck non-blocking** | `continue-on-error: true` on typecheck step | Fix 5 TS errors, then make required |
| **No lint step** | ESLint not configured or run | Add `npm run lint` as required step |
| **No secret scanning** | No gitleaks/trufflehog step | Add gitleaks on push/PR |
| **No PR template** | Missing | Optional: `.github/pull_request_template.md` |
| **Module workflow timeout** | 60 min | Monitor MASTER-DATA / COMMERICIAL-ANALYSIS slow tests |
| **Optional env secrets** | `MDM_METER_COMM_*` not in CI | Document; 2 MASTER-DATA tests skip without them |

### CI behavior (unchanged, documented for context)

- **PR → main:** `npm run test:smoke`
- **Push → main:** `npm test` (full regression)
- **Manual module workflow:** `node scripts/run-module-tests.mjs <slug>`

No workflow changes required for module renames — discovery is filesystem-based.

---

## 8. Inventory snapshot

| Metric | Count |
|--------|------:|
| Modules (with `tests/`) | 22 |
| API files | 113 |
| Validator files | 115 |
| Mapper files | 109 |
| Spec files | 129 |
| Test cases (inventory script) | 203 |
| `@smoke` tests (Playwright grep run) | 152 |

---

## 9. Recommended phase order (unchanged from plan)

| Phase | Focus | Risk |
|-------|-------|------|
| **2** | ESLint, Prettier, lint CI, secret scan, fix TS errors | Low–Medium |
| **3** | Remove core → MIS-DASHBOARD import + duplicate validator | Medium |
| **4** | Consolidate request helpers (after retry policy approval) | **High** (behavior) |
| **5** | Shared Mapper/Validator interfaces (2–3 modules POC) | Low |
| **6** | Logger async + worker prefix | Medium |
| **7** | COMMERICIAL → COMMERCIAL rename + file naming standard | High (touch imports) |

---

## 10. Files referenced by this audit

**Core (boundary / retry / logger):**
- `src/core/engine/validation.engine.ts`
- `src/core/engine/retry.engine.ts`
- `src/core/engine/logger.engine.ts`
- `src/core/utils/authenticated.request.ts`

**Module request helpers:**
- `src/modules/BILLING/utils/billing-request.helper.ts`
- `src/modules/CONSUMPTION/utils/consumption-request.helper.ts`
- `src/modules/CONSUMERS/utils/consumer-request.helper.ts`
- `src/modules/HES-COMMANDS/utils/commands-request.helper.ts`
- `src/modules/COMMERICIAL-ANALYSIS/utils/commercial-request.helper.ts`

**CI / config:**
- `.github/workflows/playwright.yml`
- `.github/workflows/playwright-module.yml`
- `package.json`
- `tsconfig.json`
- `playwright.config.ts`

---

## Awaiting go-ahead

Phase 1 complete. **No code was modified** except creation of this report.

Reply with **go-ahead for Phase 2** (or specify a different phase) before any fixes are applied.
