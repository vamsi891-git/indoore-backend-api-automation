# Contributing — Indoore Backend Testing

Last updated: 25 July 2026

Thank you for contributing. This framework is in **maintenance & expansion**: prefer delivering modules and reliability over new framework features.

Related docs: [README.md](./README.md) · [ARCHITECTURE.md](./docs/ARCHITECTURE.md) · [MODULE_GUIDE.md](./docs/MODULE_GUIDE.md) · [HARDENING-STATUS.md](./docs/HARDENING-STATUS.md)

---

## 1. Ground rules

1. **Do not redesign** Api / Data / Mapper / Validator / Db / schemas / tests without team agreement.  
2. Match existing module patterns; copy a similar module rather than inventing structure.  
3. Keep diffs focused — no drive-by refactors or unsolicited markdown unless asked.  
4. Never commit secrets (`.env`, `playwright/.auth/**`, tokens, passwords).  
5. Soft-skips and `BACKEND FINDING` logs are **debt signals** — track them; do not treat them as done coverage.  
6. Contract snapshots change only with **intentional** API contract changes.

---

## 2. Branching and PR flow

```text
feature/module-branch  ──PR──►  QA  ──(post-merge gate)──►  module suites
                                  │
                                  └── green ──PR──► main ──► full regression
```

1. Branch from the team’s integration branch (typically `QA` or as directed).  
2. Open PR **into `QA`** for review.  
3. After merge, **QA Module Gate** runs affected modules (or all modules if core paths changed).  
4. Promote `QA` → `main` only when the gate is green.

Use module-named branches when possible (`master-data`, `hes-commands`, …).

---

## 3. Local setup

```bash
npm install
copy .env.example .env   # Windows
# fill BASE_URL, EMAIL (or USERNAME), PASSWORD
npm run test:module -- <slug> --smoke
```

Optional DB:

```bash
# set PG* vars from .env.example
npm run db:ping
<MODULE>_DB_SQL_READY=true npm run test:<slug>:db
```

### DB validation tiers (framework rule of thumb)

Do **not** DB-check every API test. Reserve live SQL for integrity risk:

| Tier | When | What to assert |
|------|------|----------------|
| **1 — Always (when gated)** | Writes, bulk/batch, async commands, financial/metering values | Real read-only SQL + hard fail on mismatch; keep a `@mutation-proof` fixture that proves `compareApiToDb` throws |
| **2 — Selective** | Stable read paths with known joins / totals | One grain only (header spot, count `lte`, one row) — not every filter matrix cell |
| **3 — API-only** | Pure GET shape/errors, auth negatives, scaffolds without SQL | Zod + validators; **no** green `@db` path with empty/no-op SQL |

**Scaffold rule:** if `*_DB_SQL_READY=true` but SQL is still `SQL_TODO`, the harness **must fail** (not pass). Leave the gate unset until SQL is real.

See [docs/HARDENING-STATUS.md](docs/HARDENING-STATUS.md) for per-module DB depth.

---

## 4. Coding standards

### TypeScript / Playwright

- Strict TypeScript; run `npm run typecheck` on touched areas.  
- Prefer absolute clarity over clever abstractions.  
- Specs: `async ({ authenticatedApi }, testInfo) => { ... }`.  
- Always pass `defectContext` into finalize for triage when asserting live APIs.

### Layers

| Do | Don’t |
|----|--------|
| HTTP only in `Api/` | Assert business rules inside Api |
| Normalize in `Mapper/` | Scatter trim/null logic in specs |
| Rules in `Validator/` + Zod | Duplicate the same expect in five specs |
| Read-only SQL in `Db/` | INSERT/UPDATE/DELETE in tests |

### Naming

- Files: `feature.api.ts`, `feature.mapper.ts`, `feature.validator.ts`, `feature.spec.ts`  
- Tags: `@smoke`, `@negative`, `@db`, `@contract-snapshot`, `@mutation-proof`, module tag  

### Soft-skips

Use existing helpers (`BackendResponse.shouldSkipServerFailure`, HES helpers). Always log why. Prefer failing when the product is supposed to be healthy and env is known good.

---

## 5. Four-pillar PR checklist

When touching or adding a module:

- [ ] Smoke / API specs green locally  
- [ ] Zod schemas updated if shape changed  
- [ ] Contract: either unchanged or regenerated with `UPDATE_CONTRACT_SNAPSHOTS=true` and explained in PR  
- [ ] Mutation-proof still fails on broken fixtures (`npm run test:<slug>:mutation-proof`)  
- [ ] DB: gate documented; SQL read-only; no secrets in queries  
- [ ] DB: no silent no-op harness when gate is on (Tier 3 scaffolds leave gate off)  
- [ ] Mutation-proof includes a deliberate DB mismatch case for modules with live SQL  
- [ ] `.env.example` updated for any new non-secret config keys  
- [ ] `package.json` scripts if new module  
- [ ] No `.env` / auth token files in the PR  

---

## 6. Commands cheat sheet

```bash
npm run test:modules:list
npm run test:module -- <slug>
npm run test:module -- <slug> --smoke
npm run test:module -- <slug> --api
npm run test:module -- <slug> --db

npm run test:<slug>:contract
UPDATE_CONTRACT_SNAPSHOTS=true npm run test:<slug>:contract

npm run test:<slug>:mutation-proof

npm run test:inventory
npm run typecheck
npm run report
npm run report:allure
```

HES:

```bash
npm run test:hes-commands          # api (+ mutation), excludes @db by default
npm run test:hes:e2e
# HES_E2E_REQUIRE_COMPLETION=true  # fail if callback never finishes
```

---

## 7. Review expectations

Reviewers should check:

- Pattern consistency with sibling modules  
- No secret leakage  
- Snapshot updates justified  
- Mutation actually proves failure  
- Soft-skips justified and logged  
- CI module list synced for new modules  

---

## 8. Documentation updates

Update docs when behavior changes for newcomers:

| Change | Update |
|--------|--------|
| New module | MODULE_GUIDE examples, HARDENING-STATUS row, README module list if needed |
| New shared engine | ARCHITECTURE.md |
| New env var | `.env.example` + README/CONTRIBUTING if user-facing |
| Depth SQL_TODO → deep | HARDENING-STATUS.md |

Living deep notes also live in `docs/FRAMEWORK-NOTES.md` (refresh inventory when counts matter).

---

## 9. What we are not doing right now

- Framework redesigns “because it sounds advanced”  
- UI chart automation in this repository  
- Writing to shared production databases from tests  
- Amending shared history / force-push to `main` without explicit approval  

Ship modules. Keep pillars green. Document as you go.
