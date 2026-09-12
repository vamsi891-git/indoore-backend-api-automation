# API Test Inventory

Generated: 2026-07-25T06:39:41.870Z

## Summary

| Metric | Count |
|--------|------:|
| Modules | 25 |
| API files | 143 |
| Spec files | 353 |
| Test cases | 899 |
| APIs without spec | 11 |
| Specs without API | 222 |

## By module

| Module | APIs | Specs | Tests | API coverage | Missing specs |
|--------|-----:|------:|------:|-------------:|--------------:|
| ASSET-MANAGEMENT | 3 | 13 | 40 | 67% | 1 |
| AUDIT-LOGS | 2 | 6 | 11 | 100% | 0 |
| AUTH | 3 | 18 | 71 | 0% | 3 |
| BILLING | 2 | 6 | 11 | 100% | 0 |
| COMMERICIAL-ANALYSIS | 7 | 13 | 36 | 100% | 0 |
| CONSUMERS | 14 | 31 | 97 | 100% | 0 |
| CONSUMPTION | 4 | 14 | 33 | 50% | 2 |
| DASHBOARD | 7 | 13 | 35 | 100% | 0 |
| DTRS | 7 | 11 | 28 | 100% | 0 |
| ENERGY-AUDITS | 5 | 11 | 7 | 60% | 2 |
| FEEDER | 4 | 11 | 24 | 100% | 0 |
| HES-COMMANDS | 14 | 18 | 42 | 100% | 0 |
| MASTER-DATA | 16 | 24 | 102 | 94% | 1 |
| METER-REPLACEMENT | 9 | 21 | 78 | 89% | 1 |
| MIS-DASHBOARD | 16 | 20 | 25 | 100% | 0 |
| MODULES-PERMISSIONS | 1 | 8 | 27 | 100% | 0 |
| NOTIFICATIONS | 1 | 6 | 9 | 100% | 0 |
| OVERALL-DASHBOARD | 2 | 6 | 11 | 100% | 0 |
| REPORTS | 4 | 9 | 20 | 100% | 0 |
| REVENUE-PROTECTION | 4 | 41 | 77 | 100% | 0 |
| ROLE-PERMISSIONS | 1 | 8 | 29 | 100% | 0 |
| TECHNICAL-ANALYSIS | 2 | 7 | 18 | 100% | 0 |
| USERS-ADMIN | 1 | 10 | 30 | 100% | 0 |
| USERS-PROFILE-IMAGE | 1 | 7 | 13 | 100% | 0 |
| UTILS-LOOKUP | 13 | 21 | 25 | 92% | 1 |

## Tags (test case count)

