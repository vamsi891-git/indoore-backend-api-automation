# METER-REPLACEMENT — Mutation / Contract / DB proof

## Commands

```bash
npm run test:meter-replacement:contract
npm run test:meter-replacement:mutation-proof
# METER_REPLACEMENT_DB_SQL_READY=true
npm run test:meter-replacement:db
```

## Coverage

| Endpoint | Contract | Mutation | DB |
|----------|----------|----------|-----|
| Dashboard summary | ✅ structural | ✅ Zod | ✅ `general.meter_replacement` overall (+ myWork if `METER_REPLACEMENT_SUBMITTED_BY`) |
| Progress | ✅ structural | ✅ Zod | ✅ weekly sum (needs submitter UUID) |
| Consumer search | ✅ structural | ✅ Zod + DQ | soft (via detail) |
| Consumer detail | ✅ structural | ✅ Zod + DQ | ✅ master-consumer SQL |
| Meter validate | ✅ structural | ✅ Zod + DQ | ✅ `findMeterForValidation` |
| Submission history | ✅ structural | ✅ Zod + DQ | ✅ `COUNT(general.meter_replacement)` |
| Submission detail | ✅ structural | ✅ Zod + DQ | ✅ by `mr.id` |
| Create submission | — (mutating) | ✅ Zod | — |
| Bulk validate | — (file upload) | ✅ Zod | — |

Gate: `METER_REPLACEMENT_DB_SQL_READY=true`  
Optional: `METER_REPLACEMENT_CONSUMER_ID`, `METER_REPLACEMENT_VALIDATE_SERIAL`, `METER_REPLACEMENT_SUBMISSION_ID`, `METER_REPLACEMENT_SUBMITTED_BY` (UUID)
