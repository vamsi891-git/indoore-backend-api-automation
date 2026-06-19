# MDM Presentation PDF vs API Automation Framework — Gap Analysis

**Source PDF:** `templates/MDM Presentation_23.12.2025.pdf` (131 slides, 23-Dec-2025)  
**Compared against:** Playwright API automation in `src/modules/*/tests/*.spec.ts`

**Scope:** Framework only — manual testing / Excel workbook **not** included.

> The PDF is a screenshot deck. Text extraction yields **slide titles only** (no steps or API paths). Mapping is at **feature/screen → automation module** level.

---

## Summary

| Metric | Count |
|--------|-------|
| PDF named screens | ~95 |
| Automation modules | 22 |
| Spec files | 127 |
| **Fully covered** | ~42 |
| **Partially covered** | ~18 |
| **Not covered** | ~35 |

**Framework coverage (rough): ~63%** of PDF screens have at least one API spec. Core MDM flows (auth, dashboard, master data, DTRs, consumers, billing, MIS, HES commands, energy audits) are well represented. Large report families (SAIFI/SAIDI, Collection Reports, Aberration, Billing Exchange) have **no module**.

---

## Automation modules (framework inventory)

| Module | Specs | PDF area |
|--------|-------|----------|
| AUTH | 11 | Login, session, invite |
| DASHBOARD | 5 | Home / overview widgets |
| OVERALL-DASHBOARD | 2 | Overall overview |
| MASTER-DATA | 4 | Consumer / DTR / Feeder / Substation master |
| DTRS | 7 | DTR overview, events, daily analysis |
| FEEDER | 4 | Feeder profile, consumption, alerts |
| CONSUMERS | 13 | Consumer profile, load, events, billing |
| CONSUMPTION | 5 | Daily / pattern / net meter |
| BILLING | 2 | Day-wise and monthly billing |
| COMMERICIAL-ANALYSIS | 6 | Commercial summary, PF, MD, LF, compare, pattern |
| TECHNICAL-ANALYSIS | 2 | Technical summary and analysis |
| MIS-DASHBOARD | 16 | Communication, event data, priority |
| ENERGY-AUDITS | 7 | Loss analysis, hourly loss, network trends |
| HES-COMMANDS | 14 | Meter commands, config, history, samples |
| REPORTS | 3 | Event report, event detail, DTR billing |
| NOTIFICATIONS | 2 | Web + mobile notifications |
| ASSET-MANAGEMENT | 3 | Org / network hierarchy, DTR lookup |
| UTILS-LOOKUP | 14 | Search and dropdown lookups |
| USERS-ADMIN | 3 | User management, security, devices |
| ROLE-PERMISSIONS | 1 | Role permission CRUD |
| MODULES-PERMISSIONS | 1 | Module permission CRUD |
| AUDIT-LOGS | 2 | Audit list and export |

---

## Slide-by-slide mapping (framework only)

Legend: ✅ Covered | ⚠️ Partial | ❌ Missing

### Auth & Home

| PDF Slide | Framework module / spec |
|-----------|-------------------------|
| MDM Portal Login | ✅ `AUTH` — login, refresh, invite flows |
| MDM Home Screen | ⚠️ `DASHBOARD` — metrics, DTR summary |
| Static Overview Dashboard | ⚠️ `DASHBOARD` + `OVERALL-DASHBOARD` |
| Overall Overview | ✅ `OVERALL-DASHBOARD` — dashboardmetrics, dtrcommunication |

### Master Data & DTR

| PDF Slide | Framework module / spec |
|-----------|-------------------------|
| MDM Consumer Master Data | ✅ `MASTER-DATA/consumer-master.spec.ts` |
| DTR Overview / DTR Overview Detail | ✅ `DTRS` — profile, statistics, feeders, events |

### HES / Meter Commands

| PDF Slide | Framework module / spec |
|-----------|-------------------------|
| Meter Command — Single Meter | ✅ `HES-COMMANDS` — meter, meter-info, query-meter-job, payment, billing |
| Meter Command — Bulk Meter | ⚠️ search-meters, history; no explicit bulk-only spec |
| Meter Command Configuration | ✅ profile-config, demand-config, metering-mode, load-curtailment |

