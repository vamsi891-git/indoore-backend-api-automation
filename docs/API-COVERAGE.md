# API coverage reference

Last updated: 11 Sep 2026

Use this file to see **which HTTP APIs we call** and **what we check**.  
If a row is missing or a check is too weak, that is the next work item.

Related: [SOLO-QA.md](./SOLO-QA.md) (how we run tests) · [MDM-PRESENTATION-COVERAGE.md](./MDM-PRESENTATION-COVERAGE.md) (PDF screens vs APIs)

---

## How to read this

| Status | Meaning |
|--------|---------|
| **ON** | Runs in the default module command (`npm run test:<module>`) |
| **SKIPPED** | Spec exists but is skipped (writes off). Code is still in the repo. |
| **BLOCKED** | API helper throws unless `ALLOW_WRITE_TESTS=true` (never set on production) |
| **OPTIONAL** | Runs only with extra env (DB, org/network ids, serials) or a dedicated command |

**Default rule:** GET/list/validate stay **ON**. POST/PUT/PATCH/DELETE that change data stay **SKIPPED**.

---

## Checks we almost always do on a live GET

Most list/widget specs run this set:

1. HTTP status (usually **200**; negatives expect **400**)
2. Content type JSON
3. Response time under the module timeout
4. No secrets in the body (Bearer, JWT, password, token fields)
5. Envelope (`success`, `data` or `error`)
6. Zod schema (when the module has one)
7. Domain validator (columns, rows, pagination, filters)

Extra layers (not every API):

| Layer | What it checks | When |
|-------|----------------|------|
| Contract snapshot | JSON **key names** vs `contract-snapshots/` | `npm run test:<module>:contract` |
| DB compare | API totals/rows vs SQL | `npm run test:<module>:db` + DB env |
| Auth negative | No token / bad token → 401 | Some modules |
| Mutation-proof | Extra one-off checks | Off unless `INCLUDE_MUTATION_PROOF=true` |

---

## AUTH

Login runs in **global setup** (all authenticated tests). Dedicated AUTH specs also cover session APIs.

| Method | Path | Status | What we check |
|--------|------|--------|----------------|
| GET | `/indore/auth/login` | ON | CSRF / preflight for login |
| POST | `/indore/auth/login` | ON | Email/password; may return 2FA challenge |
| POST | `/indore/auth/login/2fa` | ON | TOTP when `TOTP_SECRET` is set |
| POST | `/indore/auth/login/release-device` | ON | Device-limit path (release a slot) |
| POST | `/indore/auth/refresh` | ON | Token refresh |
| GET | `/indore/auth/me` | ON | Current user; contract |
| GET | `/indore/auth/devices` | ON | Device list; contract |
| DELETE | `/indore/auth/devices/:id` | ON | Used when device slots are full |
| GET | `/indore/auth/invitations/mine` | ON | List (read); contract |
| POST | `/indore/auth/invite` | SKIPPED | Invite user |
| GET | `/indore/auth/invite/preview` | SKIPPED | Preview token |
| POST | `/indore/auth/invite/accept` | SKIPPED | Accept invite |
| POST | `/indore/auth/invitations/:id/resend` | SKIPPED | Resend |
| DELETE | `/indore/auth/invitations/:id` | SKIPPED | Delete invite |

**Gaps:** invite/accept/delete not run on live. Confirm 2FA + device-limit on every environment you care about.

---

## MASTER-DATA

| Method | Path | Status | What we check |
|--------|------|--------|----------------|
| GET | `/indore/master-data/meter-master-data` | ON | 200, schema, columns, pagination, page 2, limit, search, empty `q`, page past last; serial/IP/modem rules |
| GET | `/indore/master-data/dtr-master-data` | ON | Same list pattern + unique serials, sort, lat/long |
| GET | `/indore/master-data/consumer-master-data` | ON | Same + `meterType` live/test, archive flag, CID, phase, hierarchy |
| GET | `/indore/master-data/feeder-master-data` | ON | List + counts, hierarchy, unique names |
| GET | `/indore/master-data/substation-master-data` | ON | Same as feeder |
| GET | `/indore/master-data/meter-communication-status` | ON | Status filters, search, summary buckets; unknown filter → 400 |
| GET | `/indore/master-data/audit-logs` | ON | Sort, page, `action` / `actionPrefix`; invalid query → 400 |
| GET | `/indore/master-data/validate-add-meter` | ON | New serial allowed; existing rejected; empty/whitespace/missing → 400. **Skips** if no serial |
| GET | `/indore/master-data/validate-dtr-meter` | ON | Assignable / not found / on DTR / inactive / on consumer. **Skips** if no serial |
| POST | `/indore/master-data/add-meter` | SKIPPED + BLOCKED | Create meter |
| PUT | `/indore/master-data/meters/:id` | SKIPPED | Update meter |
| DELETE | `/indore/master-data/meters/:id` | SKIPPED | Deactivate |
| POST | `/indore/master-data/add-dtr` | SKIPPED + BLOCKED | Create DTR |
| POST | `/indore/consumers` | SKIPPED + BLOCKED | Create consumer (spec lives under MASTER-DATA) |
| POST | `/indore/master-data/bulk-upload-*` | SKIPPED | Excel bulk meters / DTR / consumers |
| — | meter↔DTR/consumer e2e | SKIPPED | Write lifecycle |

