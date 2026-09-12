# Module Guide — How to Add a New API Module

Last updated: 25 July 2026

Target: a productive engineer can scaffold and land a first smoke suite in about **30 minutes**, then deepen pillars over following PRs.

Related: [ARCHITECTURE.md](./ARCHITECTURE.md) · [HARDENING-STATUS.md](./HARDENING-STATUS.md) · [MDM-PRESENTATION-COVERAGE.md](./MDM-PRESENTATION-COVERAGE.md) · [CONTRIBUTING.md](../CONTRIBUTING.md)

---

## 1. Prerequisites

- Working `.env` (`BASE_URL`, `EMAIL`/`USERNAME`, `PASSWORD`)
- `npm install` done
- Know the API path(s), method, sample success JSON, and auth requirements
- Optional: Swagger via `npm run docs:swagger:open`

---

## 2. Naming

| Item | Convention | Example |
|------|------------|---------|
| Folder | `SCREAMING-KEBAB` under `src/modules/` | `ENERGY-AUDITS` |
| npm slug | lowercase folder | `energy-audits` |
| Api file | `feature.api.ts` | `feeder-alerts.api.ts` |
| Spec tags | `@module-slug`, `@smoke`, `@negative`, … | `@energy-audits` |
| DB gate | `<SLUG_WITH_UNDERSCORES>_DB_SQL_READY` | `ENERGY_AUDITS_DB_SQL_READY` |

List slugs: `npm run test:modules:list`

---

## 3. Fast path (scaffold + smoke)

### Step A — Create module skeleton

```bash
# MODULE_DIR   slug              tag
node scripts/scaffold-module-hardening.mjs ENERGY-AUDITS energy-audits @energy-audits
```

Creates (if missing):

- `schemas/`
- `Db/` SQL stub + gate helper
- `tests/*-db.harness.ts`, `*.contract.spec.ts`, `*.db.spec.ts`
- `tests/mutation-proof/` stubs + proof markdown

Also create the operational layers if not present:

```text
src/modules/ENERGY-AUDITS/
  Api/
  Data/
  Mapper/
  Validator/
  tests/
```

Copy structure from a similar mature module (e.g. `UTILS-LOOKUP` or `FEEDER`).

### Step B — Implement Api → Data → Mapper → Validator

1. **Data** — path constant, default query/body, `maxResponseTimeMs`, env overrides.  
2. **Api** — one method per endpoint; return `{ rawResponse, responseBody, responseTime }`.  
3. **Mapper** — trim strings, normalize nullables, expose mapped types.  
4. **Validator** — success envelope, field rules, pagination math, domain rules.

### Step C — Smoke spec

```typescript
test("Validate GET /indore/... — happy path", {
  tag: ["@smoke", "@energy-audits"],
}, async ({ authenticatedApi }, testInfo) => {
  // Api → PerformanceTracker → ApiValidationHelper.runStandardChecks
  // → validator checks → finalize with defectContext
});
```

### Step D — Wire npm scripts

In `package.json` (follow existing modules):

```json
"test:energy-audits": "node scripts/run-module-tests.mjs energy-audits",
"test:energy-audits:contract": "node scripts/run-contract-tests.mjs energy-audits",
"test:energy-audits:mutation-proof": "node scripts/run-mutation-proof.mjs energy-audits",
"test:energy-audits:db": "node scripts/run-module-tests.mjs energy-audits --db"
```

Ensure the slug is discoverable (`tests/` folder exists).

### Step E — Run

```bash
npm run test:energy-audits -- --smoke
# or
npm run test:module -- energy-audits --smoke
```

---

## 4. Four pillars (after smoke works)

### 4.1 Zod schemas

- Add / tighten `schemas/*.schemas.ts` (prefer `.strict()` on envelopes).  
- Use from validators or mutation fixtures.

### 4.2 Contract snapshots

1. Write `*.contract.spec.ts` with tag `@contract-snapshot`.  
2. Capture:

```bash
UPDATE_CONTRACT_SNAPSHOTS=true npm run test:energy-audits:contract
```

3. Commit files under `contract-snapshots/energy-audits/`.  
4. Later runs fail on unintentional shape drift.

### 4.3 Mutation-proof

1. Add fixtures under `tests/mutation-proof/fixtures/`.  
2. Specs must **fail** validators/schemas when fixtures are broken (missing required field, extra strict field, enum drift, pagination math, DB mismatch).  
3. Document proof in `mutation-testing-proof.md`.  
4. Run:

```bash
npm run test:energy-audits:mutation-proof
```

Mutation specs are excluded from normal `playwright test` unless `INCLUDE_MUTATION_PROOF=true` (module runners set this).

### 4.4 Gated DB cross-validation

1. Replace `SQL_TODO` with real **read-only** SQL (no password/hash columns).  
2. Implement compare helpers + harness.  
3. Document gate in `.env.example`: `# ENERGY_AUDITS_DB_SQL_READY=true`  
4. Add a `@mutation-proof` fixture that proves `compareApiToDb` throws on mismatch.  
5. Run:

```bash
ENERGY_AUDITS_DB_SQL_READY=true npm run test:energy-audits:db
```

Leave gate off until SQL is confirmed against the real schema.  
**Never** ship a harness that passes with empty/`SQL_TODO` work when the gate is on — throw instead (Tier 3 scaffolds).

DB tiers (1 always / 2 selective / 3 API-only): see [CONTRIBUTING.md](../CONTRIBUTING.md) and [HARDENING-STATUS.md](./HARDENING-STATUS.md).

---

## 5. Checklist before PR

- [ ] Smoke + at least one negative path  
- [ ] No secrets in committed files  
- [ ] Tags correct (`@smoke`, module tag)  
- [ ] `defectContext` on finalize for triage  
- [ ] Soft-skips logged as `BACKEND FINDING` when used  
- [ ] Contract snapshot updated **only** if API change is intentional  
- [ ] Mutation-proof proves failure (not soft-pass)  
- [ ] DB gate documented; SQL read-only  
- [ ] `npm run typecheck` clean for touched files  
- [ ] Module script + CI sync if new module

---

## 6. Common patterns to copy

| Need | Good reference |
|------|----------------|
| List + pagination | `UTILS-LOOKUP`, `MODULES-PERMISSIONS` |
| Report grids | `REPORTS`, `CONSUMPTION` |
| Gold DB + mutation depth | `REVENUE-PROTECTION`, `ASSET-MANAGEMENT` |
| Auth me/devices | `AUTH` |
| Master CRUD + provisioning | `MASTER-DATA` |
| Async HES jobs | `HES-COMMANDS` |

---

## 7. What not to do

- Do not invent a new folder layout for one module.  
- Do not assert UI chart pixels or DOM.  
- Do not write to production DB from tests.  
- Do not hardcode row counts unless the API guarantees them.  
- Do not commit `.env` or `playwright/.auth/`.  
- Do not update contract snapshots casually to “make CI green”.

---

## 8. Troubleshooting

| Symptom | Check |
|---------|--------|
| Login 500 in global setup | Backend auth health / credentials / `BASE_URL` |
| 401 loops | Token refresh, CSRF, clock skew |
| Contract mismatch | Intentional API change? → regenerate with `UPDATE_CONTRACT_SNAPSHOTS=true` |
| Mutation passes when it should fail | Fixture not actually broken / wrong schema |
| DB skipped | Gate env not `true` or DB not configured |
| HES E2E never FINISHED | Callback env; use async-pending path or `HES_E2E_REQUIRE_COMPLETION=true` |
