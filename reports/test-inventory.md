# API Test Inventory

Generated: 2026-07-17T10:32:08.252Z

## Summary

| Metric | Count |
|--------|------:|
| Modules | 24 |
| API files | 139 |
| Spec files | 195 |
| Test cases | 458 |
| APIs without spec | 11 |
| Specs without API | 68 |

## By module

| Module | APIs | Specs | Tests | API coverage | Missing specs |
|--------|-----:|------:|------:|-------------:|--------------:|
| ASSET-MANAGEMENT | 3 | 8 | 10 | 67% | 1 |
| AUDIT-LOGS | 2 | 2 | 4 | 100% | 0 |
| AUTH | 3 | 14 | 51 | 0% | 3 |
| BILLING | 2 | 3 | 2 | 100% | 0 |
| COMMERICIAL-ANALYSIS | 7 | 9 | 29 | 100% | 0 |
| CONSUMERS | 14 | 14 | 38 | 100% | 0 |
| CONSUMPTION | 4 | 10 | 26 | 50% | 2 |
| DASHBOARD | 7 | 7 | 14 | 100% | 0 |
| DTRS | 7 | 7 | 21 | 100% | 0 |
| ENERGY-AUDITS | 5 | 7 | 0 | 60% | 2 |
| FEEDER | 4 | 4 | 4 | 100% | 0 |
| HES-COMMANDS | 14 | 14 | 35 | 100% | 0 |
| MASTER-DATA | 16 | 21 | 71 | 94% | 1 |
| METER-REPLACEMENT | 9 | 17 | 47 | 89% | 1 |
| MIS-DASHBOARD | 16 | 16 | 18 | 100% | 0 |
| MODULES-PERMISSIONS | 1 | 4 | 20 | 100% | 0 |
| NOTIFICATIONS | 1 | 2 | 2 | 100% | 0 |
| OVERALL-DASHBOARD | 2 | 2 | 2 | 100% | 0 |
| REPORTS | 4 | 4 | 8 | 100% | 0 |
| ROLE-PERMISSIONS | 1 | 4 | 22 | 100% | 0 |
| TECHNICAL-ANALYSIS | 2 | 2 | 4 | 100% | 0 |
| USERS-ADMIN | 1 | 6 | 23 | 100% | 0 |
| USERS-PROFILE-IMAGE | 1 | 3 | 6 | 100% | 0 |
| UTILS-LOOKUP | 13 | 15 | 1 | 92% | 1 |

## Tags (test case count)

| Tag | Tests |
|-----|------:|
| @smoke | 138 |
| @negative | 124 |
| @auth | 94 |
| @edge | 62 |
| @meter-replacement | 45 |
| @permissions | 42 |
| @e2e | 41 |
| @invite | 35 |
| @commands | 35 |
| @hes | 35 |
| @master-data | 34 |
| @consumption | 25 |
| @commercial | 23 |
| @power-factor | 23 |
| @lf-analysis | 23 |
| @consumption-pattern | 23 |
| @consumption-compare | 23 |
| @md-analysis | 23 |
| @users-admin | 23 |
| @positive | 22 |
| @role-permissions | 22 |
| @modules-permissions | 20 |
| @monthly-net-meter | 14 |
| @comparison | 13 |
| @yearly | 13 |
| @daily-consumption | 13 |
| @hourly-consumption | 13 |
| @monthly-consumption | 13 |
| @security | 13 |
| @backend-defect | 11 |
| @submission-history | 11 |
| @asset-management | 10 |
| @meter-communication | 10 |
| @create-meter | 10 |
| @create-submission | 9 |
| @hierarchy | 7 |
| @dtr | 6 |
| @create-consumer | 6 |
| @validate-meter | 6 |
| @users-profile-image | 6 |
| @commands-history | 5 |
| @dtr-master | 5 |
| @feeder-master | 5 |
| @substation-master | 5 |
| @create-dtr | 5 |
| @validate-dtr-meter | 5 |
| @consumer-detail | 5 |
| @submission-detail | 5 |
| @feeder | 4 |
| @consumer-search | 4 |
| @meter-validation | 4 |
| @progress | 4 |
| @audit | 3 |
| @export | 3 |
| @billing | 3 |
| @commands-meter-alarms | 3 |
| @commands-meter-location | 3 |
| @commands-meter-samples | 3 |
| @commands-search-meters | 3 |
| @dashboard-summary | 3 |
| @coverage | 2 |
| @last-three-months | 2 |
| @dtr-load-unbalance | 2 |
| @dtr-voltage-unbalance | 2 |
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
| @notifications | 2 |
| @production | 1 |
| @scope | 1 |
| @commercial-summary | 1 |
| @consumer | 1 |
| @pattern-consumption | 1 |
| @consumption-report | 1 |
| @feeder-alerts | 1 |
| @electrical-parameters | 1 |
| @profile | 1 |
| @meter-crud | 1 |
| @update-meter | 1 |
| @deactivate-meter | 1 |
| @classification | 1 |
| @eventpriority | 1 |
| @eventpriority2 | 1 |
| @priority-overview | 1 |
| @mobile | 1 |
| @dashboard | 1 |
| @dtr-communication | 1 |
| @db | 0 |
| @meter-master | 0 |
| @consumer-master | 0 |

