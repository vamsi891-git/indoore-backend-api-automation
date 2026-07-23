# FEEDER — Mutation / Contract / DB proof

## Commands

```bash
npm run test:feeder:contract
npm run test:feeder:mutation-proof
# after confirming SQL:
# FEEDER_DB_SQL_READY=true
npm run test:feeder:db
```

## Coverage

| Endpoint | Contract | Mutation | DB |
|----------|----------|----------|-----|
| Profile | ✅ structural | ✅ Zod + DQ | ✅ `L_Network_Lookup` |
| Alerts | ✅ structural | ✅ Zod + DQ | deferred (event archive) |
| Electrical | ✅ structural | ✅ Zod + DQ | ✅ meter serial |
| Daily consumption | ✅ structural | ✅ Zod + DQ | deferred (kWh archive) |

Gate: `FEEDER_DB_SQL_READY=true` · optional `FEEDER_CODE`