### Billing Exchange & Notifications

| PDF Slide | Framework module / spec |
|-----------|-------------------------|
| Billing Exchange Report — valid | ❌ No module |
| Billing Exchange Report — invalid | ❌ No module |
| Mobile Notification | ✅ `NOTIFICATIONS/notificationsmobile.spec.ts` |

### Energy Audits / Loss Analysis

| PDF Slide | Framework module / spec |
|-----------|-------------------------|
| Network Loss Analysis — Billing | ✅ `ENERGY-AUDITS/loss-analysis-*.spec.ts` |
| Consumption Compare — Hourly Loss Report | ✅ `ENERGY-AUDITS/hourly-loss-report-*.spec.ts` |
| DTR IP Data / LS Data / DP Data | ✅ `ENERGY-AUDITS` loss-analysis by data type |

### MIS Dashboards

| PDF Slide | Framework module / spec |
|-----------|-------------------------|
| MIS Dashboard | ✅ `MIS-DASHBOARD` (16 specs) |
| Communication Dashboard | ✅ communication, communicationstats |
| Live Communication Dashboard | ⚠️ communication stats only; no live-specific spec |
| Communication Dashboard Monthly | ⚠️ No dedicated monthly spec |
| Event Data Phase wise | ✅ eventdatavoltage, eventdatacurrent, eventdatapower |
| Event Data Category wise | ✅ event-classification |
| Event Data Priority Wise | ✅ eventpriority 1–6, priority-overview |
| Event — No Restoration | ⚠️ eventdatanonrollover |
| MIS Download | ❌ No export/download API test |

### Commercial Analysis (22 PDF sub-screens)

| PDF Slide | Framework module / spec |
|-----------|-------------------------|
| Commercial Analysis (summary) | ✅ commercial-summary.spec.ts |
| PF Violation | ✅ powerfactor.spec.ts |
| MD > CD Last Three Month | ✅ mdanalysis.spec.ts (1 variant) |
| Sanction Load Violation | ⚠️ Data in `mdanalysis.data.ts`; **not executed in spec** |
| LF < 5% / LF < 100% | ⚠️ loadfactor.spec.ts — `operator: lt`, `months: 1` only |
| LF < 5% Last 3/6 Month | ⚠️ `months` param exists; not tested |
| Consumption Compare Last Month | ✅ consumptioncompare.spec.ts |
| Consumption Compare Same Month Last Year | ⚠️ Data exists; **not in spec** |
| Abnormal Low Consumption | ⚠️ Data exists; **not in spec** |
| Zero Consumption (1/3/6/9/12/>12 month) | ⚠️ consumptionpattern — `zero`, `months: 1` only |
| 100-unit kWh (3/6/9 month) | ⚠️ threshold param; not all month windows |
| LAST SIX MONTH 50% AVG < Initial | ❌ No spec |
| Night Zero Consumption | ❌ No spec |
| Night consumption <= 10% of Day | ❌ No spec |

### Technical & Techno-Commercial

| PDF Slide | Framework module / spec |
|-----------|-------------------------|
| Technical Analysis | ✅ TECHNICAL-ANALYSIS (2 specs) |
| Techno Commercial Analysis | ❌ No module |

### Reports — Communication & Events

| PDF Slide | Framework module / spec |
|-----------|-------------------------|
| MIS Report | ⚠️ `REPORTS` — eventreport, eventdetail, dtrbilling |
| Communication — Consumer Detail / IP / DP / LS | ⚠️ `CONSUMERS` + `HES-COMMANDS` meter-samples partial |
| Event — Consumer Event / Detail | ✅ eventreport, eventdetail |
| Event — DT Wise interruption Detail | ❌ No dedicated spec |

### DTR Operations

| PDF Slide | Framework module / spec |
|-----------|-------------------------|
| DTR Communication | ✅ DASHBOARD/OVERALL dtrcommunication |
| DTR Event — Interruption / Detail | ✅ DTRS/dtrevents |
| DTR Hourly Load — Actual Load / Load % / Consumption | ⚠️ CONSUMERS/liveloadprofile partial |
| DTR Daily Analysis — Loading / Unbalance / Summary | ⚠️ dtrdailythresholdchart, dtrcapacitygauge |

