# API Test Inventory

Generated: 2026-07-11T06:51:17.266Z

## Summary

| Metric | Count |
|--------|------:|
| Modules | 23 |
| API files | 125 |
| Spec files | 161 |
| Test cases | 363 |
| APIs without spec | 9 |
| Specs without API | 46 |

## By module

| Module | APIs | Specs | Tests | API coverage | Missing specs |
|--------|-----:|------:|------:|-------------:|--------------:|
| ASSET-MANAGEMENT | 3 | 8 | 10 | 67% | 1 |
| AUDIT-LOGS | 2 | 2 | 4 | 100% | 0 |
| AUTH | 3 | 14 | 51 | 0% | 3 |
| BILLING | 2 | 3 | 2 | 100% | 0 |
| COMMERICIAL-ANALYSIS | 7 | 6 | 6 | 100% | 0 |
| CONSUMERS | 14 | 14 | 38 | 100% | 0 |
| CONSUMPTION | 3 | 5 | 5 | 67% | 1 |
| DASHBOARD | 5 | 5 | 10 | 100% | 0 |
| DTRS | 7 | 7 | 21 | 100% | 0 |
| ENERGY-AUDITS | 5 | 7 | 0 | 60% | 2 |
| FEEDER | 4 | 4 | 4 | 100% | 0 |
| HES-COMMANDS | 14 | 14 | 35 | 100% | 0 |
| MASTER-DATA | 14 | 15 | 60 | 93% | 1 |
| MIS-DASHBOARD | 16 | 16 | 18 | 100% | 0 |
| MODULES-PERMISSIONS | 1 | 4 | 20 | 100% | 0 |
| NOTIFICATIONS | 1 | 2 | 2 | 100% | 0 |
| OVERALL-DASHBOARD | 2 | 2 | 2 | 100% | 0 |
| REPORTS | 4 | 4 | 7 | 100% | 0 |
| ROLE-PERMISSIONS | 1 | 4 | 22 | 100% | 0 |
| TECHNICAL-ANALYSIS | 2 | 2 | 3 | 100% | 0 |
| USERS-ADMIN | 1 | 6 | 23 | 100% | 0 |
| USERS-PROFILE-IMAGE | 1 | 3 | 6 | 100% | 0 |
| UTILS-LOOKUP | 13 | 14 | 14 | 92% | 1 |

## Tags (test case count)

| Tag | Tests |
|-----|------:|
| @smoke | 135 |
| @negative | 86 |
| @auth | 56 |
| @permissions | 42 |
| @invite | 35 |
| @commands | 35 |
| @hes | 35 |
| @e2e | 32 |
| @master-data | 25 |
| @users-admin | 23 |
| @role-permissions | 22 |
| @modules-permissions | 20 |
| @asset-management | 10 |
| @meter-communication | 10 |
| @dtr | 7 |
| @hierarchy | 7 |
| @users-profile-image | 6 |
| @consumption | 5 |
| @commands-history | 5 |
| @dtr-master | 5 |
| @feeder-master | 5 |
| @substation-master | 5 |
| @feeder | 4 |
| @audit | 3 |
| @export | 3 |
| @billing | 3 |
| @commands-meter-alarms | 3 |
| @commands-meter-location | 3 |
| @commands-meter-samples | 3 |
| @commands-search-meters | 3 |
| @coverage | 2 |
| @consumer | 2 |
| @daily-consumption | 2 |
| @commands-billing | 2 |
| @commands-demand-config | 2 |
| @commands-load-curtailment | 2 |
| @commands-meter-info | 2 |
| @commands-meter | 2 |
| @commands-metering-mode | 2 |
| @commands-payment | 2 |
| @commands-profile-config | 2 |
| @commands-query-meter-job | 2 |
| @comm-stats | 2 |
| @event-data | 2 |
| @eventpriority | 2 |
| @notifications | 2 |
| @network | 2 |
| @production | 1 |
| @scope | 1 |
| @commercial | 1 |
| @commercial-summary | 1 |
| @consumption-compare | 1 |
| @consumption-pattern | 1 |
| @lf-analysis | 1 |
| @md-analysis | 1 |
| @power-factor | 1 |
| @comparison | 1 |
| @last-three-months | 1 |
| @monthly-net-meter | 1 |
| @yearly | 1 |
| @feeder-alerts | 1 |
| @electrical-parameters | 1 |
| @profile | 1 |
| @classification | 1 |
| @eventpriority2 | 1 |
| @priority-overview | 1 |
| @mobile | 1 |
| @dashboard | 1 |
| @dtr-communication | 1 |
| @reports | 1 |
| @dtr-billing | 1 |
| @connection | 1 |
| @consumercategory | 1 |
| @manufacturer | 1 |
| @events | 1 |
| @eventclassification | 1 |
| @meterphase | 1 |
| @organisation | 1 |
| @payment | 1 |
| @organization | 1 |
| @db | 0 |
| @meter-master | 0 |
| @consumer-master | 0 |

## APIs missing tests

- **ASSET-MANAGEMENT** — `src/modules/ASSET-MANAGEMENT/Api/DtrId.api.ts`
- **AUTH** — `src/modules/AUTH/Api/auth-session.api.ts`
- **AUTH** — `src/modules/AUTH/Api/auth.api.ts`
- **AUTH** — `src/modules/AUTH/Api/invite.api.ts`
- **CONSUMPTION** — `src/modules/CONSUMPTION/Api/patternconsumption.api.ts`
- **ENERGY-AUDITS** — `src/modules/ENERGY-AUDITS/Api/hourly-loss-report.api.ts`
- **ENERGY-AUDITS** — `src/modules/ENERGY-AUDITS/Api/loss-analysis.api.ts`
- **MASTER-DATA** — `src/modules/MASTER-DATA/Api/substation-master.api.ts`
- **UTILS-LOOKUP** — `src/modules/UTILS-LOOKUP/Api/networksearch.api.ts`

