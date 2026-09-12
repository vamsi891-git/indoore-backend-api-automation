# REPORTS — Mutation / Contract / DB proof

```bash
npm run test:reports:contract
npm run test:reports:mutation-proof
# REPORTS_DB_SQL_READY=true
npm run test:reports:db
```

## DB (Part 4)

| Check | Hard | Soft | Notes |
|---|---|---|---|
| Active `M_Event` catalog | ✅ non-empty | — | `IsActive IS TRUE` |
| Event-report page rows | ✅ ≤ active catalog | — | JWT / date filters shrink rows |
| Event name spot | ✅ vs `M_Event.Event_Name` | — | First page `eventId` |
| DTR billing meter | ✅ serial (+ optional mf) vs `L_Meter_Lookup` | ✅ skip if no serial | Also covered by `dtrbilling.db.spec.ts` |
| Archive event aggregates | deferred | deferred | Meter-chunked `T_Event_Data_Async` |

Verified live: **4/4** harness checks + existing DTR billing DB spot.