**Gaps:** writes not live. `meterType=test` does not assert every row is a test meter (same field checks on filtered page). Validate cases skip without matching env/list serials.

---

## DASHBOARD

| Method | Path | Status | What we check |
|--------|------|--------|----------------|
| GET | `/indore/dashboard/consumer/metrics` | ON | Live metrics, unknown query |
| GET | `/indore/dashboard/dtr/summary` | ON | Periods (hourly…yearly), invalid period, unknown query |
| GET | `/indore/dashboard/dtr/consumption` | ON | Same period pattern |
| GET | `/indore/dashboard/dtr/communication-status` | ON | Same |
| GET | `/indore/dashboard/dtr/power-status` | ON | Same |
| GET | `/indore/dashboard/dtr/load-unbalance` | ON | Distribution |
| GET | `/indore/dashboard/dtr/voltage-unbalance` | ON | Distribution |
| GET | `/indore/dashboard/dtr/load-unbalance-details` | ON | Bands + page/limit |
| GET | `/indore/dashboard/dtr/voltage-unbalance-details` | ON | Same |
| GET | `/indore/dashboard/dtr/power-status-details` | ON | on/off + page |
| GET | `/indore/dashboard/dtr/communication-details` | ON | communicated / not; reject legacy status |
| GET | `/indore/dashboard/dtr/consumption-details` | ON | kwh/kvah/kvarh |
| GET | `/indore/dashboard/dtr/percentage-loading-details` | ON | load bands |
| GET | `/indore/dashboard/consumer/connection-status` | ON | connected / disconnected / permanent |
| GET | `/indore/dashboard/consumer/category-distribution` | ON | category filter + page |
| GET | `/indore/dashboard/consumer/phase-distribution` | ON | phase filter |
| GET | `/indore/dashboard/consumer/oem-distribution` | ON | OEM filter |
| GET | `/indore/dashboard/revenue-subsidy-pf` | ON | Live GET + unknown query 400; auth negatives |
| POST | `/indore/dashboard/revenue-subsidy-pf` | SKIPPED + BLOCKED | Save amounts |

**Gaps:** no PUT. POST save not live. Widget GET filters vs live data quality vary by environment.

---

## OVERALL-DASHBOARD

| Method | Path | Status | What we check |
|--------|------|--------|----------------|
| GET | `/indore/dashboard/overall-metrics` | ON | Overall metrics envelope |
| GET | `/indore/dashboard/dtr/communication-status` | ON | Shared DTR communication widget |
| GET | `/indore/overall-dashboard/installation-summary` | ON | Mapped vs unmapped counts add up; percents ≈ share of total (do not pin live totals); unknown query 400 |
| GET | `/indore/overall-dashboard/disconnection-details` | ON | Last 6 IST months, unique labels, counts ≥ 0 (zeros OK; do not pin month names or counts); unknown query 400 |

---

## MIS-DASHBOARD

| Method | Path | Status | What we check |
|--------|------|--------|----------------|
| GET | `/indore/mis-dashboard/communication` | ON | Comm dashboard |
| GET | `/indore/mis-dashboard/comm-stats` | ON | Stats |
| GET | `/indore/mis-dashboard/priority-overview` | ON | Priority overview |
| GET | `/indore/mis-dashboard/event-data/priority-wise` | ON | Overview |
| GET | `/indore/mis-dashboard/event-data/priority-wise/:priority` | ON | Priorities 1–6 (separate specs) |
| GET | `/indore/mis-dashboard/event-data/classification` | ON | Classification |
| GET | `/indore/mis-dashboard/event-data/voltage` | ON | Voltage events |
| GET | `/indore/mis-dashboard/event-data/current` | ON | Current events |
| GET | `/indore/mis-dashboard/event-data/power` | ON | Power events |
| GET | `/indore/mis-dashboard/event-data/transaction` | ON | Transaction events |
| GET | `/indore/mis-dashboard/event-data/non-rollover-control` | ON | Non-rollover |