### Consumption, Billing, Pattern

| PDF Slide | Framework module / spec |
|-----------|-------------------------|
| Consumer Consumption Hourly / Daily / Monthly | ⚠️ dailyconsumption; hourly/monthly gaps |
| Night Zero Consumption (00:00–06:00) | ❌ No spec |
| Consumption Monthly Net Meter | ✅ monthlynetmeter |
| Billing — Day wise / Monthly | ✅ daywisebilling, billingdata |
| Pattern — Last 3 Months / Yearly / Comparison | ✅ lastthreemonths, yearly, comparison |

### Consumer Data & Collection Reports

| PDF Slide | Framework module / spec |
|-----------|-------------------------|
| Consumer Data — Min/Max Voltage | ⚠️ CONSUMERS/powerquality |
| Consumer Data — Current Without Voltage | ❌ No spec |
| Collection of Report (11 variants) | ❌ **No module** |

### Prepaid, Aberration, SAIFI/SAIDI

| PDF Slide | Framework module / spec |
|-----------|-------------------------|
| Prepaid Summary | ⚠️ HES payment command only; no summary report API |
| Aberration Report / Detail / Entry / ATR Zone | ❌ No module |
| SAIFI / SAIDI (7 report variants) | ❌ **No module** |

### In framework but not prominent in PDF

| Module | Purpose |
|--------|---------|
| USERS-ADMIN | User management, security, devices |
| ROLE-PERMISSIONS / MODULES-PERMISSIONS | Access control |
| AUDIT-LOGS | Audit list and export |
| ASSET-MANAGEMENT / UTILS-LOOKUP | Hierarchy and search APIs |
| FEEDER | Feeder profile, electrical params, daily consumption |

---

## Priority gaps (framework only)

### P0 — No automation module

1. **SAIFI / SAIDI reports** (PDF slides 124–130) — 7 report types
2. **Collection of Reports** (slides 94–104) — 11 meter/alarm analysis reports
3. **Billing Exchange Report** valid/invalid (slides 11–12)
4. **Aberration Report / Entry / ATR** (slides 118–122)
5. **Techno Commercial Analysis** (slide 55)

### P1 — Module exists but coverage is thin

1. **COMMERICIAL-ANALYSIS** — 22 PDF sub-screens; only ~6 specs; many data variants not executed (Sanction Load, Same Month Last Year, Abnormal Low, zero 3/6/9/12 months, LF 3/6 months, night rules)
2. **MIS Download** — no export API test
3. **Prepaid Summary** — only HES payment command, not prepaid report
4. **Live vs Monthly Communication Dashboard** — no distinct specs
5. **Consumer hourly consumption**, **Current Without Voltage**
6. **Event — DT Wise interruption Detail**

### P2 — Quick wins inside existing modules

Expand specs using data already in `src/modules/COMMERICIAL-ANALYSIS/Data/`:

- `consumptioncompare.data.ts` — add tests for Same Month Last Year, Abnormal Low
- `mdanalysis.data.ts` — add Sanction Load Violation, Improper MD
- `consumptionpattern.data.ts` — add zero pattern with months 3, 6, 9, 12
- `loadfactor.api.ts` — add months 3, 6 and operator `gt` (LF > 100%)

---

## Recommended next steps (framework)

1. **New modules** (need backend endpoints): SAIFI-SAIDI, COLLECTION-REPORTS, BILLING-EXCHANGE, ABERRATION, TECHNO-COMMERCIAL
2. **Expand COMMERICIAL-ANALYSIS** — parameterized specs for all PDF commercial sub-types
3. **Add CONSUMPTION** specs for hourly consumption and night-zero rules if APIs exist
4. **Add REPORTS/MIS export** spec once download endpoint is confirmed

---

*PDF extract: `reports/mdm-pdf-extract.txt` | Automation root: `src/modules/`*