| Tag | Tests |
|-----|------:|
| @mutation-proof | 302 |
| @smoke | 138 |
| @negative | 127 |
| @auth | 117 |
| @meter-replacement | 76 |
| @edge | 73 |
| @contract-snapshot | 72 |
| @revenue-protection | 68 |
| @master-data | 64 |
| @consumers | 59 |
| @invite | 53 |
| @permissions | 42 |
| @e2e | 41 |
| @asset-management | 40 |
| @db | 40 |
| @meter-communication | 38 |
| @commands | 35 |
| @hes | 35 |
| @dtr-master | 33 |
| @feeder-master | 33 |
| @substation-master | 33 |
| @consumption | 32 |
| @users-admin | 30 |
| @role-permissions | 29 |
| @meter-master | 28 |
| @consumer-master | 28 |
| @network-hierarchy | 27 |
| @modules-permissions | 27 |
| @positive | 24 |
| @feeder | 24 |
| @commercial | 23 |
| @power-factor | 23 |
| @lf-analysis | 23 |
| @consumption-pattern | 23 |
| @consumption-compare | 23 |
| @md-analysis | 23 |
| @utils-lookup | 23 |
| @dashboard | 22 |
| @organisation-hierarchy | 21 |
| @validate-meter | 20 |
| @profile | 19 |
| @me | 18 |
| @devices | 18 |
| @submission-history | 18 |
| @daily-consumption | 17 |
| @connection-status | 16 |
| @login | 15 |
| @communication-status | 14 |
| @billing-history | 14 |
| @billing-period | 14 |
| @energy-consumption-graph | 14 |
| @energy-flow | 14 |
| @event-log-cards | 14 |
| @event-log-list | 14 |
| @live-load-profile | 14 |
| @power-quality | 14 |
| @real-time-power | 14 |
| @nearest-account-ids | 14 |
| @activation | 14 |
| @monthly-net-meter | 14 |
| @consumer-search | 14 |
| @cases | 14 |
| @technical-analysis | 14 |
| @dtr-detail | 13 |
| @comparison | 13 |
| @yearly | 13 |
| @hourly-consumption | 13 |
| @monthly-consumption | 13 |
| @security | 13 |
| @aberration-entry-eenltmt | 13 |
| @users-profile-image | 13 |
| @events | 13 |
| @billing | 12 |
| @consumer-detail | 12 |
| @submission-detail | 12 |
| @reports | 12 |
| @aberration-entry-by-ivrs | 12 |
| @consumer-category | 12 |
| @payment-contract | 12 |
| @device-manufacturer | 12 |
| @event-classification | 12 |
| @event-priority | 12 |
| @meter-phase | 12 |
| @backend-defect | 11 |
| @progress | 11 |
| @meter-validation | 11 |
| @dtr-communication | 10 |
| @create-meter | 10 |
| @dashboard-summary | 10 |
| @metrics | 9 |
| @dtr-load-unbalance | 9 |
| @dtr-voltage-unbalance | 9 |
| @create-submission | 9 |
| @notifications | 9 |
| @overall-dashboard | 9 |
| @aberration-entry | 9 |
| @atr-zone | 9 |
| @hierarchy | 7 |
| @audit-logs | 7 |
| @commericial-analysis | 7 |
| @dtr-summary | 7 |
| @dtr-consumption | 7 |
| @dtr-power-status | 7 |
| @dtrs | 7 |
| @energy-audits | 7 |
| @hes-commands | 7 |
| @mis-dashboard | 7 |
| @dtr | 6 |
| @create-consumer | 6 |
| @dtr-billing | 6 |
| @aberrations | 6 |
| @feeder-alerts | 5 |
| @electrical-parameters | 5 |
| @commands-history | 5 |
| @create-dtr | 5 |
| @validate-dtr-meter | 5 |
| @event-report | 4 |
| @event-detail | 4 |
| @dtr-event | 4 |
| @audit | 3 |
| @export | 3 |
| @commands-meter-alarms | 3 |
| @commands-meter-location | 3 |
| @commands-meter-samples | 3 |
| @commands-search-meters | 3 |
| @dtr-search | 3 |
| @coverage | 2 |
| @billing-data | 2 |
| @daywise-billing | 2 |
| @last-three-months | 2 |
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
| @technical-summary | 2 |
| @report | 2 |
| @production | 1 |
| @scope | 1 |
| @commercial-summary | 1 |
| @consumer | 1 |
| @pattern-consumption | 1 |
| @consumption-report | 1 |
| @meter-crud | 1 |
| @update-meter | 1 |
| @deactivate-meter | 1 |
| @classification | 1 |
| @eventpriority | 1 |
| @eventpriority2 | 1 |
| @priority-overview | 1 |
| @mobile | 1 |
| @aberrations-detail | 1 |
| @technical | 0 |

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
- **ASSET-MANAGEMENT** — `src/modules/ASSET-MANAGEMENT/tests/asset-management.contract.spec.ts`
- **ASSET-MANAGEMENT** — `src/modules/ASSET-MANAGEMENT/tests/asset-management.db.spec.ts`
- **ASSET-MANAGEMENT** — `src/modules/ASSET-MANAGEMENT/tests/dtrId.spec.ts`
- **ASSET-MANAGEMENT** — `src/modules/ASSET-MANAGEMENT/tests/mutation-proof/db-cross-validation.mutation.spec.ts`
- **ASSET-MANAGEMENT** — `src/modules/ASSET-MANAGEMENT/tests/mutation-proof/dtr-detail.mutation.spec.ts`
- **ASSET-MANAGEMENT** — `src/modules/ASSET-MANAGEMENT/tests/mutation-proof/network-hierarchy.mutation.spec.ts`
- **ASSET-MANAGEMENT** — `src/modules/ASSET-MANAGEMENT/tests/mutation-proof/organisation-hierarchy.mutation.spec.ts`
- **AUDIT-LOGS** — `src/modules/AUDIT-LOGS/tests/audit-logs.contract.spec.ts`
- **AUDIT-LOGS** — `src/modules/AUDIT-LOGS/tests/audit-logs.db.spec.ts`
- **AUDIT-LOGS** — `src/modules/AUDIT-LOGS/tests/mutation-proof/audit-logs.mutation.spec.ts`
- **AUDIT-LOGS** — `src/modules/AUDIT-LOGS/tests/mutation-proof/db-cross-validation.mutation.spec.ts`
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
- **AUTH** — `src/modules/AUTH/tests/auth.contract.spec.ts`
- **AUTH** — `src/modules/AUTH/tests/auth.db.spec.ts`
- **AUTH** — `src/modules/AUTH/tests/invite-accept.spec.ts`
- **AUTH** — `src/modules/AUTH/tests/invite-list.spec.ts`
- **AUTH** — `src/modules/AUTH/tests/login.spec.ts`
- **AUTH** — `src/modules/AUTH/tests/mutation-proof/auth.mutation.spec.ts`
- **AUTH** — `src/modules/AUTH/tests/mutation-proof/db-cross-validation.mutation.spec.ts`
- **AUTH** — `src/modules/AUTH/tests/refresh.spec.ts`
- **BILLING** — `src/modules/BILLING/tests/billing.contract.spec.ts`
- **BILLING** — `src/modules/BILLING/tests/billing.db.spec.ts`
- **BILLING** — `src/modules/BILLING/tests/mutation-proof/billing.mutation.spec.ts`
- **BILLING** — `src/modules/BILLING/tests/mutation-proof/db-cross-validation.mutation.spec.ts`
- **COMMERICIAL-ANALYSIS** — `src/modules/COMMERICIAL-ANALYSIS/tests/commercial-auth-negative.spec.ts`
- **COMMERICIAL-ANALYSIS** — `src/modules/COMMERICIAL-ANALYSIS/tests/commercial-edge.spec.ts`
- **COMMERICIAL-ANALYSIS** — `src/modules/COMMERICIAL-ANALYSIS/tests/commercial-negative.spec.ts`
- **COMMERICIAL-ANALYSIS** — `src/modules/COMMERICIAL-ANALYSIS/tests/commericial-analysis.contract.spec.ts`
- **COMMERICIAL-ANALYSIS** — `src/modules/COMMERICIAL-ANALYSIS/tests/commericial-analysis.db.spec.ts`
- **COMMERICIAL-ANALYSIS** — `src/modules/COMMERICIAL-ANALYSIS/tests/mutation-proof/commericial-analysis.mutation.spec.ts`
- **COMMERICIAL-ANALYSIS** — `src/modules/COMMERICIAL-ANALYSIS/tests/mutation-proof/db-cross-validation.mutation.spec.ts`
- **CONSUMERS** — `src/modules/CONSUMERS/tests/consumers.contract.spec.ts`
- **CONSUMERS** — `src/modules/CONSUMERS/tests/consumers.db.spec.ts`
- **CONSUMERS** — `src/modules/CONSUMERS/tests/mutation-proof/activation.mutation.spec.ts`
- **CONSUMERS** — `src/modules/CONSUMERS/tests/mutation-proof/billing-history.mutation.spec.ts`
- **CONSUMERS** — `src/modules/CONSUMERS/tests/mutation-proof/billing-period.mutation.spec.ts`
- **CONSUMERS** — `src/modules/CONSUMERS/tests/mutation-proof/communication-status.mutation.spec.ts`
- **CONSUMERS** — `src/modules/CONSUMERS/tests/mutation-proof/consumer-profile.mutation.spec.ts`
- **CONSUMERS** — `src/modules/CONSUMERS/tests/mutation-proof/db-cross-validation.mutation.spec.ts`
- **CONSUMERS** — `src/modules/CONSUMERS/tests/mutation-proof/energy-consumption-graph.mutation.spec.ts`
- **CONSUMERS** — `src/modules/CONSUMERS/tests/mutation-proof/energy-flow.mutation.spec.ts`
- **CONSUMERS** — `src/modules/CONSUMERS/tests/mutation-proof/event-log-cards.mutation.spec.ts`
- **CONSUMERS** — `src/modules/CONSUMERS/tests/mutation-proof/event-log-list.mutation.spec.ts`
- **CONSUMERS** — `src/modules/CONSUMERS/tests/mutation-proof/live-load-profile.mutation.spec.ts`
- **CONSUMERS** — `src/modules/CONSUMERS/tests/mutation-proof/nearest-account-ids.mutation.spec.ts`
- **CONSUMERS** — `src/modules/CONSUMERS/tests/mutation-proof/power-quality.mutation.spec.ts`
- **CONSUMERS** — `src/modules/CONSUMERS/tests/mutation-proof/realtime-power.mutation.spec.ts`
- **CONSUMERS** — `src/modules/CONSUMERS/tests/mutation-proof/validate-meter.mutation.spec.ts`
- **CONSUMPTION** — `src/modules/CONSUMPTION/tests/comparison.spec.ts`
- **CONSUMPTION** — `src/modules/CONSUMPTION/tests/consumption-auth-negative.spec.ts`
- **CONSUMPTION** — `src/modules/CONSUMPTION/tests/consumption-edge.spec.ts`
- **CONSUMPTION** — `src/modules/CONSUMPTION/tests/consumption-negative.spec.ts`
- **CONSUMPTION** — `src/modules/CONSUMPTION/tests/consumption.contract.spec.ts`
- **CONSUMPTION** — `src/modules/CONSUMPTION/tests/consumption.db.spec.ts`
- **CONSUMPTION** — `src/modules/CONSUMPTION/tests/hourlyconsumption.spec.ts`
- **CONSUMPTION** — `src/modules/CONSUMPTION/tests/lastthreemonths.spec.ts`
- **CONSUMPTION** — `src/modules/CONSUMPTION/tests/monthlyconsumption.spec.ts`
- **CONSUMPTION** — `src/modules/CONSUMPTION/tests/mutation-proof/consumption.mutation.spec.ts`
- **CONSUMPTION** — `src/modules/CONSUMPTION/tests/mutation-proof/db-cross-validation.mutation.spec.ts`
- **CONSUMPTION** — `src/modules/CONSUMPTION/tests/yearly.spec.ts`
- **DASHBOARD** — `src/modules/DASHBOARD/tests/dashboard.contract.spec.ts`
- **DASHBOARD** — `src/modules/DASHBOARD/tests/dashboard.db.spec.ts`
- **DASHBOARD** — `src/modules/DASHBOARD/tests/mutation-proof/dashboard-metrics.mutation.spec.ts`
- **DASHBOARD** — `src/modules/DASHBOARD/tests/mutation-proof/db-cross-validation.mutation.spec.ts`
- **DASHBOARD** — `src/modules/DASHBOARD/tests/mutation-proof/dtr-unbalance.mutation.spec.ts`
- **DASHBOARD** — `src/modules/DASHBOARD/tests/mutation-proof/dtr-widgets.mutation.spec.ts`
- **DTRS** — `src/modules/DTRS/tests/dtrs.contract.spec.ts`
- **DTRS** — `src/modules/DTRS/tests/dtrs.db.spec.ts`
- **DTRS** — `src/modules/DTRS/tests/mutation-proof/db-cross-validation.mutation.spec.ts`
- **DTRS** — `src/modules/DTRS/tests/mutation-proof/dtrs.mutation.spec.ts`
- **ENERGY-AUDITS** — `src/modules/ENERGY-AUDITS/tests/energy-audits.contract.spec.ts`
- **ENERGY-AUDITS** — `src/modules/ENERGY-AUDITS/tests/energy-audits.db.spec.ts`
- **ENERGY-AUDITS** — `src/modules/ENERGY-AUDITS/tests/hourly-loss-report-dtr.spec.ts`
- **ENERGY-AUDITS** — `src/modules/ENERGY-AUDITS/tests/hourly-loss-report-feeder.spec.ts`
- **ENERGY-AUDITS** — `src/modules/ENERGY-AUDITS/tests/loss-analysis-dtr.spec.ts`
- **ENERGY-AUDITS** — `src/modules/ENERGY-AUDITS/tests/loss-analysis-feeder.spec.ts`
- **ENERGY-AUDITS** — `src/modules/ENERGY-AUDITS/tests/mutation-proof/db-cross-validation.mutation.spec.ts`
- **ENERGY-AUDITS** — `src/modules/ENERGY-AUDITS/tests/mutation-proof/energy-audits.mutation.spec.ts`
- **FEEDER** — `src/modules/FEEDER/tests/feeder.contract.spec.ts`
- **FEEDER** — `src/modules/FEEDER/tests/feeder.db.spec.ts`
- **FEEDER** — `src/modules/FEEDER/tests/mutation-proof/db-cross-validation.mutation.spec.ts`
- **FEEDER** — `src/modules/FEEDER/tests/mutation-proof/feeder-alerts.mutation.spec.ts`
- **FEEDER** — `src/modules/FEEDER/tests/mutation-proof/feeder-daily-consumption.mutation.spec.ts`
- **FEEDER** — `src/modules/FEEDER/tests/mutation-proof/feeder-electrical.mutation.spec.ts`
- **FEEDER** — `src/modules/FEEDER/tests/mutation-proof/feeder-profile.mutation.spec.ts`
- **HES-COMMANDS** — `src/modules/HES-COMMANDS/tests/hes-commands.contract.spec.ts`
- **HES-COMMANDS** — `src/modules/HES-COMMANDS/tests/hes-commands.db.spec.ts`
- **HES-COMMANDS** — `src/modules/HES-COMMANDS/tests/mutation-proof/db-cross-validation.mutation.spec.ts`
- **HES-COMMANDS** — `src/modules/HES-COMMANDS/tests/mutation-proof/hes-commands.mutation.spec.ts`
- **MASTER-DATA** — `src/modules/MASTER-DATA/tests/master-data.contract.spec.ts`
- **MASTER-DATA** — `src/modules/MASTER-DATA/tests/master-data.db.spec.ts`
- **MASTER-DATA** — `src/modules/MASTER-DATA/tests/meter-consumer-e2e.spec.ts`
- **MASTER-DATA** — `src/modules/MASTER-DATA/tests/meter-crud-lifecycle.spec.ts`
- **MASTER-DATA** — `src/modules/MASTER-DATA/tests/meter-dtr-consumer-e2e.spec.ts`
- **MASTER-DATA** — `src/modules/MASTER-DATA/tests/meter-dtr-e2e.spec.ts`
- **MASTER-DATA** — `src/modules/MASTER-DATA/tests/mutation-proof/db-cross-validation.mutation.spec.ts`
- **MASTER-DATA** — `src/modules/MASTER-DATA/tests/mutation-proof/master-data.mutation.spec.ts`
- **MASTER-DATA** — `src/modules/MASTER-DATA/tests/substation.-master.spec.ts`
- **METER-REPLACEMENT** — `src/modules/METER-REPLACEMENT/tests/consumer-detail-negative.spec.ts`
- **METER-REPLACEMENT** — `src/modules/METER-REPLACEMENT/tests/consumer-search-negative.spec.ts`
- **METER-REPLACEMENT** — `src/modules/METER-REPLACEMENT/tests/create-submission-e2e.spec.ts`
- **METER-REPLACEMENT** — `src/modules/METER-REPLACEMENT/tests/create-submission-negative.spec.ts`
- **METER-REPLACEMENT** — `src/modules/METER-REPLACEMENT/tests/dashboard-summary-negative.spec.ts`
- **METER-REPLACEMENT** — `src/modules/METER-REPLACEMENT/tests/meter-replacement.contract.spec.ts`
- **METER-REPLACEMENT** — `src/modules/METER-REPLACEMENT/tests/meter-replacement.db.spec.ts`
- **METER-REPLACEMENT** — `src/modules/METER-REPLACEMENT/tests/meter-validation-negative.spec.ts`
- **METER-REPLACEMENT** — `src/modules/METER-REPLACEMENT/tests/mutation-proof/db-cross-validation.mutation.spec.ts`
- **METER-REPLACEMENT** — `src/modules/METER-REPLACEMENT/tests/mutation-proof/meter-replacement.mutation.spec.ts`
- **METER-REPLACEMENT** — `src/modules/METER-REPLACEMENT/tests/progress-negative.spec.ts`
- **METER-REPLACEMENT** — `src/modules/METER-REPLACEMENT/tests/submission-detail-negative.spec.ts`
- **METER-REPLACEMENT** — `src/modules/METER-REPLACEMENT/tests/submission-history-negative.spec.ts`
- **MIS-DASHBOARD** — `src/modules/MIS-DASHBOARD/tests/mis-dashboard.contract.spec.ts`
- **MIS-DASHBOARD** — `src/modules/MIS-DASHBOARD/tests/mis-dashboard.db.spec.ts`
- **MIS-DASHBOARD** — `src/modules/MIS-DASHBOARD/tests/mutation-proof/db-cross-validation.mutation.spec.ts`
- **MIS-DASHBOARD** — `src/modules/MIS-DASHBOARD/tests/mutation-proof/mis-dashboard.mutation.spec.ts`
- **MODULES-PERMISSIONS** — `src/modules/MODULES-PERMISSIONS/tests/modulepermission-advanced.spec.ts`
- **MODULES-PERMISSIONS** — `src/modules/MODULES-PERMISSIONS/tests/modulepermission-list.spec.ts`
- **MODULES-PERMISSIONS** — `src/modules/MODULES-PERMISSIONS/tests/modulepermission-negative.spec.ts`
- **MODULES-PERMISSIONS** — `src/modules/MODULES-PERMISSIONS/tests/modules-permissions.contract.spec.ts`
- **MODULES-PERMISSIONS** — `src/modules/MODULES-PERMISSIONS/tests/modules-permissions.db.spec.ts`
- **MODULES-PERMISSIONS** — `src/modules/MODULES-PERMISSIONS/tests/mutation-proof/db-cross-validation.mutation.spec.ts`
- **MODULES-PERMISSIONS** — `src/modules/MODULES-PERMISSIONS/tests/mutation-proof/modules-permissions.mutation.spec.ts`
- **NOTIFICATIONS** — `src/modules/NOTIFICATIONS/tests/mutation-proof/db-cross-validation.mutation.spec.ts`
- **NOTIFICATIONS** — `src/modules/NOTIFICATIONS/tests/mutation-proof/notifications.mutation.spec.ts`
- **NOTIFICATIONS** — `src/modules/NOTIFICATIONS/tests/notifications.contract.spec.ts`
- **NOTIFICATIONS** — `src/modules/NOTIFICATIONS/tests/notifications.db.spec.ts`
- **NOTIFICATIONS** — `src/modules/NOTIFICATIONS/tests/notificationsmobile.spec.ts`
- **OVERALL-DASHBOARD** — `src/modules/OVERALL-DASHBOARD/tests/mutation-proof/db-cross-validation.mutation.spec.ts`
- **OVERALL-DASHBOARD** — `src/modules/OVERALL-DASHBOARD/tests/mutation-proof/overall-dashboard.mutation.spec.ts`
- **OVERALL-DASHBOARD** — `src/modules/OVERALL-DASHBOARD/tests/overall-dashboard.contract.spec.ts`
- **OVERALL-DASHBOARD** — `src/modules/OVERALL-DASHBOARD/tests/overall-dashboard.db.spec.ts`
- **REPORTS** — `src/modules/REPORTS/tests/dtrbilling.db.spec.ts`
- **REPORTS** — `src/modules/REPORTS/tests/mutation-proof/db-cross-validation.mutation.spec.ts`
- **REPORTS** — `src/modules/REPORTS/tests/mutation-proof/reports.mutation.spec.ts`
- **REPORTS** — `src/modules/REPORTS/tests/reports.contract.spec.ts`
- **REPORTS** — `src/modules/REPORTS/tests/reports.db.spec.ts`
- **REVENUE-PROTECTION** — `src/modules/REVENUE-PROTECTION/tests/aberration-entry-by-ivrs.auth.spec.ts`
- **REVENUE-PROTECTION** — `src/modules/REVENUE-PROTECTION/tests/aberration-entry-by-ivrs.contract.spec.ts`
- **REVENUE-PROTECTION** — `src/modules/REVENUE-PROTECTION/tests/aberration-entry-by-ivrs.db.spec.ts`
- **REVENUE-PROTECTION** — `src/modules/REVENUE-PROTECTION/tests/aberration-entry-by-ivrs.edge.spec.ts`
- **REVENUE-PROTECTION** — `src/modules/REVENUE-PROTECTION/tests/aberration-entry-by-ivrs.negative.spec.ts`
- **REVENUE-PROTECTION** — `src/modules/REVENUE-PROTECTION/tests/aberration-entry-by-ivrs.spec.ts`
- **REVENUE-PROTECTION** — `src/modules/REVENUE-PROTECTION/tests/aberration-entry-eenltmt.contract.spec.ts`
- **REVENUE-PROTECTION** — `src/modules/REVENUE-PROTECTION/tests/aberration-entry-eenltmt.db.spec.ts`
- **REVENUE-PROTECTION** — `src/modules/REVENUE-PROTECTION/tests/aberration-entry-eenltmt.edge.spec.ts`
- **REVENUE-PROTECTION** — `src/modules/REVENUE-PROTECTION/tests/aberration-entry-eenltmt.spec.ts`
- **REVENUE-PROTECTION** — `src/modules/REVENUE-PROTECTION/tests/aberration-entry-zone.contract.spec.ts`
- **REVENUE-PROTECTION** — `src/modules/REVENUE-PROTECTION/tests/aberration-entry.auth.spec.ts`
- **REVENUE-PROTECTION** — `src/modules/REVENUE-PROTECTION/tests/aberration-entry.db.spec.ts`
- **REVENUE-PROTECTION** — `src/modules/REVENUE-PROTECTION/tests/aberration-entry.negative.spec.ts`
- **REVENUE-PROTECTION** — `src/modules/REVENUE-PROTECTION/tests/aberrations-auth-negative.spec.ts`
- **REVENUE-PROTECTION** — `src/modules/REVENUE-PROTECTION/tests/aberrations-edge.spec.ts`
- **REVENUE-PROTECTION** — `src/modules/REVENUE-PROTECTION/tests/aberrations-negative.spec.ts`
- **REVENUE-PROTECTION** — `src/modules/REVENUE-PROTECTION/tests/aberrations.contract.spec.ts`
- **REVENUE-PROTECTION** — `src/modules/REVENUE-PROTECTION/tests/atr-zone.auth.spec.ts`
- **REVENUE-PROTECTION** — `src/modules/REVENUE-PROTECTION/tests/atr-zone.contract.spec.ts`
- **REVENUE-PROTECTION** — `src/modules/REVENUE-PROTECTION/tests/atr-zone.db.spec.ts`
- **REVENUE-PROTECTION** — `src/modules/REVENUE-PROTECTION/tests/atr-zone.negative.spec.ts`
- **REVENUE-PROTECTION** — `src/modules/REVENUE-PROTECTION/tests/cases-auth-negative.spec.ts`
- **REVENUE-PROTECTION** — `src/modules/REVENUE-PROTECTION/tests/cases-edge.spec.ts`
- **REVENUE-PROTECTION** — `src/modules/REVENUE-PROTECTION/tests/cases-negative.spec.ts`
- **REVENUE-PROTECTION** — `src/modules/REVENUE-PROTECTION/tests/cases.contract.spec.ts`
- **REVENUE-PROTECTION** — `src/modules/REVENUE-PROTECTION/tests/cases.db.spec.ts`
- **REVENUE-PROTECTION** — `src/modules/REVENUE-PROTECTION/tests/mutation-proof/aberration-entry-by-ivrs.mutation.spec.ts`
- **REVENUE-PROTECTION** — `src/modules/REVENUE-PROTECTION/tests/mutation-proof/aberration-entry-eenltmt.mutation.spec.ts`
- **REVENUE-PROTECTION** — `src/modules/REVENUE-PROTECTION/tests/mutation-proof/aberration-entry-zone.mutation.spec.ts`
- **REVENUE-PROTECTION** — `src/modules/REVENUE-PROTECTION/tests/mutation-proof/aberrations.mutation.spec.ts`
- **REVENUE-PROTECTION** — `src/modules/REVENUE-PROTECTION/tests/mutation-proof/atr-zone.mutation.spec.ts`
- **REVENUE-PROTECTION** — `src/modules/REVENUE-PROTECTION/tests/mutation-proof/db-cross-validation-mismatch.mutation.spec.ts`
- **REVENUE-PROTECTION** — `src/modules/REVENUE-PROTECTION/tests/mutation-proof/enum-drift.mutation.spec.ts`
- **REVENUE-PROTECTION** — `src/modules/REVENUE-PROTECTION/tests/mutation-proof/pagination-math.mutation.spec.ts`
- **REVENUE-PROTECTION** — `src/modules/REVENUE-PROTECTION/tests/mutation-proof/schema-missing-required-field.mutation.spec.ts`
- **REVENUE-PROTECTION** — `src/modules/REVENUE-PROTECTION/tests/mutation-proof/schema-strict-extra-field.mutation.spec.ts`
- **ROLE-PERMISSIONS** — `src/modules/ROLE-PERMISSIONS/tests/mutation-proof/db-cross-validation.mutation.spec.ts`
- **ROLE-PERMISSIONS** — `src/modules/ROLE-PERMISSIONS/tests/mutation-proof/role-permissions.mutation.spec.ts`
- **ROLE-PERMISSIONS** — `src/modules/ROLE-PERMISSIONS/tests/role-permissions.contract.spec.ts`
- **ROLE-PERMISSIONS** — `src/modules/ROLE-PERMISSIONS/tests/role-permissions.db.spec.ts`
- **ROLE-PERMISSIONS** — `src/modules/ROLE-PERMISSIONS/tests/rolepermission-advanced.spec.ts`
- **ROLE-PERMISSIONS** — `src/modules/ROLE-PERMISSIONS/tests/rolepermission-list.spec.ts`
- **ROLE-PERMISSIONS** — `src/modules/ROLE-PERMISSIONS/tests/rolepermission-negative.spec.ts`
- **TECHNICAL-ANALYSIS** — `src/modules/TECHNICAL-ANALYSIS/tests/mutation-proof/db-cross-validation.mutation.spec.ts`
- **TECHNICAL-ANALYSIS** — `src/modules/TECHNICAL-ANALYSIS/tests/mutation-proof/technical-report.mutation.spec.ts`
- **TECHNICAL-ANALYSIS** — `src/modules/TECHNICAL-ANALYSIS/tests/mutation-proof/technical-summary.mutation.spec.ts`
- **TECHNICAL-ANALYSIS** — `src/modules/TECHNICAL-ANALYSIS/tests/technical-analysis.contract.spec.ts`
- **TECHNICAL-ANALYSIS** — `src/modules/TECHNICAL-ANALYSIS/tests/technical-analysis.db.spec.ts`
- **USERS-ADMIN** — `src/modules/USERS-ADMIN/tests/mutation-proof/db-cross-validation.mutation.spec.ts`
- **USERS-ADMIN** — `src/modules/USERS-ADMIN/tests/mutation-proof/users-admin.mutation.spec.ts`
- **USERS-ADMIN** — `src/modules/USERS-ADMIN/tests/useradmin-advanced.spec.ts`
- **USERS-ADMIN** — `src/modules/USERS-ADMIN/tests/useradmin-list.spec.ts`
- **USERS-ADMIN** — `src/modules/USERS-ADMIN/tests/useradmin-negative.spec.ts`
- **USERS-ADMIN** — `src/modules/USERS-ADMIN/tests/userdevices.spec.ts`
- **USERS-ADMIN** — `src/modules/USERS-ADMIN/tests/users-admin.contract.spec.ts`
- **USERS-ADMIN** — `src/modules/USERS-ADMIN/tests/users-admin.db.spec.ts`
- **USERS-ADMIN** — `src/modules/USERS-ADMIN/tests/usersecurity.spec.ts`
- **USERS-PROFILE-IMAGE** — `src/modules/USERS-PROFILE-IMAGE/tests/mutation-proof/db-cross-validation.mutation.spec.ts`
- **USERS-PROFILE-IMAGE** — `src/modules/USERS-PROFILE-IMAGE/tests/mutation-proof/users-profile-image.mutation.spec.ts`
- **USERS-PROFILE-IMAGE** — `src/modules/USERS-PROFILE-IMAGE/tests/profileimage-list.spec.ts`
- **USERS-PROFILE-IMAGE** — `src/modules/USERS-PROFILE-IMAGE/tests/profileimage-negative.spec.ts`
- **USERS-PROFILE-IMAGE** — `src/modules/USERS-PROFILE-IMAGE/tests/users-profile-image.contract.spec.ts`
- **USERS-PROFILE-IMAGE** — `src/modules/USERS-PROFILE-IMAGE/tests/users-profile-image.db.spec.ts`
- **UTILS-LOOKUP** — `src/modules/UTILS-LOOKUP/tests/event.spec.ts`
- **UTILS-LOOKUP** — `src/modules/UTILS-LOOKUP/tests/lookup-catalogs.db.spec.ts`
- **UTILS-LOOKUP** — `src/modules/UTILS-LOOKUP/tests/missing-routes.spec.ts`
- **UTILS-LOOKUP** — `src/modules/UTILS-LOOKUP/tests/mutation-proof/catalogs.mutation.spec.ts`
- **UTILS-LOOKUP** — `src/modules/UTILS-LOOKUP/tests/mutation-proof/consumer-search.mutation.spec.ts`
- **UTILS-LOOKUP** — `src/modules/UTILS-LOOKUP/tests/mutation-proof/dtr-search.mutation.spec.ts`
- **UTILS-LOOKUP** — `src/modules/UTILS-LOOKUP/tests/mutation-proof/events.mutation.spec.ts`
- **UTILS-LOOKUP** — `src/modules/UTILS-LOOKUP/tests/networksearch.api.spec.ts`
- **UTILS-LOOKUP** — `src/modules/UTILS-LOOKUP/tests/utils-lookup.contract.spec.ts`