---

## CONSUMERS (profile / telemetry)

| Method | Path | Status | What we check |
|--------|------|--------|----------------|
| GET | `/indore/consumers/{ref}/profile` | ON | Profile |
| GET | `/indore/consumers/{ref}/communication-status` | ON | Comm status |
| GET | `/indore/consumers/{ref}/billing-history` | ON | Billing history |
| GET | `/indore/consumers/{ref}/billing-period` | ON | Period |
| GET | `/indore/consumers/{ref}/energy-consumption-graph` | ON | Graph |
| GET | `/indore/consumers/{ref}/energy-flow` | ON | Energy flow |
| GET | `/indore/consumers/{ref}/event-log/cards` | ON | Event cards |
| GET | `/indore/consumers/{ref}/event-log/list` | ON | Event list |
| GET | `/indore/consumers/{ref}/live-load-profile` | ON | Load profile |
| GET | `/indore/consumers/{ref}/power-quality` | ON | PQ |
| GET | `/indore/consumers/{ref}/real-time-power` | ON | Real-time |
| GET | `/indore/consumers/validate-meter` | ON | Can meter be assigned to consumer |
| GET | `/indore/consumers/nearest-account-ids` | ON | Lookup |
| PATCH | `/indore/consumers/{id}/activation` | ON | Activation toggle (needs a live consumer id; **does change status**) |

**Gaps:** activation PATCH still runs. Create consumer is under MASTER-DATA (skipped).

---

## DTRS

| Method | Path | Status | What we check |
|--------|------|--------|----------------|
| GET | `/indore/dtr/{dtrCode}/profile` | ON | Profile |
| GET | `/indore/dtr/{dtrCode}/statistics` | ON | Stats |
| GET | `/indore/dtr/{dtrCode}/capacity-gauge` | ON | Gauge |
| GET | `/indore/dtr/{dtrCode}/power-triangle` | ON | Triangle |
| GET | `/indore/dtr/{dtrCode}/feeders` | ON | Feeders |
| GET | `/indore/dtr/{dtrCode}/daily-threshold-chart` | ON | Threshold chart |
| GET | `/indore/dtr/{dtrCode}/events` | ON | Events |

Needs a real `dtrCode` in env/data.

---

## DTR-LOAD

Default window: **1–30 Oct 2025**. Run `npm run test:module -- dtr-load`. Contract / mutation / DB stay off the default command.

| Method | Path | Status | What we check |
|--------|------|--------|----------------|
| GET | `/indore/dtr-load` | ON | Types `hourly_actual_load`, `hourly_load_percentage`, `consumption`, `loading`, `unbalance_loading`, `load_summary`; unique meter/lookup/DTR name (same feeder allowed); H1–H24 ≥ 0 including zeros; hourly total ≈ sum of hours; load % ≈ loading/rating; IR/IY/IB ≥ 0; min load 0 and max % over 100 allowed; live totals not pinned |
| GET | `/indore/dtr-load/rating-options` | ON | Date window; unique `id`/`value`; `id` matches numeric `value`; sorted smallest first; live list not pinned |

---

## FEEDER

| Method | Path | Status | What we check |
|--------|------|--------|----------------|
| GET | `/indore/feeder/{feederCode}/profile` | ON | Overview cards; unique titles; `FEEDER_CODE` (default UVZ73); unused query ignored; unknown feeder 404 |
| GET | `/indore/feeder/{feederCode}/alerts` | ON | Pagination; empty list valid; unique serialNos when rows exist (same meter allowed); live totals not pinned |
| GET | `/indore/feeder/{feederCode}/electrical-parameters` | ON | R/Y/B volts & amps; nulls/zeros OK when no meter |
| GET | `/indore/feeder/{feederCode}/daily-consumption` | ON | `granularity=day`/`monthly`; empty points valid; unique keys when points exist; live series not pinned |

---

## ASSET-MANAGEMENT

