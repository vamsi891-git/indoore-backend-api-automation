# Cursor prompt — Consumer Overview **web automation** (full IND-COV coverage)

Same Excel as `c:\Users\Best Infra\Downloads\Consumer_Overview_Test_Coverage.xlsx`
(also `Consumer_Overview_Test_Pack.xlsx`).

This is **Playwright UI** in `ui-automation`, module `CONSUMER-DASHBOARD`.
It is **not** the screenshot GPT prompt and **not** Consumer Master Data (`IND-CMD`).

Copy everything inside the box into a **new Cursor chat** opened on:

`c:\Users\Best Infra\AUTOMATION TESTING\INDOORE\ui-automation`

Attach `Consumer_Overview_Test_Coverage.xlsx`.

---

```
You are a senior Playwright UI automation engineer for Indoore MDMS.

Bring WEB automation to FULL coverage of Consumer Overview Test Coverage Excel
(IND-COV-0001 … IND-COV-0074, 74 cases).

Repo: c:\Users\Best Infra\AUTOMATION TESTING\INDOORE\ui-automation
Module: src/modules/CONSUMER-DASHBOARD/
Excel: Consumer_Overview_Test_Coverage.xlsx  (sheet TEST-CASES)
Screen: Dashboard → Consumer Overview → Default Dashboard
URL: https://indore.bestinfra.app  (or UI_BASE_URL)
Role: Super Admin

This is NOT Master Data → Consumer Data (IND-CMD).
This is NOT Dashboard → DTR Overview (IND-DTO).
This is NOT API-only tests in Indoore_backend_testing.

============================================================
HOW CONSUMER OVERVIEW UI AUTOMATION WORKS (ALREADY BUILT)
============================================================
Read first: CLAUDE.md and existing files:
  locators.ts  api.ts  page.ts  mapper.ts  validators.ts  fixtures.ts
  tests/consumer-overview-kpi.spec.ts
  tests/consumer-overview-donuts.spec.ts
  tests/consumer-overview-category.spec.ts
  tests/consumer-overview-download.spec.ts
  tests/consumer-overview-math.spec.ts

Rules (do not regress):
- Flat module. Static locators. No widget registries. No selector-building functions.
- page.ts = one explicit method per click/read. No raw selectors in specs.
- api.ts = one named capture per SPA call. Match full URL + distinguishing query param.
- Live counts only. Never hardcode 126482 / snapshot baselines.
- Click-through: list pagination.total === live widget count clicked.
- Filtered list URL/chip matches the bucket. NOT the unfiltered full consumer list.
- Zero-count (AGRI, UNKNOWN, Communicating=0): empty list / total 0, never thousands of rows.
- Download icon: file starts AND URL stays on Consumer Overview (no list navigation).
- Auth = existing TOTP worker fixture. No storageState / captcha.
- Known defects: assert CORRECT behaviour, Defect ID in test title (may fail until product fix).
- After edits: npx tsc --noEmit -p tsconfig.json then npm run test:dashboard

Golden click-through rule from the Excel COVER sheet:
Every KPI card, donut SEGMENT, legend row, count pill, percentage, sparkline, trend text,
category BAR, and category LABEL must open related records for THAT bucket.
Center-total: Excel says it MUST drill down (IND-COV-0019/0026/0031/0037). If live UI
treats center as display-only, still write the test; if click is a no-op, FAIL vs Excel
rule (or document product exception with Pass-with-Note only after you prove it).

============================================================
ALREADY AUTOMATED (KEEP — TAG WITH IND-COV IDS IF MISSING)
============================================================
Do not delete these. Add IND-COV-00xx to test titles where missing.

KPI (kpi.spec.ts) — card + value + sparkline:
  IND-COV-0005, 0006, 0007 Consumers
  IND-COV-0008, 0009 (sparkline; MoM TEXT click still missing), 0010, 0011 Prepaid
  IND-COV-0012, 0013 Net Metering

Donuts (donuts.spec.ts) — mostly LEGEND / count / % (not always SEGMENT):
  IND-COV-0015–0018 Meter Status Non-Communicating + Communicating (zero-count empty)
  IND-COV-0021–0022 L&T legend
  IND-COV-0025 Svr Electricals legend/count/%
  IND-COV-0027–0030 Relay Connected + Disconnected legend/count/%
  IND-COV-0032–0033, 0036 1 PH + 3 PH 4 CT legend/count/%

Category (category.spec.ts) — row click:
  IND-COV-0038–0046 all 9 categories including AGRI/UNKNOWN empty (DEF-COV-008 / 009)

Download (download.spec.ts):
  IND-COV-0054–0058 Meter Status, OEM, Relay, Phase, Category downloads (no navigation)

Math (math.spec.ts):
  IND-COV-0061 Postpaid+Prepaid = Consumers
  IND-COV-0062 Meter Status parts = center
  IND-COV-0063 OEM sum = center
  IND-COV-0064 Relay Connected+Disconnected vs center (UI); DEF-COV-001 API includes Permanently Disconnected
  IND-COV-0065 Phase sum
  IND-COV-0066 Category sum = Consumers
  IND-COV-0068-ish cross totals via API buckets vs Consumers

============================================================
STILL REQUIRED FOR FULL 74/74 COVERAGE — IMPLEMENT THESE
============================================================

----- A. PAGE LOAD & LAYOUT (no specs today) -----
IND-COV-0001  Title 'Consumer Overview' + breadcrumb visible. No blank/spinner stuck.
IND-COV-0002  Default Dashboard selected (filled). Live Communication visible but not selected.
IND-COV-0003  All NINE widgets render: Consumers, Postpaid, Prepaid, Net Metering,
              Meter Status, OEM Distribution, Relay Status Overview, Phase Distribution,
              Category Distribution. Titles + values. Download where designed. No overlap.
IND-COV-0004  Pointer cursor on cards, segments, legends, pills, bars, download.
              Page padding stays default cursor.

New spec: tests/consumer-overview-layout.spec.ts

----- B. KPI GAPS -----
IND-COV-0009  Click Postpaid MoM / trend TEXT (not only sparkline) → same Postpaid list.
IND-COV-0014  After any drill-down, Browser Back (and in-app Back if present) returns to
              Default Dashboard with widgets intact.

----- C. DONUT SEGMENTS + CENTER + MISSING BUCKETS -----
Excel requires SEGMENT click as well as legend. Add:
IND-COV-0015  Non-Communicating DONUT SEGMENT (not only legend)
IND-COV-0017  Communicating SEGMENT when count>0; when 0 empty list
IND-COV-0019  Meter Status CENTER TOTAL click → list total = center (Fail if dead)
IND-COV-0020  Meter Status percentage click (if not already in donuts.spec)

IND-COV-0021  L&T DONUT SEGMENT
IND-COV-0023  Linkwell Telesystems SEGMENT
IND-COV-0024  Linkwell legend / count pill
IND-COV-0026  OEM center Total Meters click → all OEMs, total = L&T+Linkwell+Svr

IND-COV-0027  Connected DONUT SEGMENT
IND-COV-0029  Disconnected DONUT SEGMENT
IND-COV-0031  Relay center Total Meters click

IND-COV-0034  3 PH WC DONUT SEGMENT
IND-COV-0035  3 PH WC legend / count pill
IND-COV-0037  Phase center Total Meters click

If a sliver is unclickable, legend must still work (IND-COV-0072). Document in comment.

----- D. CATEGORY GAPS -----
IND-COV-0038  BOTH label AND bar open Residential (today may be one row click only — assert both hit targets)
IND-COV-0047  Category percentage on RES row opens Residential
IND-COV-0071  AGRI=0 AND UNKNOWN=0 both empty (already separate tests; add combined or keep both)

----- E. DRILL-DOWN LIST (no specs today) -----
IND-COV-0048  After OEM L&T click, destination clearly shows filter = L&T
IND-COV-0049  Tiny buckets: Prepaid, 3 PH 4 CT, Svr — list total = widget count; count 1 → exactly 1 row
IND-COV-0050  List columns present (Sl.No., Consumer Name, Address, IVRS, Meter Sl No., Phase, Service Date or live headers). Grid not blank when count>0
IND-COV-0051  Pagination page 2 on Residential: still Residential, total unchanged, S.No. continues
IND-COV-0052  In-app Back / breadcrumb returns to Consumer Overview Default Dashboard
IND-COV-0053  Open EV (or any 1-row) consumer: detail IVRS/MSN matches the list row

New spec: tests/consumer-overview-list.spec.ts

----- F. LIVE COMMUNICATION -----
IND-COV-0059  Toggle Live Communication then back to Default Dashboard. Default restores all nine widgets.
IND-COV-0060  On Live Communication: every visible KPI/graph that shows a count must drill to related records.
              Display-only widgets: skip with reason. Dead count widget: Fail.

New spec: tests/consumer-overview-live-communication.spec.ts

----- G. MATH / TREND STILL OPEN -----
IND-COV-0067  MoM trend colour/sign: negative = decrease + red/pink; zero = No Change + not red.
              Sparkline direction matches text. Live numbers, not snapshot.
IND-COV-0068  Cross-widget: Consumers = Meter Status Total = OEM Total = Relay Total = Phase Total.
              Any mismatch = Fail (this is the Excel rule; if Relay UI omits Permanently Disconnected,
              keep DEF-COV-001 as the intentional failing assert for API/UI gap).

----- H. EDGE / SMOKE -----
IND-COV-0069  Double-click Postpaid: one navigation only. No duplicate tab / error / blank page.
IND-COV-0070  Download vs chart body: download never opens records; chart/legend never starts a download.
IND-COV-0072  Tiny slivers: legend always works (Svr, 3 PH 4 CT, EV, Communicating=0).
IND-COV-0073  Idle ~2 minutes then Prepaid click still navigates, or clear session-expiry login — not silent dead click.
              Mark slow; do not skip without reason.
IND-COV-0074  Smoke: one click per widget in order —
              Consumers, Postpaid, Prepaid, Net Metering, Meter Status Non-Communicating,
              OEM L&T, Relay Connected, Phase 1 PH, Category RES.
              All nine open related records.

New spec: tests/consumer-overview-edge.spec.ts  +  consumer-overview-smoke.spec.ts

============================================================
COVERAGE MATRIX (EVERY Y FROM EXCEL COVERAGE-MATRIX)
============================================================
For each widget execute at least once:
  Entire card / row | numeric value / count pill | sparkline / trend | donut segment / bar |
  legend / label | percentage | center total | download (EXP) | zero-count path

Widgets:
  Consumers, Postpaid, Prepaid, Net Metering,
  Meter Status, OEM, Relay, Phase, Category (RES…UNKNOWN including 0)

If a cell is Y in Excel and there is no test, that is a gap — add it.
If a cell is EXP, assert export + no navigation.
If a cell is N/A, do not invent a click.

============================================================
HOW TO WORK
============================================================
1. Map each IND-COV-0001…0074 to an existing test title OR a new test. Put the ID in the title:
     test('IND-COV-0019 Meter Status center total opens related records', ...)
2. Do not rewrite working locators unless a live DOM inspect proves they are wrong.
3. Prefer extending page.ts with clickMeterStatusNonCommunicatingSegment() etc.
4. Capture the list GET after click; compare pagination.total to the number read from the widget BEFORE click.
5. Zero-count: use expectZeroCountShowsEmptyState (already in validators).
6. test.skip only when the control is truly absent; include reason.
7. Do not add MASTER-DATA or DTR-DETAIL modules in this task.

Deliverable when done:
- Table: IND-COV-0001…0074 → spec file + status (Automated / New / Skip+reason)
- 74/74 accounted for
- npm run test:dashboard command
- tsc clean
```
