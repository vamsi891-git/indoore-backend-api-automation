# BILLING — Mutation / Contract / DB proof

## Commands

```bash
npm run test:billing:contract
npm run test:billing:mutation-proof
npm run test:billing:db
```

## Coverage

| Endpoint | Contract | Mutation | DB |
|----------|----------|----------|-----|
| billing-data | ✅ structural | ✅ Zod + DQ | ✅ meter header + archive total |
| daywise-billing-data | ✅ structural | ✅ Zod + DQ | soft (same meter header pattern) |

Gate: existing billing DB suite (archive optional via `DB_ARCHIVE_NAME`)
