# TECHNICAL-ANALYSIS — Mutation / Contract / DB proof

## Commands

```bash
npm run test:technical-analysis:contract
npm run test:technical-analysis:mutation-proof
# after confirming SQL:
# TECHNICAL_ANALYSIS_DB_SQL_READY=true
npm run test:technical-analysis:db
```

## Coverage

| Endpoint | Contract | Mutation | DB |
|----------|----------|----------|-----|
| Technical Summary | ✅ structural | ✅ Zod + DQ | ✅ summary↔report total |
| Technical Report | ✅ structural grid | ✅ Zod + DQ | ✅ V_Consumerdetails spot-check |
| Event/duration archive SQL | — | — | deferred (paste repository SQL) |

Gate: `TECHNICAL_ANALYSIS_DB_SQL_READY=true`
