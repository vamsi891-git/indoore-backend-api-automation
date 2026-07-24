# OVERALL-DASHBOARD — Mutation / Contract / DB proof

```bash
npm run test:overall-dashboard:contract
npm run test:overall-dashboard:mutation-proof
# OVERALL_DASHBOARD_DB_SQL_READY=true
npm run test:overall-dashboard:db
```

| Endpoint | Contract | Mutation | DB |
|----------|----------|----------|-----|
| metrics | ✅ | ✅ | ✅ network ≤ L_Network_Lookup / meters |
| dtr communication | ✅ | ✅ | deferred (series) |

Gate: `OVERALL_DASHBOARD_DB_SQL_READY=true`
