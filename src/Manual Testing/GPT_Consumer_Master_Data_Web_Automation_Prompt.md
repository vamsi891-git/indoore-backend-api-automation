# Cursor prompt — Consumer Master Data **web automation**

Same job as `Consumer_Overview_Test_Coverage.xlsx` → Playwright module `CONSUMER-DASHBOARD`.
This pack is `Consumer_Master_Data_Test_Pack.xlsx` → new Playwright modules (list + consumer detail + DTR detail).

Copy everything inside the box below into a **new Cursor chat** opened on:

`c:\Users\Best Infra\AUTOMATION TESTING\INDOORE\ui-automation`

Attach `Consumer_Master_Data_Test_Pack.xlsx`.
Do **not** use the screenshot-execution GPT prompt. This is code in `ui-automation`.

It is **not** Dashboard → Consumer Overview (`IND-COV`) and **not** Dashboard → DTR Overview fleet (`IND-DTO`).

---

```
You are a senior Playwright UI automation engineer for Indoore MDMS.

Mirror how Consumer_Overview_Test_Coverage.xlsx was automated in
src/modules/CONSUMER-DASHBOARD/ (click → live UI count === captured SPA API,
download does not navigate, no hardcoded snapshot totals, flat locators.ts/page.ts/api.ts/tests).

Now implement the SAME kind of WEB automation for Consumer Master Data pack
IND-CMD-0001 … IND-CMD-0120 (Excel: Consumer_Master_Data_Test_Pack.xlsx).
One Excel pack. Three screens. Follow CONSUMER-DASHBOARD module shape exactly.

Do not write API-only tests (those already live in Indoore_backend_testing).
Do not query Postgres.
Do not hardcode screenshot totals (126743, 0.2 kVA, etc.). Read live UI / captured API values.

============================================================
REPOS AND RULES
============================================================
Repo: AUTOMATION TESTING/INDOORE/ui-automation
Read first: CLAUDE.md and src/modules/CONSUMER-DASHBOARD/ (pattern to copy).

Every NEW module must be flat:
  locators.ts   — hand-written selectors from live DOM (TODO: confirm from DOM if unverified)
  api.ts        — one capture function per real SPA network call (exact URL + distinguishing query param)
  page.ts       — one method per user action; NO raw selectors inline
  mapper.ts     — API JSON → counts / rows
  validators.ts — UI ↔ captured-API asserts
  test-data.ts  — search strings, file paths, period names (no hardcoded live totals)
  fixtures.ts   — page object(s) for this module
  tests/        — checklist specs; no selectors or capture logic inline

Conventions (non-negotiable):
- Locators are static. No selector-building functions. No widget registries.
- API capture is explicit. Never a generic captureDrilldownAfter(fragment).
- Counts are live at runtime.
- Auth = existing worker TOTP fixture. Do not add storageState / captcha.
- Download icons: assert file download AND URL did not navigate.
- Known product defects: assert CORRECT behaviour and put Defect ID in the test title
  (DEF-CMD-001 timestamp mismatch, DEF-CMD-002 Restored At blank). Tests may fail until the product is fixed.
- Prefer getByRole / accessible names where the DOM allows; otherwise CSS from live inspect.
- After locators/api/page changes: npx tsc --noEmit -p tsconfig.json then run the new specs headed once.

App:
  URL: https://indore.bestinfra.app  (or UI_BASE_URL)
  Role: Super Admin
  Excel: Consumer_Master_Data_Test_Pack.xlsx  sheet TEST-CASES

============================================================
SCREENS (ALL IN SCOPE — DO NOT SPLIT INTO A SECOND PACK)
============================================================
1) Consumer Master Data list
   Sidebar: Master Data → Consumer Data
   Path: typically /master-data/consumers  (confirm live)
   Title: Consumer Data
   Breadcrumb: Master Data / Consumer Data

2) Consumer Dashboard (individual)
   Open via row View (eye) on the list
   Path: /consumers/:consumerId
   This is NOT Dashboard → Consumer Overview (IND-COV).

3) DTR Dashboard (individual)
   Open via DTR Code from the same list (link or /dtr/{code})
   Path: /dtr/:dtrCode
   This is NOT Dashboard → DTR Overview fleet (IND-DTO).

============================================================
GOLDEN RULES
============================================================
LIST
- Search / Apply Filters must change pagination total and row contents (AND of criteria).
- Reset Filters clears search, hierarchy, dropdowns, and returns radio to All.
- Empty SEARCH copy ≠ empty FILTER copy:
    search  → "No results found"
    filters → "No data available"
- Header Download exports the FILTERED dataset, not page 1 only, and does not navigate.
- View (eye) opens THAT consumer’s dashboard (IVRS + meter match the row).
- DTR Code opens THAT DTR’s dashboard (code + capacity match the row), never Consumer Dashboard.

LEDGER (Bulk Upload)
- Validate File does NOT insert or update master rows.
- .xlsx only, max 200 MB. csv/pdf/xls rejected. No file → Validate disabled.
- Merge (default): blank cells do not preview clearing master values.
- Override: blank cells may preview clearing nullable fields.

CONSUMER DASHBOARD
- 12 KPI cards render. Missing history footer = "No previous-month data" (not NaN).
- Negative PF must keep its sign (e.g. -0.97).
- Unused phases use "--", not 0.00, not copied from R-Phase.
- Live Load center total = Active + Apparent + Reactive.
- Energy Consumption and Energy Flow period menus: Hourly, Daily, Weekly, Monthly, Yearly.
  Changing period must reload THAT chart (not leave stale series). Empty → named empty state.
- Chart/header Download = file + no navigation.
- Meter Events: Duration = Restored At − Occurred On for Restored rows.
  Pending: Restored At is "—" and Duration 0s (or live timer).
- Status filter Restored / Pending / Unknown. Search + Event + Status + Date Range AND together.
- Download of events matches the FILTERED table.

DTR DASHBOARD
- Same widget family as consumer: Real-time Power Metrics, Energy Consumption, Energy Flow, Meter Events.
- Plus DTR-only: statistic cards (Total Consumer, Power On, Power Off, Status), Power Triangle, capacity gauges.
- Events/meter on this page belong to THIS DTR, not the consumer you just left (unless that meter is on this DTR).
- Period options must match consumer (five values).

PARITY
- Master row IVRS / Meter SL No / DTR Code / Circle-Division-Zone-Feeder match both dashboards.
- Browser Back from either dashboard returns to Consumer Data WITH filters still applied.

============================================================
MODULES TO CREATE
============================================================
src/modules/CONSUMER-MASTER-DATA/     list + Ledger + columns + download
src/modules/CONSUMER-DETAIL/          individual consumer dashboard
src/modules/DTR-DETAIL/               individual DTR dashboard (from list DTR Code)

Add npm scripts:
  test:consumer-master
  test:consumer-detail
  test:dtr-detail

Inspect live DOM before locking locators. Use Super Admin. Confirm paths from the address bar.

============================================================
WHAT TO AUTOMATE (MAPPED TO IND-CMD)
P0 / P1 first. Then P2. Skip nothing in P0–P1 without writing a skip+reason.
============================================================

----- P0  LIST CORE  (CONSUMER-MASTER-DATA) -----
IND-CMD-0001  Page title + breadcrumb Consumer Data / Master Data
IND-CMD-0002  Bulk Upload + Download buttons visible
IND-CMD-0003  Advanced Filters ON with all controls
IND-CMD-0004  Grid loads; footer Showing 1-N of {live total}; default page size
IND-CMD-0006  Search by name (live first-row name, not hardcoded Babulal)
IND-CMD-0007  Search by IVRS
IND-CMD-0008  Search by consumer CID
IND-CMD-0009  Search by meter serial
IND-CMD-0010  Unknown keyword → "No results found" + Clear Search
IND-CMD-0016  Apply hierarchy; every visible row matches; total is filtered
IND-CMD-0025  Combined filters AND
IND-CMD-0027  Online + Apply → communicating subset
IND-CMD-0028  Offline + Apply → non-communicating subset
IND-CMD-0029  Reset Filters restores unfiltered total + All radio + empty search
IND-CMD-0031  Impossible combo → "No data available" (not search empty copy)
IND-CMD-0032  Page 2: S.No continues; rows differ from page 1
IND-CMD-0034  Change page size; filter remains
IND-CMD-0038  View (eye) → /consumers/:id header name+IVRS match row
IND-CMD-0063  Header Download of filtered set (file; not 10 rows; no navigation)

Assert UI pagination.total === captured GET /indore/master-data/consumer-master-data pagination.total
(query params must include the same q / hierarchy / meterType / communicationStatus).

----- P0  CONSUMER DASHBOARD  (CONSUMER-DETAIL) -----
IND-CMD-0066  Header: name, IVRS badge, status, breadcrumb
IND-CMD-0070  Invalid /consumers/not-a-real-id → empty state, not crash
IND-CMD-0072  All 12 KPI titles render (values live)
IND-CMD-0073  Missing history footer text
IND-CMD-0074  Overall PF sign preserved
IND-CMD-0077  Resolved/Pending KPI vs Meter Events status counts (same window or document mismatch)
IND-CMD-0078  Real-Time Power Metrics: meter serial = list meter; R-Phase populated
IND-CMD-0079  Y/B unused phases are "--"
IND-CMD-0080  Live Load total = Active+Apparent+Reactive
IND-CMD-0081  DEF-CMD-001: Real-Time timestamp vs Live Load last communication
              Assert they match (or are labelled as different metrics). Title includes DEF-CMD-001.
IND-CMD-0083  Energy Consumption Hourly: subtitle matches x-axis
IND-CMD-0084  Switch Hourly→Daily→Weekly→Monthly→Yearly; chart/subtitle change; stale Hourly series = fail
IND-CMD-0087  Energy Flow four legend series; export at 0 still a series
IND-CMD-0088  Energy Flow period independent of Energy Consumption
IND-CMD-0091  Meter Events table; meter serial matches header
IND-CMD-0094  Status Restored / Pending / Unknown
IND-CMD-0096  Duration math; Pending Restored At = —
IND-CMD-0096 / 0091  DEF-CMD-002: Restored row must have Restored At.
              Title includes DEF-CMD-002.

----- P0  DTR DASHBOARD  (DTR-DETAIL) -----
IND-CMD-0104  DTR Code from list opens /dtr/{code} for THAT code
IND-CMD-0106  Unknown /dtr/NOTAREALDTR999 empty state
IND-CMD-0107  DTR Capacity on list = gauge/stats on DTR page
IND-CMD-0108  Statistic cards render (Total Consumer, Power On, Power Off, Status)
IND-CMD-0109  Real-time Power Metrics present; missing phases "--"
IND-CMD-0111  Energy Consumption five periods
IND-CMD-0112  Meter Events toolbar; rows are this DTR’s meters
IND-CMD-0116  Parity: list meter/IVRS/DTR = consumer page = DTR page
IND-CMD-0118  Back from consumer page and from DTR page keeps list filters
IND-CMD-0120  Smoke: search → consumer widgets → back → DTR widgets → download each page

----- P1  LIST FILTERS / COLUMNS / LEDGER -----
IND-CMD-0011  Special chars in search do not crash
IND-CMD-0012  Case-insensitive partial name
IND-CMD-0014  Trim leading/trailing spaces
IND-CMD-0015  Hierarchy Type enables Level 1
IND-CMD-0017  Changing Level 1 clears Level 2
IND-CMD-0018  Meter Type Live / Test / All
IND-CMD-0019  Meter Phase
IND-CMD-0020  Connection Status
IND-CMD-0021  Category
IND-CMD-0022  Device Manufacturer
IND-CMD-0023  Payment Contract
IND-CMD-0026  All radio default
IND-CMD-0030  Advanced Filters toggle hides panel; grid remains
IND-CMD-0033  Last page loads
IND-CMD-0035  Horizontal scroll; Consumer Name stays if pinned
IND-CMD-0039  Edit opens same consumer
IND-CMD-0040  View disabled when no id (skip if every row has id)
IND-CMD-0041  Row selection export uses selection
IND-CMD-0042–0049  Manage Table Columns:
                  open modal, Consumer Name locked, Hide/Show, drag reorder,
                  Cancel/X discard, Reset defaults, cannot hide all locked columns
IND-CMD-0050  Bulk Upload opens Ledger
IND-CMD-0051  Download Template → Ledger Template.xlsx
IND-CMD-0052  Merge selected by default
IND-CMD-0053  Override selectable
IND-CMD-0054  Valid .xlsx enables Validate File
IND-CMD-0055  Validate does not change list total
IND-CMD-0056  Validate disabled with no file
IND-CMD-0057  Reject csv / pdf / xls
IND-CMD-0058  Reject > 200 MB (use a generated temp file or skip with reason if too heavy)
IND-CMD-0059  Empty / wrong headers → validation errors, no write
IND-CMD-0060  Same blank-cell file: Merge vs Override preview differs
IND-CMD-0062  X close does not write
IND-CMD-0064  Download on empty search is safe (disabled or header-only file)

----- P1  CONSUMER DASHBOARD REST -----
IND-CMD-0067  View interval counts toggle
IND-CMD-0068  Header Download modal → Excel; Cancel safe
IND-CMD-0069  Open Profile
IND-CMD-0071  Disconnected badge if such a row exists (else skip)
IND-CMD-0075  Daily vs Monthly kWh footers
IND-CMD-0076  ₹0 and Bill Status Unknown render
IND-CMD-0082  Live Load download, no navigation
IND-CMD-0085  Energy Consumption download for selected period
IND-CMD-0086  Small kWh bars still visible
IND-CMD-0089  Energy Flow k-suffix axis
IND-CMD-0090  Energy Flow download
IND-CMD-0092  Search Events by name and code
IND-CMD-0093  Select Event
IND-CMD-0095  Date range + Clear
IND-CMD-0097  Events download = filtered rows
IND-CMD-0098  Events no-match search empty
IND-CMD-0099  Future date range empty (not unfiltered)
IND-CMD-0100–0103  Events Manage Columns (Show Source, Hide Event Name, Reset)

----- P1  DTR DASHBOARD REST -----
IND-CMD-0105  New DTR Code vs DTR Code
IND-CMD-0110  Power Triangle + Energy Flow period change
IND-CMD-0113  DTR page Download
IND-CMD-0114  Power On / Off vs Status consistency
IND-CMD-0115  Capacity gauges + download
IND-CMD-0117  Hierarchy strings match profile
IND-CMD-0119  Period option set identical on consumer vs DTR

----- P2  (still automate; lower flake risk / cosmetic) -----
IND-CMD-0005  Pointer cursor on interactive controls
IND-CMD-0013  Names with W/o and punctuation
IND-CMD-0024  Apply with defaults does not error
IND-CMD-0036  Truncated cell tooltip
IND-CMD-0037  Copy icon on code cells
IND-CMD-0061  Large-ledger note visible (assert text; do not upload 100k rows in CI)
IND-CMD-0065  Full-grid export starts a job / stream (assert UI feedback, not 126k parse)

============================================================
SUGGESTED SPEC FILES (CHECKLIST NAMES)
============================================================
CONSUMER-MASTER-DATA/tests/
  consumer-master-load.spec.ts
  consumer-master-search.spec.ts
  consumer-master-filters.spec.ts
  consumer-master-pagination.spec.ts
  consumer-master-columns.spec.ts
  consumer-master-ledger.spec.ts
  consumer-master-download.spec.ts
  consumer-master-navigation.spec.ts   // View, Edit, DTR Code, Back keeps filters

CONSUMER-DETAIL/tests/
  consumer-detail-header.spec.ts
  consumer-detail-kpis.spec.ts
  consumer-detail-realtime.spec.ts     // includes DEF-CMD-001
  consumer-detail-energy.spec.ts
  consumer-detail-events.spec.ts       // includes DEF-CMD-002
  consumer-detail-download.spec.ts
  consumer-detail-invalid-route.spec.ts

DTR-DETAIL/tests/
  dtr-detail-from-master.spec.ts
  dtr-detail-stats.spec.ts
  dtr-detail-realtime.spec.ts
  dtr-detail-energy.spec.ts
  dtr-detail-events.spec.ts
  dtr-detail-download.spec.ts
  dtr-detail-parity.spec.ts            // IND-CMD-0116–0120

============================================================
TEST DATA (LIVE, NOT SNAPSHOT)
============================================================
Do NOT hardcode 126743 / N3968028469 / 88017671 / MM521 as expected totals.

At runtime:
- Read first visible row from the grid (name, IVRS, meter, DTR code, capacity, circle).
- Use THAT row as the drill-down fixture.
- Search tests: use a unique token from that row + a guaranteed-miss token like ZZZNOMATCH999.
- Ledger: keep a tiny valid .xlsx fixture in test-data (or generate with exceljs). Never commit a 200 MB file.
- Period tests: assert subtitle/axis CHANGE, not a specific date.

Snapshot 09-Sep-2026 is only for human comments / skip context.

============================================================
NETWORK CAPTURE (EXAMPLES — CONFIRM LIVE)
============================================================
List:     GET .../indore/master-data/consumer-master-data?page=&limit=&q=&meterType=&...
Lookups:  hierarchy / connection-status / category / manufacturer / payment-contract
Export:   consumer master export job (assert request fired + download)
Ledger:   validate endpoint (assert no write; list total unchanged)
Consumer: detail, KPIs, real-time power, live load, energy graph, energy flow, events
DTR:      statistics, real-time power, power triangle, energy consumption, energy flow, events, capacity

Match URL + distinguishing query param. If two calls share a path, do not use a loose includes().

============================================================
HOW TO WORK
============================================================
1. Inspect live pages and write locators.ts (TODO comment if a selector is guessed).
2. Implement page.ts methods named after the click (clickApplyFilters, clickViewOnRow, selectEnergyPeriod('daily')).
3. Implement api.ts captures for the calls those actions trigger.
4. Write specs that call page methods + validators only.
5. Tag tests with the IND-CMD id in the title, e.g.
     test('IND-CMD-0029 Reset Filters restores All and unfiltered total', ...)
6. Run tsc, then headed specs for P0, then npm scripts.
7. If a control is missing on live UI, skip with test.skip(true, 'control not rendered: …') — do not delete the case.
8. Do not automate Dashboard → Consumer Overview or Dashboard → DTR Overview here.

Start by scaffolding the three modules and delivering P0 specs green (except DEF-CMD-001 / DEF-CMD-002 which may fail on purpose).
Then P1, then P2.

When done, list: spec files added, IND-CMD ids covered, ids skipped with reason, commands to run.
```