| Method | Path | Status | What we check |
|--------|------|--------|----------------|
| GET | `/indore/asset-management/network-hierarchy` | ON | Network tree |
| GET | `/indore/asset-management/organisation-hierarchy` | ON | Org tree |
| GET | `/indore/asset-management/dtr/:id` | ON | DTR detail page |

---

## UTILS-LOOKUP

All **14 GET catalogs/search are ON**. Run `npm run test:utils-lookup`.

Typical checks: 200, JSON, no secrets, envelope, uniqueness, pagination/limit (search), 400 on page/limit 0, columns on consumer + DTR search.

| Path | What we check |
|------|----------------|
| `/indore/utils/connection-statuses` | Catalog ids/names unique |
| `/indore/utils/consumer-categories` | Catalog |
| `/indore/utils/device-manufacturers` | Catalog |
| `/indore/utils/events` | Catalog |
| `/indore/utils/event-classifications` | Catalog |
| `/indore/utils/event-priorities` | Catalog |
| `/indore/utils/meter-phases` | Catalog |
| `/indore/utils/payment-contracts` | Catalog + expected codes |
| `/indore/utils/hierarchies/network` | Tree, order 1..n |
| `/indore/utils/hierarchies/organisation` | Tree, order 1..n |
| `/indore/utils/search/networks` | Limit, 400 on 0 |
| `/indore/utils/search/organisations` | Limit, 400 on 0 |
| `/indore/utils/search/consumers` | Slim grid: Consumer, CID, Address, IVRS, Meter, Mobile (no Existing IVRS) |
| `/indore/utils/search/dtr` | Same columns as DTR master (Feeder Name/Code, DTR Code, New DTR Code, capacity, Meter SL No, Meter Make) |

Missing-route probes expect **404** (`connection-types`, `billing-cycles`, `tods`, `main-sub-meters`). Duplicate organisation name `Barwani` is allowed.

OPTIONAL: `npm run test:utils-lookup:contract` · `npm run test:utils-lookup:mutation-proof` · `UTILS_LOOKUP_DB_SQL_READY=true npm run test:utils-lookup:db`

---

## BILLING

Default window: **Oct 2025**. Run `npm run test:module -- billing`. Contract / mutation / DB stay off the default command.

| Method | Path | Status | What we check |
|--------|------|--------|----------------|
| GET | `/indore/billing/billing-data` | ON | Oct 2025 grid; unique slNo / MSN+time / lookup+time / IVRS+time (rank, feeder, DTR, date may repeat); sparse hierarchy and 1900 MD OT allowed; live totals not pinned |
| GET | `/indore/billing/daywise-billing-data` | ON | Oct 2025 D1–D31 grid; unique slNo / meter / lookup / IVRS / row id (same feeder/DTR allowed); plateau days valid; `includeTotal=false` estimate + `hasMore`; live totals not pinned |

---

## CONSUMPTION

| Method | Path | Status | What we check |
|--------|------|--------|----------------|
| GET | `/indore/consumption/report` | ON | `daily` / `hourly` / `monthly` / `nightZero`; live window `fromDate`/`toDate` 19–20 Dec 2025 with `month=10&year=2025`; Zod; unique slNo/meter/IVRS when rows exist (same feeder/DTR allowed); null kWh / empty hourly list valid; live totals not pinned |
| GET | `/indore/consumption/monthly-net-meter` | ON | Oct 2025 (`month`/`year` from `CONSUMPTION_MONTH`/`CONSUMPTION_YEAR`); Zod; unique slNo/meter/IVRS when rows exist (same circle/feeder/DTR/category allowed); import/export ≥0; net = import − export (negative net OK); all-null energy row valid; live totals not pinned |
| GET | `/indore/consumption/pattern-consumption` | ON | `lastThree` / `yearly` / `comparison`; Oct 2025 (`month`/`year` from `CONSUMPTION_MONTH`/`CONSUMPTION_YEAR`); table + columns; Zod; unique slNo/meter/IVRS when rows exist (same circle/feeder/DTR allowed); null month energy valid; `lastYearSameMonthKwh` null OK; live `totalCount` not pinned |

---

## COMMERCIAL ANALYSIS (`COMMERICIAL-ANALYSIS`)

