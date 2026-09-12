# CONSUMPTION — Mutation / Contract / DB proof

```bash
npm run test:consumption:contract
npm run test:consumption:mutation-proof
# CONSUMPTION_DB_SQL_READY=true
npm run test:consumption:db
```

## DB (Part 4)

| Check | Hard | Soft | Notes |
|---|---|---|---|
| Daily pagination total | ✅ API ≤ unscoped consumer-master count | — | JWT data-scope (same pattern as Dashboard / Asset) |
| Consumer identity (msn/name/ivrs/phase) | ✅ vs master subquery | — | Spot sample on page |
| Daily IR/FR/kWh | ✅ when page has readings | ✅ skip if none in fixture window | Archive `T_DPData_CateSP` via `fetchReadingData` SQL |

Gate: `CONSUMPTION_DB_SQL_READY=true`

Verified live: **4/4** (total ≤ DB + 3 identity spots); IR/FR soft-skipped when fixture dates have no page readings.
