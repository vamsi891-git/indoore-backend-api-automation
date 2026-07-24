# MASTER-DATA — Mutation / Contract / DB proof

```bash
npm run test:master-data:contract
npm run test:master-data:mutation-proof
# MASTER_DATA_DB_SQL_READY=true
npm run test:master-data:db
```

Gate: `MASTER_DATA_DB_SQL_READY=true` · SQL aligned with `MasterDataRepository` (feeder/substation base SQL, DTR-type meter grain, meter/consumer counts). Optional: `DTR_METER_TYPE_TBL_REF_ID` (default `2`).

List APIs covered by contract + mutation + DB: meter, DTR, consumer, feeder, substation, meter-communication.