| Method | Path | Status | What we check |
|--------|------|--------|----------------|
| GET | `/indore/analysis/commercial/summary` | ON | Summary |
| GET | `/indore/analysis/commercial/md` | ON | MD analysis |
| GET | `/indore/analysis/commercial/pf` | ON | Power factor |
| GET | `/indore/analysis/commercial/lf` | ON | Load factor |
| GET | `/indore/analysis/commercial/day-night` | ON | Day/night |
| GET | `/indore/analysis/commercial/consumption-pattern` | ON | Pattern |
| GET | `/indore/analysis/commercial/consumption-compare` | ON | Compare |

Plus auth-negative and edge specs.

---

## TECHNICAL ANALYSIS

Default window: **month=10, year=2025**. Run `npm run test:technical-analysis`. Contract / mutation / DB stay on their dedicated commands.

| Method | Path | Status | What we check |
|--------|------|--------|----------------|
| GET | `/indore/analysis/technical/summary` | ON | 26 cards (technical + YNR names); household + non-household ≤ total; empty vs live `hasData`; card total vs list total (duration/count); Power Failure household and non-household lists match the card; month/year echo; invalid/missing month/year → 400 |
| GET | `/indore/analysis/technical/report` | ON | All 26 `analysisType` live grids: 200, schema envelope, Zone vs phase `slNo` columns, duration/YNR/`Occurence_Time` headers, row types, duplicate contract (same meter two DTRs allowed; same meter+DTR is a fail), duration floors (100/12/10), count/phase rules, first/last uniqueness (phase = page 1 only), household/non-household page-1 uniqueness on Power Failure, page beyond / pageSize / unknown query, invalid type/month/pageSize → 400 |

**Known backend exceptions (logged, not failed):** Current Unbalance card vs list totals can differ; phase reports use cursor paging (do not compare `pagination.total` to the card; last page can 400). Summary may 500 `INTERNAL_ERROR` (skipped after log).

OPTIONAL: `npm run test:technical-analysis:contract` · `npm run test:technical-analysis:mutation-proof` · `TECHNICAL_ANALYSIS_DB_SQL_READY=true npm run test:technical-analysis:db`

---

## REPORTS

Default windows: **Oct 2025** (min-max voltage, current-without-voltage, bill-status, billing-md-snapshot, dtr-billing, consumer/communication/event reports). Run `npm run test:module -- reports`. Contract / mutation / DB stay off the default command.

| Method | Path | Status | What we check |
|--------|------|--------|----------------|
| GET | `/indore/reports/overview` | ON | KPI cards; zeros still count as available |
| GET | `/indore/reports/dtr-data` | ON | Oct 2025 IP/LS 1–30 days (`includeTotal=false`); IP PF/kW columns; unique MSN+time (same feeder/time on many meters allowed); DP >7 days → `REPORT_BACKGROUND_REQUIRED`; DP live uses a 7-day window |
| GET | `/indore/reports/dtr-communication` | ON | 1–30 Oct 2025; `includeTotal=false` + archive counts; unique MSN+logDate / lookupId (same DTR / feeder / date on many meters allowed; IP/LS/DP can be 0) |
| GET | `/indore/reports/dtr-billing` | ON | 1–30 Oct 2025 (`includeTotal=false`); `DTR Capacity`; null total + `hasMore`; unique id / slNo / MSN+time (same feeder/DTR/date on many meters allowed; export 0 and null `kvaDateTime` OK) |
| GET | `/indore/reports/dtr-event` | ON | 1–30 Oct 2025; `S No.` + Duration (HH:MM:SS) hours may exceed 24; rating nullable; unique DTR meter / network id (same eventId on many DTRs allowed) |
| GET | `/indore/reports/dtr-event-detail` | ON | 1–30 Oct 2025; Duration header DD:HH:MM with live `H:MM:SS`; empty DTR Type OK; unique meter+eventId+logDate (same MSN on different events allowed) |
| GET | `/indore/reports/bill-status` | ON | Oct 2025 summary; empty rows OK (`generated + notGenerated === totalConsumers`); live totals not pinned |
| GET | `/indore/reports/billing-md-snapshot` | ON | Oct 2025 MD grid (`includeTotal=false`); total=0 with rows is valid; sparse hierarchy / `1900-01-01` OT OK; unique id / slNo / MSN+billing time (same feeder/DTR/date on many meters allowed) |
| GET | `/indore/reports/min-max-voltage` | ON | Oct 2025 min/max × R/Y/B; `Consumer Name`; unique meter serial (same 3PH 4CT / DTR on many meters allowed) |
| GET | `/indore/reports/min-max-voltage/count` | ON | Oct 2025 min/max × R/Y/B; `total` + `totalIsExact`; count matches list `pagination.total`; page/limit ignored |
| GET | `/indore/reports/current-without-voltage` | ON | Oct 2025 R/Y/B; `includeTotal=false` (null total + cursor); headers `R/Y/B Current` + `RN/YN/BN Voltage`; unique id / slNo / MSN+time (same meter on different times allowed) |
| GET | `/indore/reports/event-report` | ON | 1 Oct 2025 summary; `Duration (HH:MM)` (hours may exceed 24); no `slNo` column; unique id / eventId / event name (same circle ALL allowed) |
| GET | `/indore/reports/event-detail` | ON | 1–30 Oct 2025 meter events; `Consumer Name`; Duration `H:MM` or `NA`; unique meterLookupId+eventId (same event name on many meters allowed) |
| GET | `/indore/reports/event-restoration` | ON | 1–30 Oct 2025; `S No.` + Occurrence Time `DD-MM-YYYY HH:MM`; unique id / slNo / MSN+time (same MSN on different times allowed) |
| GET | `/indore/reports/consumer-report` | ON | Oct 2025 meter `14080783`: LS / DP / IP grids (`report-type`); Consumer Name vs MSN vs Meter Serial No.; unique dateTime (same MSN on DP/IP is valid); missing/invalid `report-type` falls back to LS; missing meter/dates → 400 |
| GET | `/indore/reports/communication/consumers` | ON | Oct 2025 day / month / range; `Sub Station` + IP/DP/LS counts; day/month often omit total; unique MSN and meterLookupId (same name/DTR allowed) |
| GET | `/indore/reports/communication/dtrs` | ON | Oct 2025 month / day / range; `Sl.No.` + Meter SL No; lat/long nullable; IP/DP/LS can be 0; month often omits total; unique meter serial and dtrNetworkLookupId (same feeder / new DTR code allowed) |