## Specs without matching API file

_Often multi-API flows (e.g. AUTH invite) or renamed APIs._

- **ASSET-MANAGEMENT** — `src/modules/ASSET-MANAGEMENT/tests/asset-management-coverage.spec.ts`
- **ASSET-MANAGEMENT** — `src/modules/ASSET-MANAGEMENT/tests/asset-management-edge.spec.ts`
- **ASSET-MANAGEMENT** — `src/modules/ASSET-MANAGEMENT/tests/asset-management-negative.spec.ts`
- **ASSET-MANAGEMENT** — `src/modules/ASSET-MANAGEMENT/tests/asset-management-scope.spec.ts`
- **ASSET-MANAGEMENT** — `src/modules/ASSET-MANAGEMENT/tests/asset-management.db.spec.ts`
- **ASSET-MANAGEMENT** — `src/modules/ASSET-MANAGEMENT/tests/dtrId.spec.ts`
- **AUTH** — `src/modules/AUTH/tests/00-invite-setup.spec.ts`
- **AUTH** — `src/modules/AUTH/tests/10-invite-preview.spec.ts`
- **AUTH** — `src/modules/AUTH/tests/11-invite-validate.spec.ts`
- **AUTH** — `src/modules/AUTH/tests/15-invite-user.spec.ts`
- **AUTH** — `src/modules/AUTH/tests/90-invite-accept-validate.spec.ts`
- **AUTH** — `src/modules/AUTH/tests/91-invite-e2e.spec.ts`
- **AUTH** — `src/modules/AUTH/tests/92-invite-delete.spec.ts`
- **AUTH** — `src/modules/AUTH/tests/auth-devices.spec.ts`
- **AUTH** — `src/modules/AUTH/tests/auth-me.spec.ts`
- **AUTH** — `src/modules/AUTH/tests/auth-session-negative.spec.ts`
- **AUTH** — `src/modules/AUTH/tests/invite-accept.spec.ts`
- **AUTH** — `src/modules/AUTH/tests/invite-list.spec.ts`
- **AUTH** — `src/modules/AUTH/tests/login.spec.ts`
- **AUTH** — `src/modules/AUTH/tests/refresh.spec.ts`
- **BILLING** — `src/modules/BILLING/tests/billing.db.spec.ts`
- **CONSUMPTION** — `src/modules/CONSUMPTION/tests/comparison.spec.ts`
- **CONSUMPTION** — `src/modules/CONSUMPTION/tests/lastthreemonths.spec.ts`
- **CONSUMPTION** — `src/modules/CONSUMPTION/tests/yearly.spec.ts`
- **ENERGY-AUDITS** — `src/modules/ENERGY-AUDITS/tests/hourly-loss-report-dtr.spec.ts`
- **ENERGY-AUDITS** — `src/modules/ENERGY-AUDITS/tests/hourly-loss-report-feeder.spec.ts`
- **ENERGY-AUDITS** — `src/modules/ENERGY-AUDITS/tests/loss-analysis-dtr.spec.ts`
- **ENERGY-AUDITS** — `src/modules/ENERGY-AUDITS/tests/loss-analysis-feeder.spec.ts`
- **MASTER-DATA** — `src/modules/MASTER-DATA/tests/master-data.db.spec.ts`
- **MASTER-DATA** — `src/modules/MASTER-DATA/tests/substation.-master.spec.ts`
- **MODULES-PERMISSIONS** — `src/modules/MODULES-PERMISSIONS/tests/modulepermission-advanced.spec.ts`
- **MODULES-PERMISSIONS** — `src/modules/MODULES-PERMISSIONS/tests/modulepermission-list.spec.ts`
- **MODULES-PERMISSIONS** — `src/modules/MODULES-PERMISSIONS/tests/modulepermission-negative.spec.ts`
- **NOTIFICATIONS** — `src/modules/NOTIFICATIONS/tests/notificationsmobile.spec.ts`
- **ROLE-PERMISSIONS** — `src/modules/ROLE-PERMISSIONS/tests/rolepermission-advanced.spec.ts`
- **ROLE-PERMISSIONS** — `src/modules/ROLE-PERMISSIONS/tests/rolepermission-list.spec.ts`
- **ROLE-PERMISSIONS** — `src/modules/ROLE-PERMISSIONS/tests/rolepermission-negative.spec.ts`
- **USERS-ADMIN** — `src/modules/USERS-ADMIN/tests/useradmin-advanced.spec.ts`
- **USERS-ADMIN** — `src/modules/USERS-ADMIN/tests/useradmin-list.spec.ts`
- **USERS-ADMIN** — `src/modules/USERS-ADMIN/tests/useradmin-negative.spec.ts`
- **USERS-ADMIN** — `src/modules/USERS-ADMIN/tests/userdevices.spec.ts`
- **USERS-ADMIN** — `src/modules/USERS-ADMIN/tests/usersecurity.spec.ts`
- **USERS-PROFILE-IMAGE** — `src/modules/USERS-PROFILE-IMAGE/tests/profileimage-list.spec.ts`
- **USERS-PROFILE-IMAGE** — `src/modules/USERS-PROFILE-IMAGE/tests/profileimage-negative.spec.ts`
- **UTILS-LOOKUP** — `src/modules/UTILS-LOOKUP/tests/event.spec.ts`
- **UTILS-LOOKUP** — `src/modules/UTILS-LOOKUP/tests/networksearch.api.spec.ts`
