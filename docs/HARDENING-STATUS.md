# Hardening Status — Module × Four Pillars

Last updated: 27 August 2026

**Legend**

| Symbol | Meaning |
|--------|---------|
| ✅ | Present and usable in repo |
| 🟨 | Present but shallow / scaffold (generic mutation, thin SQL, or SQL_TODO) |
| ⬜ | Not applicable / not started |
| **Deep** | Real SQL + meaningful compares (or gold-standard mutation set) |
| **Scaffold** | Gate + stub SQL — **must fail** if gate is on before SQL is pasted |
| **API-only soft** | `@db` path asserts API invariants only (no SQL) — Tier 3 |

**DB tiers** (see [CONTRIBUTING.md](../CONTRIBUTING.md) § Optional DB):

| Tier | Rule |
|------|------|
| **1** | Writes / bulk / async / metering-financial → live SQL + hard fail; mutation proves `compareApiToDb` throws |
| **2** | Selective spot (header / count / one row) — not every matrix cell |
| **3** | API-only; scaffolds leave `*_DB_SQL_READY` unset |

Pillars:

1. **Zod** — `schemas/`  
2. **Contract** — `*.contract.spec.ts` + `contract-snapshots/<slug>/`  
3. **Mutation** — `tests/mutation-proof/`  
4. **DB** — gated `@db` harness (`*_DB_SQL_READY`)

Framework phase: **maintenance & expansion** (architecture complete). Depth may differ by module; deepen where business value justifies it.

---

## 1. Status matrix

| Module | Slug | Zod | Contract | Mutation | DB pillar | DB SQL depth | Tier | Notes |
|--------|------|-----|----------|----------|-----------|--------------|------|-------|
| ASSET-MANAGEMENT | `asset-management` | ✅ | ✅ | ✅ | ✅ | **Deep** | 1 | Hierarchy / DTR |
| AUDIT-LOGS | `audit-logs` | ✅ | ✅ | ✅ | ✅ | Selective | 2 | List total + row spot |
| AUTH | `auth` | ✅ | ✅ | ✅ | ✅ | **Deep** | 1 | me / devices / invitations |
| BILLING | `billing` | ✅ | ✅ | ✅ | ✅ | **Deep** | 1 | Meter header + archive universe − DT |
| COMMERICIAL-ANALYSIS | `commericial-analysis` | ✅ | ✅ | ✅ | ✅ | Selective | 2 | PF/LF spot; archive soft-skip |
| CONSUMERS | `consumers` | ✅ | ✅ | ✅ | ✅ | **Deep** | 1 | Profile/meter/activation + billing + RTP/PQ; some warn-skips |
| CONSUMPTION | `consumption` | ✅ | ✅ | ✅ | ✅ | **Deep** | 1 | Totals + identity |
| DASHBOARD | `dashboard` | ✅ | ✅ | ✅ | ✅ | Selective | 2 | DTR SQL + soft API invariants |
| DTRS | `dtrs` | ✅ | ✅ | ✅ | ✅ | Selective | 2 | Profile + feeders |
| ENERGY-AUDITS | `energy-audits` | ✅ | ✅ | ✅ | ✅ | Selective | 2 | DTR count + identity |
| FEEDER | `feeder` | ✅ | ✅ | ✅ | ✅ | Selective | 2 | Profile + meter; alerts SQL_TODO |
| HES-COMMANDS | `hes-commands` | ✅ | ✅ | ✅ | ✅ | **Deep** | 1 | History exact + spot |
| MASTER-DATA | `master-data` | ✅ | ✅ | ✅ | ✅ | **Deep** | 1 | List/master spot |
| METER-REPLACEMENT | `meter-replacement` | ✅ | ✅ | ✅ | ✅ | **Deep** | 1 | Dashboard / history / submission |
| MIS-DASHBOARD | `mis-dashboard` | ✅ | ✅ | ✅ | ✅ | **Deep** | 1 | Comm-stats; unmapped soft-warn |
| MODULES-PERMISSIONS | `modules-permissions` | ✅ | ✅ | ✅ | ✅ | **Deep** | 1 | Exact catalog counts |
| NOTIFICATIONS | `notifications` | ✅ | ✅ | ✅ | ✅ | **Deep** | 1 | Inbox stats/list/spot |
| OVERALL-DASHBOARD | `overall-dashboard` | ✅ | ✅ | ✅ | 🟨 | **API-only soft** | 3 | No SQL — installationSummary invariants only |
| REPORTS | `reports` | ✅ | ✅ | ✅ | ✅ | **Deep** | 1 | Event-report + DTR billing header |
| REVENUE-PROTECTION | `revenue-protection` | ✅ | ✅ | ✅ | ✅ | **Deep** | 1 | Counts + PATCH write-verify |
| ROLE-PERMISSIONS | `role-permissions` | ✅ | ✅ | ✅ | 🟨 | Scaffold (fail if gated) | 3 | Leave gate off until SQL |
| TECHNICAL-ANALYSIS | `technical-analysis` | ✅ | ✅ | ✅ | ✅ | Selective | 2 | Summary↔report + row spot |
| USERS-ADMIN | `users-admin` | ✅ | ✅ | ✅ | 🟨 | Scaffold (fail if gated) | 3 | Leave gate off until SQL |
| USERS-PROFILE-IMAGE | `users-profile-image` | ✅ | ✅ | ✅ | 🟨 | Scaffold (fail if gated) | 3 | Leave gate off until SQL |
| UTILS-LOOKUP | `utils-lookup` | ✅ | ✅ | ✅ | ✅ | **Deep** | 1 | Catalog COUNT + sample; DB mismatch mutation |