**Known backend exceptions (logged, not failed):** Do not pin live row totals; they drift. Current-without-voltage with `includeTotal=false` leaves `total`/`totalPages` null while rows exist.

---

## ENERGY-AUDITS

| Method | Path | Status | What we check |
|--------|------|--------|----------------|
| GET | `/indore/energy-audit/loss-analysis` | ON | Loss analysis |
| GET | `/indore/energy-audit/loss-analysis-stats` | ON | Stats |
| GET | `/indore/energy-audit/loss-analysis-trends` | ON | Trends |
| GET | `/indore/energy-audit/network-trends` | ON | Network trends |
| GET | `/indore/energy-audit/hourly-loss-report` | ON | Hourly loss |

---

## HES-COMMANDS

GET search/history/info are **ON**. Command **POST** that send meter commands are live in HES specs (they can change meters). Treat as write-adjacent.

| Method | Path | Status | What we check |
|--------|------|--------|----------------|
| GET | `/indore/commands/search-meters` | ON | Search meters for commands |
| GET | `/indore/commands/history` | ON | History |
| GET | `/indore/commands/meters/:serial` | ON | Meter for commands |
| GET | `/indore/commands/meter-info/:serial` | ON | Meter info |
| GET | `/indore/commands/query-meter-job/:jobName` | ON | Job status |
| POST | `/indore/commands/payment` | ON (HES) | Payment command |
| POST | `/indore/commands/metering-mode` | ON (HES) | Mode |
| POST | `/indore/commands/profile-config` | ON (HES) | Profile |
| POST | `/indore/commands/load-curtailment` | ON (HES) | Load curtailment |
| POST | `/indore/commands/demand-config` | ON (HES) | Demand |
| POST | `/indore/commands/billing` | ON (HES) | Billing command |
| POST | `/indore/commands/meter-location` | ON (HES) | Location |
| POST | `/indore/commands/meter-alarms` | ON (HES) | Alarms |
| POST | `/indore/commands/meter-samples` | ON (HES) | Samples |

**Gaps:** decide if HES POSTs should be skipped like MASTER-DATA writes (they can affect live meters).

---

## METER-REPLACEMENT