## APIs missing tests

- **ASSET-MANAGEMENT** — `src/modules/ASSET-MANAGEMENT/Api/DtrId.api.ts`
- **AUTH** — `src/modules/AUTH/Api/auth-session.api.ts`
- **AUTH** — `src/modules/AUTH/Api/auth.api.ts`
- **AUTH** — `src/modules/AUTH/Api/invite.api.ts`
- **CONSUMPTION** — `src/modules/CONSUMPTION/Api/consumption-report.api.ts`
- **CONSUMPTION** — `src/modules/CONSUMPTION/Api/patternconsumption.api.ts`
- **ENERGY-AUDITS** — `src/modules/ENERGY-AUDITS/Api/hourly-loss-report.api.ts`
- **ENERGY-AUDITS** — `src/modules/ENERGY-AUDITS/Api/loss-analysis.api.ts`
- **MASTER-DATA** — `src/modules/MASTER-DATA/Api/substation-master.api.ts`
- **METER-REPLACEMENT** — `src/modules/METER-REPLACEMENT/Api/create-submission.api.ts`
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
- **COMMERICIAL-ANALYSIS** — `src/modules/COMMERICIAL-ANALYSIS/tests/commercial-auth-negative.spec.ts`
- **COMMERICIAL-ANALYSIS** — `src/modules/COMMERICIAL-ANALYSIS/tests/commercial-edge.spec.ts`
- **COMMERICIAL-ANALYSIS** — `src/modules/COMMERICIAL-ANALYSIS/tests/commercial-negative.spec.ts`
- **CONSUMPTION** — `src/modules/CONSUMPTION/tests/comparison.spec.ts`
- **CONSUMPTION** — `src/modules/CONSUMPTION/tests/consumption-auth-negative.spec.ts`
- **CONSUMPTION** — `src/modules/CONSUMPTION/tests/consumption-edge.spec.ts`
- **CONSUMPTION** — `src/modules/CONSUMPTION/tests/consumption-negative.spec.ts`
- **CONSUMPTION** — `src/modules/CONSUMPTION/tests/hourlyconsumption.spec.ts`
- **CONSUMPTION** — `src/modules/CONSUMPTION/tests/lastthreemonths.spec.ts`
- **CONSUMPTION** — `src/modules/CONSUMPTION/tests/monthlyconsumption.spec.ts`
- **CONSUMPTION** — `src/modules/CONSUMPTION/tests/yearly.spec.ts`
- **ENERGY-AUDITS** — `src/modules/ENERGY-AUDITS/tests/hourly-loss-report-dtr.spec.ts`
- **ENERGY-AUDITS** — `src/modules/ENERGY-AUDITS/tests/hourly-loss-report-feeder.spec.ts`
- **ENERGY-AUDITS** — `src/modules/ENERGY-AUDITS/tests/loss-analysis-dtr.spec.ts`
- **ENERGY-AUDITS** — `src/modules/ENERGY-AUDITS/tests/loss-analysis-feeder.spec.ts`
- **MASTER-DATA** — `src/modules/MASTER-DATA/tests/master-data.db.spec.ts`
- **MASTER-DATA** — `src/modules/MASTER-DATA/tests/meter-consumer-e2e.spec.ts`
- **MASTER-DATA** — `src/modules/MASTER-DATA/tests/meter-crud-lifecycle.spec.ts`
- **MASTER-DATA** — `src/modules/MASTER-DATA/tests/meter-dtr-consumer-e2e.spec.ts`
- **MASTER-DATA** — `src/modules/MASTER-DATA/tests/meter-dtr-e2e.spec.ts`
- **MASTER-DATA** — `src/modules/MASTER-DATA/tests/substation.-master.spec.ts`
- **METER-REPLACEMENT** — `src/modules/METER-REPLACEMENT/tests/consumer-detail-negative.spec.ts`
- **METER-REPLACEMENT** — `src/modules/METER-REPLACEMENT/tests/consumer-search-negative.spec.ts`
- **METER-REPLACEMENT** — `src/modules/METER-REPLACEMENT/tests/create-submission-e2e.spec.ts`
- **METER-REPLACEMENT** — `src/modules/METER-REPLACEMENT/tests/create-submission-negative.spec.ts`
- **METER-REPLACEMENT** — `src/modules/METER-REPLACEMENT/tests/dashboard-summary-negative.spec.ts`
- **METER-REPLACEMENT** — `src/modules/METER-REPLACEMENT/tests/meter-validation-negative.spec.ts`
- **METER-REPLACEMENT** — `src/modules/METER-REPLACEMENT/tests/progress-negative.spec.ts`
- **METER-REPLACEMENT** — `src/modules/METER-REPLACEMENT/tests/submission-detail-negative.spec.ts`
- **METER-REPLACEMENT** — `src/modules/METER-REPLACEMENT/tests/submission-history-negative.spec.ts`
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
- **UTILS-LOOKUP** — `src/modules/UTILS-LOOKUP/tests/missing-routes.spec.ts`
- **UTILS-LOOKUP** — `src/modules/UTILS-LOOKUP/tests/networksearch.api.spec.ts`
