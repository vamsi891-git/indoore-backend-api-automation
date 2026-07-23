# DASHBOARD — Mutation / Contract / DB proof

## Commands

```bash
npm run test:dashboard:contract
npm run test:dashboard:mutation-proof
# DASHBOARD_DB_SQL_READY=true
npm run test:dashboard:db
```

## Coverage

| Endpoint | Contract | Mutation | DB |
|----------|----------|----------|-----|
| Metrics | ✅ structural | ✅ Zod + DQ | ✅ network/meter ≤ universe |
| DTR Summary | ✅ | ✅ | ✅ totalDtrs ≤ active DTRs |
| Consumption / Comm / Power | ✅ | ✅ | deferred (series SQL) |
| Load / Voltage unbalance | ✅ | ✅ | deferred |

Gate: `DASHBOARD_DB_SQL_READY=true`
