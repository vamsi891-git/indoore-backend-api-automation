# MIS-DASHBOARD — Mutation / Contract / DB proof

```bash
npm run test:mis-dashboard:contract
npm run test:mis-dashboard:mutation-proof
# MIS_DASHBOARD_DB_SQL_READY=true
npm run test:mis-dashboard:db
```

## DB (Part 4)

| Check | Hard | Soft | Notes |
|---|---|---|---|
| Comm-stats `totalMeters` | ✅ API ≤ unscoped | — | `getCommStatsLive` without JWT scope |
| Comm-stats `activeMeters` | ✅ API ≤ unscoped active | — | |
| Comm-stats `nonOperationalMeters` | ✅ API ≤ unscoped | — | last_seen ≥ 15m rule |
| Comm-stats `unmappedMeters` | ✅ when API ≤ DB | ✅ soft finding when API > DB | meter_master join / env drift |

Verified live: **3/3** hard checks; unmapped soft-logged when API exceeds unscoped FILTER.