| Method | Path | Status | What we check |
|--------|------|--------|----------------|
| GET | `/indore/meter-replacement/dashboard-summary` | ON | Summary |
| GET | `/indore/meter-replacement/progress` | ON | Progress |
| GET | `/indore/meter-replacement/consumers/search` | ON | Search |
| GET | `/indore/meter-replacement/consumers/:id` | ON | Consumer detail |
| GET | `/indore/meter-replacement/meters/validate` | ON | Validate serial (also missing serial) |
| GET | `/indore/meter-replacement/submissions/history` | ON | History |
| POST | `/indore/meter-replacement/bulk/validate` | ON | Bulk validate (no create) |
| POST | `/indore/meter-replacement/submissions` | SKIPPED | Create submission e2e + negatives |

---

## REVENUE-PROTECTION

| Method | Path | Status | What we check |
|--------|------|--------|----------------|
| GET | `/indore/revenue-protection/aberrations` | ON | List |
| GET | `/indore/revenue-protection/aberrations/detail` | ON | Detail / cases |
| GET | `/indore/revenue-protection/atr-zone` | ON | ATR zone |
| GET | `/indore/revenue-protection/aberration-entry` | ON | Entry |
| PATCH | `/indore/revenue-protection/aberration-entry/:ivrsNo` | ON | Update entry by IVRS (**writes live data**) |

---

## AUDIT-LOGS (users)

| Method | Path | Status | What we check |
|--------|------|--------|----------------|
| GET | `/indore/users/audit-logs` | ON | User audit list |
| GET | `/indore/users/audit-logs/export` | ON | Export |

---

## USERS-ADMIN / PROFILE / PERMISSIONS

| Method | Path | Status | What we check |
|--------|------|--------|----------------|
| GET | `/indore/users` | ON | User list |
| GET | `/indore/users/:id` | ON | User detail |
| GET | `/indore/users/:id/devices` | ON | Devices |
| GET | `/indore/users/audit-logs` | ON | Admin audit |
| PATCH | `/indore/users/:id` | ON | Update user (**write**) |
| PATCH | `/indore/users/:id/status` | ON | Status (**write**) |
| DELETE | `/indore/users/:id/devices/:deviceId` | ON | Revoke device |
| POST | `/indore/users/:id/force-logout` | ON | Force logout |
| GET | `/indore/permissions/roles` | ON | List roles |
| GET | `/indore/permissions/me/modules` | ON | My modules |
| GET | `/indore/permissions/me/permissions` | ON | My permissions |
| GET | `/indore/permissions/dependency-rules` | ON | Rules |
| POST/PATCH/PUT/DELETE | `/indore/permissions/roles…` | SKIPPED | Create/update/delete role |
| GET | `/indore/permissions/modules` | ON | Modules catalog |
| POST | `/indore/users/me/profile-image/upload-url` | ON | Upload URL |
| PATCH/DELETE | `/indore/users/me/profile-image` | ON | Image update/delete |

**Gaps:** USERS-ADMIN and profile-image writes are **not** in `skippedWriteSpecs`. Skip them if production must stay read-only.

---

## NOTIFICATIONS

| Method | Path | Status | What we check |
|--------|------|--------|----------------|
| POST | `/indore/notifications` | ON | Create notification (**write**) |
| POST | `/indore/notifications/mobile/send` | ON | Mobile send (**can send a real SMS/push**) |

---

## Known gaps (work queue)

Tick when done. Add new rows when you find a missing API or a weak check.

1. [ ] HES command POSTs — skip on production like master-data writes?
2. [ ] CONSUMERS activation PATCH — skip?
3. [ ] REVENUE-PROTECTION PATCH aberration-entry — skip?
4. [ ] USERS-ADMIN PATCH/DELETE/force-logout — skip?
5. [ ] NOTIFICATIONS POST — skip?
6. [ ] Profile-image POST/PATCH/DELETE — skip?
7. [ ] MASTER-DATA: assert `meterType=test` rows are actually test meters
8. [ ] Validate-add / validate-dtr: document required `.env` serials so cases do not skip
9. [ ] Consumer master: unique CID is log-only (multi-meter consumers)
10. [ ] Meter master: duplicate serial / asset mismatch is log-only
11. [ ] Any new `/indore/...` route with no `Api/` file — add a GET smoke first
12. [ ] Billing exchange dedicated API (PDF noted as partial / history proxy)

---

## How to update this file

When you add or skip an API:

1. Add or change the row in the module table.
2. Set Status to ON / SKIPPED / BLOCKED.
3. One line on **what we check**.
4. If something is still missing, add it under **Known gaps**.

Do not list every Excel bulk negative case here — those stay in `Data/*.data.ts` until writes are turned back on.
