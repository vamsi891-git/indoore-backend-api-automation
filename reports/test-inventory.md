# API Test Inventory

Generated: 2026-06-12T04:31:07.938Z

## Summary

| Metric | Count |
|--------|------:|
| Modules | 21 |
| API files | 92 |
| Spec files | 106 |
| Test cases | 134 |
| APIs without spec | 6 |
| Specs without API | 21 |

## By module

| Module | APIs | Specs | Tests | API coverage | Missing specs |
|--------|-----:|------:|------:|-------------:|--------------:|
| ASSET MANAGEMENT | 3 | 3 | 3 | 67% | 1 |
| AUDIT LOGS | 2 | 2 | 4 | 100% | 0 |
| AUTH | 2 | 11 | 35 | 0% | 2 |
| BILLING | 2 | 2 | 2 | 100% | 0 |
| COMMERICIAL-ANALYSIS | 7 | 6 | 6 | 100% | 0 |
| CONSUMERS | 13 | 13 | 13 | 100% | 0 |
| CONSUMPTION | 3 | 5 | 5 | 67% | 1 |
| DASHBOARD | 5 | 5 | 5 | 100% | 0 |
| DTRS | 7 | 7 | 7 | 100% | 0 |
| ENERGY-AUDITS | 0 | 0 | 0 | — | 0 |
| FEEDER | 4 | 4 | 4 | 100% | 0 |
| MASTER-DATA | 4 | 4 | 4 | 75% | 1 |
| MIS DASHBOARDIES | 16 | 16 | 18 | 100% | 0 |
| MODULES PERMISSIONS | 1 | 1 | 1 | 100% | 0 |
| NOTIFICATIONS | 1 | 2 | 2 | 100% | 0 |
| OVERALL-DASHBOARD | 2 | 2 | 2 | 100% | 0 |
| REPORTS | 3 | 3 | 3 | 100% | 0 |
| ROLE PERMISSIONS | 1 | 1 | 1 | 100% | 0 |
| TECHNICAL ANALYSIS | 2 | 2 | 2 | 100% | 0 |
| USERS ADMIN | 1 | 3 | 3 | 100% | 0 |
| UTILS-LOOKUP | 13 | 14 | 14 | 92% | 1 |

## Tags (test case count)

| Tag | Tests |
|-----|------:|
| @smoke | 92 |
| @auth | 35 |
| @invite | 31 |
| @e2e | 20 |
| @consumer | 14 |
| @dtr | 10 |
| @dashboard | 6 |
| @consumption | 5 |
| @feeder | 5 |
| @audit | 4 |
| @billing | 4 |
| @profile | 3 |
| @reports | 3 |
| @hierarchy | 2 |
| @export | 2 |
| @energy | 2 |
| @event-log | 2 |
| @power | 2 |
| @daily-consumption | 2 |
| @comm-stats | 2 |
| @event-data | 2 |
| @eventpriority | 2 |
| @notifications | 2 |
| @network | 2 |
| @commercial | 1 |
| @commercial-summary | 1 |
| @consumption-compare | 1 |
| @consumption-pattern | 1 |
| @lf-analysis | 1 |
| @md-analysis | 1 |
| @power-factor | 1 |
| @activation | 1 |
| @billing-history | 1 |
| @create-consumer | 1 |
| @graph | 1 |
| @flow | 1 |
| @event-log-list | 1 |
| @live-load | 1 |
| @validate-meter | 1 |
| @comparison | 1 |
| @last-three-months | 1 |
| @monthly-net-meter | 1 |
| @yearly | 1 |
| @metrics | 1 |
| @capacity-gauge | 1 |
| @daily-threshold-chart | 1 |
| @dtr-events | 1 |
| @feeders | 1 |
| @power-triangle | 1 |
| @statistics | 1 |
| @feeder-alerts | 1 |
| @electrical-parameters | 1 |
| @consumer-master | 1 |
| @substation | 1 |
| @classification | 1 |
| @eventpriority2 | 1 |
| @priority-overview | 1 |
| @mobile | 1 |
| @dtr-communication | 1 |
| @dtr-billing | 1 |
| @event-detail | 1 |
| @event-report | 1 |
| @technical | 1 |
| @summary | 1 |
| @technical-analysis | 1 |
| @report | 1 |
| @connection | 1 |
| @consumercategory | 1 |
| @manufacturer | 1 |
| @events | 1 |
| @eventclassification | 1 |
| @meterphase | 1 |
| @organisation | 1 |
| @payment | 1 |
| @organization | 1 |

## APIs missing tests

- **ASSET MANAGEMENT** — `src/modules/ASSET MANAGEMENT/Api/DtrId.api.ts`
- **AUTH** — `src/modules/AUTH/Api/auth.api.ts`
- **AUTH** — `src/modules/AUTH/Api/invite.api.ts`
- **CONSUMPTION** — `src/modules/CONSUMPTION/Api/patternconsumption.api.ts`
- **MASTER-DATA** — `src/modules/MASTER-DATA/Api/substation-master.api.ts`
- **UTILS-LOOKUP** — `src/modules/UTILS-LOOKUP/Api/networksearch.api.ts`

## Specs without matching API file

_Often multi-API flows (e.g. AUTH invite) or renamed APIs._

- **ASSET MANAGEMENT** — `src/modules/ASSET MANAGEMENT/tests/dtrId.spec.ts`
- **AUTH** — `src/modules/AUTH/tests/00-invite-setup.spec.ts`
- **AUTH** — `src/modules/AUTH/tests/invite-accept-validate.spec.ts`
- **AUTH** — `src/modules/AUTH/tests/invite-accept.spec.ts`
- **AUTH** — `src/modules/AUTH/tests/invite-delete.spec.ts`
- **AUTH** — `src/modules/AUTH/tests/invite-e2e.spec.ts`
- **AUTH** — `src/modules/AUTH/tests/invite-list.spec.ts`
- **AUTH** — `src/modules/AUTH/tests/invite-preview.spec.ts`
- **AUTH** — `src/modules/AUTH/tests/invite-user.spec.ts`
- **AUTH** — `src/modules/AUTH/tests/invite-validate.spec.ts`
- **AUTH** — `src/modules/AUTH/tests/login.spec.ts`
- **AUTH** — `src/modules/AUTH/tests/refresh.spec.ts`
- **CONSUMPTION** — `src/modules/CONSUMPTION/tests/comparison.spec.ts`
- **CONSUMPTION** — `src/modules/CONSUMPTION/tests/lastthreemonths.spec.ts`
- **CONSUMPTION** — `src/modules/CONSUMPTION/tests/yearly.spec.ts`
- **MASTER-DATA** — `src/modules/MASTER-DATA/tests/substation.-master.spec.ts`
- **NOTIFICATIONS** — `src/modules/NOTIFICATIONS/tests/notificationsmobile.spec.ts`
- **USERS ADMIN** — `src/modules/USERS ADMIN/tests/userdevices.spec.ts`
- **USERS ADMIN** — `src/modules/USERS ADMIN/tests/usersecurity.spec.ts`
- **UTILS-LOOKUP** — `src/modules/UTILS-LOOKUP/tests/event.spec.ts`
- **UTILS-LOOKUP** — `src/modules/UTILS-LOOKUP/tests/networksearch.api.spec.ts`
