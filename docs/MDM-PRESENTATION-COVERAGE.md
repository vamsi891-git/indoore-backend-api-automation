# MDM Presentation vs Framework Coverage

**Reference PDF:** `MDM Presentation_23.12.2025.pdf` (131 pages, PowerPoint export, author Sandeep Jatwa)  
**Location used for this review:** `C:\Users\Best Infra\Downloads\MDM Presentation_23.12.2025.pdf`  
**Last reviewed:** 25 July 2026  

**Related code map:** `scripts/data/mdm-pdf-slide-api-map.mjs` (slide title → `/indore/...` endpoint rules)

---

## 1. Did we follow this PDF?

| Question | Answer |
|----------|--------|
| Was the PDF used as the **business/module catalog** for what MDM does? | **Yes** — screens and report families in the deck align with framework modules and the slide→API map. |
| Did we automate **every UI screen / chart** shown in the PDF? | **No** — and we should not. This repo is **API automation**, not Playwright UI. |
| Did we automate the **backend APIs that feed** those screens? | **Mostly yes** for major families; **partial** for some report variants; **gaps** where no stable `/indore` API is mapped (or not implemented yet). |
| Is every PDF slide title covered 1:1 by a dedicated API spec? | **No** — many Commercial / MIS slides are **parameter variants** of the same report APIs (already covered by type/threshold params). |

### Verdict

> **We followed the PDF as the product reference for *what to cover via APIs*.**  
> We did **not** treat the PDF as a UI test script.  
> Framework alignment with the PDF is **strong at module/family level**, with known gaps called out below.

---

## 2. How to read coverage labels

| Label | Meaning |
|-------|---------|
| **Followed (API)** | Dedicated module/specs exercise the API behind this screen family |
| **Followed (param variant)** | Same parent API; PDF slide is a filter/type — covered by params in commercial/MIS/consumption tests |
| **Partial** | Related API exists; slide may use a proxy endpoint or incomplete dedicated coverage |
| **Gap** | No clear automated `/indore` coverage found for this PDF topic |
| **UI / N/A** | Login chrome, blank pages, pure layout — out of API scope |

---

## 3. Slide-by-slide coverage (from PDF titles)

### 3.1 Portal & overview

| PDF screen | Framework | Followed? |
|------------|-----------|-----------|
| MDM Portal Login | AUTH (login in `global.setup`) | **Followed (API)** — auth warmup, not UI form |
| MDM Home Screen | DASHBOARD / OVERALL-DASHBOARD | **Partial** — metrics APIs, not full home layout |
| Static Overview Dashboard | DASHBOARD `/indore/dashboard/metrics` | **Followed (API)** |
| Overall Overview | DASHBOARD / OVERALL-DASHBOARD | **Followed (API)** |

### 3.2 Master / network configuration

| PDF screen | Framework | Followed? |
|------------|-----------|-----------|
| MDM Consumer Master Data | MASTER-DATA | **Followed (API)** |
| DTR Overview Detail / DTR Overview | DTRS, ASSET-MANAGEMENT, DASHBOARD | **Followed (API)** |

### 3.3 Meter commands & billing exchange

| PDF screen | Framework | Followed? |
|------------|-----------|-----------|
| Meter Command Request — Single / Bulk / Configuration | HES-COMMANDS | **Followed (API)** (+ async E2E) |
| Billing Exchange Report — valid / invalid | HES-COMMANDS history proxy | **Partial** — map notes *no dedicated Billing Exchange `/indore` endpoint*; history used as proxy |

### 3.4 Notifications & energy audit

| PDF screen | Framework | Followed? |
|------------|-----------|-----------|
| Mobile Notification | NOTIFICATIONS | **Followed (API)** |
| Network Loss Analysis — Billing | ENERGY-AUDITS `/energy-audit/loss-analysis` | **Followed (API)** |
| Consumption Compare — Hourly Loss Report | ENERGY-AUDITS `/hourly-loss-report` | **Followed (API)** |

### 3.5 MIS & communication dashboards

| PDF screen | Framework | Followed? |
|------------|-----------|-----------|
| MIS Dashboard | MIS-DASHBOARD | **Followed (API)** |
| Communication Dashboard / Monthly / Live | MIS-DASHBOARD communication + stats | **Followed (API)** |
| Event Data Phase / Category / Priority wise | MIS-DASHBOARD event-data / priority | **Followed (API)** |
| Event — No Restoration / Non-rollover | MIS-DASHBOARD non-rollover | **Followed (API)** |
| Communication — Consumer / IP / DP / LS Detail | MIS-DASHBOARD communication | **Followed (API)** / **Partial** for named IP/DP/LS detail slides |
| MIS Report / MIS Download | REPORTS / MIS | **Partial** — event-report mapped; download UX is UI |

### 3.6 Commercial analysis (many PDF slides = one API family)

| PDF screen family | Framework | Followed? |
|-------------------|-----------|-----------|
| Commercial Analysis (landing) | COMMERICIAL-ANALYSIS `/summary` | **Followed (API)** |
| PF Violation | `/analysis/commercial/pf` | **Followed (param variant)** |
| MD>CD / Sanction Load | `/analysis/commercial/md` | **Followed (param variant)** |
| LF &lt;5% / &lt;100% / multi-month LF | `/analysis/commercial/lf` | **Followed (param variant)** |
| Consumption Compare variants | `/consumption-compare` | **Followed (param variant)** |
| Zero / Low / 100-unit / night patterns | `/consumption-pattern` + summary keys | **Followed (param variant)** |

**Note:** The PDF lists ~20+ Commercial Analysis titles. The framework **followed the PDF** by covering the **API report types**, not by cloning one Playwright test per PowerPoint slide.