All listed modules have **contract snapshot folders** under `contract-snapshots/`.

---

## 2. Depth interpretation (important)

**Framework completeness ≠ identical depth.**

- Every module above has the **pillar scaffolding** (schemas, contract, mutation, db gate).  
- **Deep** modules have production-grade SQL and/or rich mutation suites.  
- **Scaffold** modules must **not** pass live DB when the gate is on with `SQL_TODO` — leave `*_DB_SQL_READY` unset until SQL is real.  
- **API-only soft** (`OVERALL-DASHBOARD`) is Tier 3: do not treat green `@db` as DB cross-validation.

This is expected in the maintenance phase. Prefer deepening RP / Master Data / Billing–style modules when a flow is high risk—not cloning depth everywhere for symmetry.

---

## 3. MDM presentation vs automation (API scope)

**PDF reference:** `MDM Presentation_23.12.2025.pdf` (131 pages).

**Did we follow it?** **Yes** as the business catalog for API coverage; **No** as a UI automation script. Full slide-by-slide follow/gap table: [MDM-PRESENTATION-COVERAGE.md](./MDM-PRESENTATION-COVERAGE.md).

| MDM business area (presentation) | Framework module(s) | Followed PDF? |
|----------------------------------|---------------------|---------------|
| Auth / users / roles / permissions | AUTH, USERS-*, ROLE-*, MODULES-* | Yes (API) |
| Consumer / DTR / master configuration | CONSUMERS, DTRS, MASTER-DATA, UTILS-LOOKUP | Yes |
| Meter commands (single / bulk) | HES-COMMANDS | Yes |
| Billing exchange | HES history proxy | Partial |
| Notifications | NOTIFICATIONS | Yes |
| Energy audit / hourly loss | ENERGY-AUDITS | Yes |
| Commercial / technical analysis | COMMERICIAL-ANALYSIS, TECHNICAL-ANALYSIS | Yes (param families) |
| MIS / overall / DTR dashboards | MIS-DASHBOARD, OVERALL-DASHBOARD, DASHBOARD, ASSET-MANAGEMENT | Yes (APIs, not charts) |
| Consumption / billing / patterns | CONSUMPTION, BILLING | Yes |
| Revenue protection | REVENUE-PROTECTION | Yes (deep) |
| Meter replacement | METER-REPLACEMENT | Yes / Partial on collection reports |
| SAIFI / SAIDI report suite | — | **Gap** |
| Audit | AUDIT-LOGS | Yes |

**Out of scope for this repo:** UI layout, chart rendering, static overview visuals. Cover those only if a separate Playwright UI project is approved.

---

## 4. How to refresh this document

When a module moves from scaffold → deep:

1. Confirm real SQL (no `SQL_TODO`) and green `*_DB_SQL_READY=true` run.  
2. Confirm mutation proof markdown lists real cases.  
3. Update the matrix row (depth + notes).  
4. Optionally bump the “Last updated” date.

Inventory helper:

```bash
npm run test:inventory
npm run test:modules:list
```

---

## 5. Recommended next deepening (ops, not redesign)

| Priority | Module | Why |
|----------|--------|-----|
| ~~P1~~ | ~~AUTH~~ | ~~Finish verify~~ — **done** (contract + mutation + live DB) |
| ~~P1~~ | ~~HES-COMMANDS~~ | ~~soft-skip / DB~~ — **done** (history SQL + PARTIAL/status fixes; async pending kept) |
| ~~P2~~ | ~~CONSUMERS~~ | ~~High traffic~~ — **done** (billing archive + meter_last_seen; telemetry still deferred) |
| ~~P2~~ | ~~CONSUMPTION~~ | ~~High traffic~~ — **done** (API ≤ DB count + identity; archive IR/FR SQL ready) |
| ~~P2~~ | ~~REPORTS / MIS~~ | ~~Dashboard consumers~~ — **done** (event catalog + DTR meter; MIS comm-stats ≤ DB) |
| ~~P3~~ | ~~NOTIFICATIONS / MODULES-PERMISSIONS~~ | ~~Admin catalogs~~ — **done** (inbox exact; modules catalog exact) |
| P3 | Remaining Tier 3 scaffolds | ROLE / USERS-* — paste SQL or keep gate off |
| P3 | OVERALL-DASHBOARD | Paste overall-metrics SQL or keep Tier 3 API-only |
| P3 | Tier 2 deepeners | DASHBOARD / DTRS / FEEDER / ENERGY-AUDITS as SQL arrives |

Keep CI green: treat rising skip counts as backlog, not success.
