# COMMERICIAL-ANALYSIS — Mutation / Contract / DB proof

```bash
npm run test:commericial-analysis:contract
npm run test:commericial-analysis:mutation-proof
# COMMERICIAL_ANALYSIS_DB_SQL_READY=true
npm run test:commericial-analysis:db
```

## DB

| Endpoint | Hard | Soft | Notes |
|---|---|---|---|
| Power Factor | ✅ meter spot + archive AVG(pf) + total | — | `Billing_Class_D*` |
| Load Factor | ✅ meter spot + API total ≤ archive LF count | JWT scope gap | `type=LF < 5%` unfiltered |

## API pagination counts

- PF / LF: `rows.length === f(pagination.total, page, limit)`
- PF + LF: domestic + non-domestic ≤ unfiltered (per LF `type`)

Gate: `COMMERICIAL_ANALYSIS_DB_SQL_READY=true`