### 3.7 Technical analysis

| PDF screen | Framework | Followed? |
|------------|-----------|-----------|
| Technical Analysis | TECHNICAL-ANALYSIS | **Followed (API)** |
| Techno Commercial Analysis | TECHNICAL-ANALYSIS / COMMERICIAL | **Partial** — no dedicated “techno commercial” slide rule in map |

### 3.8 DTR analytics (PDF)

| PDF screen | Framework | Followed? |
|------------|-----------|-----------|
| DTR Communication | DASHBOARD `/dtr-communication` | **Followed (API)** |
| DTR Event / Interruption / Detail | DTRS / REPORTS dtr-event | **Partial** — some slides use master-list proxy in map |
| DTR Hourly Load / Daily Analysis (loading, unbalance, voltage, summary) | DTRS / DASHBOARD unbalance widgets | **Partial** — family covered; not every chart title has a 1:1 spec |
| DTR IP / LS / DP Data | ENERGY-AUDITS loss-analysis report-types | **Followed (API)** (mapped) |

### 3.9 Consumption & billing & patterns

| PDF screen | Framework | Followed? |
|------------|-----------|-----------|
| Consumer Consumption Hourly / Daily / Monthly | CONSUMPTION | **Followed (API)** |
| Night Zero Consumption (00:00–06:00) | CONSUMPTION | **Partial** — daily/report structure; dedicated night rule may differ |
| Monthly Net Meter | CONSUMPTION | **Followed (API)** |
| Day wise / Monthly Billing | BILLING | **Followed (API)** |
| Pattern — Last 3 Months / Yearly / Comparison | CONSUMPTION pattern | **Followed (API)** |

### 3.10 Prepaid

| PDF screen | Framework | Followed? |
|------------|-----------|-----------|
| Prepaid — Prepaid Summary | HES meter lookup proxy | **Partial** — map marks optional; no dedicated prepaid-summary module |

### 3.11 Events & consumer PQ / collection reports

| PDF screen | Framework | Followed? |
|------------|-----------|-----------|
| Event — Consumer Event / Detail / DT interruption | REPORTS event-report / event-detail / dtrevent | **Followed (API)** |
| Consumer Data — Min/Max Voltage / Current Without Voltage | CONSUMERS power-quality | **Followed (API)** (needs live consumer id env) |
| Collection of Report — Meter Replacement (1Ph / 3Ph WC / LTCT) | METER-REPLACEMENT | **Partial** — MR module covers workflow APIs; not every “collection report” title proven 1:1 |
| Collection of Report — Current mismatch / Neutral / GASP / 3Ph analysis | REPORTS / TECHNICAL / MIS | **Gap / Partial** — not all collection-report titles have dedicated specs |

### 3.12 Revenue protection (PDF)

| PDF screen | Framework | Followed? |
|------------|-----------|-----------|
| Aberration Report / Detail | REVENUE-PROTECTION aberrations | **Followed (API)** — gold standard |
| ATR — Zone | REVENUE-PROTECTION atr-zone | **Followed (API)** |
| Aberration Entry — Zone / EENLTMT | REVENUE-PROTECTION aberration-entry | **Followed (API)** |

*(These titles appear in the PDF text extract; module coverage is strong even where the older slide→API map file still needs RP rules added.)*

### 3.13 SAIFI / SAIDI (PDF)

| PDF screen | Framework | Followed? |
|------------|-----------|-----------|
| Consumer / Circle / Division / Feeder SAIFI SAIDI variants | — | **Gap** — no dedicated SAIFI/SAIDI API module/specs found |

---

## 4. Summary scorecard (PDF → framework)

| Area in PDF | Followed the PDF? | Notes |
|-------------|-------------------|-------|
| Auth / home / static overview | **Yes (API)** | Not UI |
| Consumer / DTR master | **Yes** | |
| Meter commands | **Yes** | Async HES callback env-dependent |
| Billing Exchange | **Partial** | Proxy via HES history |
| Notifications | **Yes** | |
| Energy audit / hourly loss | **Yes** | |
| MIS / communication / events | **Yes** | |
| Commercial Analysis (many slides) | **Yes (by API family)** | Param variants |
| Technical Analysis | **Yes** | Techno-commercial partial |
| Consumption / billing / patterns | **Yes** | Night-zero partial |
| Prepaid summary | **Partial** | |
| Revenue Protection | **Yes** | Deep |
| Meter replacement collection reports | **Partial** | |
| SAIFI / SAIDI suite | **No (Gap)** | Highest clear PDF gap |
| UI charts / blank pages | **N/A** | Correctly out of scope |

**Overall:** The framework **did follow** `MDM Presentation_23.12.2025.pdf` as the product reference for **API automation coverage**. It did **not** (and should not) pixel-test every PowerPoint screen. Remaining work is **expansion** (SAIFI/SAIDI, Billing Exchange dedicated API if backend adds one, prepaid summary, collection-report depth) — not a framework redesign.

---

## 5. How to re-check after PDF updates

1. Extract slide titles from a new PDF export.  
2. Diff against this document’s tables.  
3. Update `scripts/data/mdm-pdf-slide-api-map.mjs` rules for new titles.  
4. Add module specs only when a real `/indore` (or HES) API exists.  
5. Refresh this file’s date and gap list.

---

## 6. Doc index

| Doc | Role |
|-----|------|
| [HARDENING-STATUS.md](./HARDENING-STATUS.md) | Pillar depth per module |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Framework design |
| [MODULE_GUIDE.md](./MODULE_GUIDE.md) | How to add coverage for a new PDF screen’s API |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | PR rules |
