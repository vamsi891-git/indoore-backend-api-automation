# Mutation + contract proof — UTILS-LOOKUP

## Contract snapshots — 14/14 live endpoints

| ID | Endpoint | Snapshot |
|---|---|---|
| IND-UL-CONTRACT-001…014 | All live GET lookups | `contract-snapshots/utils-lookup/*.json` |

```bash
npm run test:utils-lookup:contract
```

---

## DB cross-validation — static catalogs (10/14)

SQL mirrors backend `UtilsRepository` `list*` queries (`Db/lookup-catalog-sql.ts`).

| ID | Catalog | Table |
|---|---|---|
| IND-UL-DB-001 | Connection statuses | `M_Connection_Status` |
| IND-UL-DB-002 | Consumer categories | `M_Category` |
| IND-UL-DB-003 | Payment contracts | `M_PaymentType_Contract` |
| IND-UL-DB-004 | Device manufacturers | `M_Device_Manufacturer` |
| IND-UL-DB-005 | Events | `M_Event` |
| IND-UL-DB-006 | Event classifications | `M_EventClassification` |
| IND-UL-DB-007 | Event priorities | `M_Event.prioritytblrefID` (distinct) |
| IND-UL-DB-008 | Meter phases | `M_ServicePoint_MeterPhase` |
| IND-UL-DB-009 | Organisation hierarchy | `M_Organisation_Hierarchy` |
| IND-UL-DB-010 | Network hierarchy | `M_Network_Hierarchy` |

Enable after confirming schema:

```bash
UTILS_LOOKUP_DB_SQL_READY=true
# optional: UTILS_LOOKUP_DB_SAMPLE_SIZE=3
```

### Deferred (scoped / non-portable COUNT)

| Endpoint | Why deferred |
|---|---|
| Consumer search | JWT `dataScopeWhere` + paged master filter |
| Network / org / DTR search | Subtree + zone / JWT scope |
| Network hierarchy path | Recursive ancestor walk + zone resolve |

Same gate pattern as Revenue Protection (`isDbConfigured()` + module `*_DB_SQL_READY`).

---

## Mutation-proof — pattern coverage (not 14/14 file-per-endpoint)

### Covered (proofs that exist)

| Pattern | Endpoints / IDs | Proves |
|---|---|---|
| Paginated search | Consumer `MUT-UL-CS-*`, DTR `MUT-UL-DTR-*` | `validatePagination` + Zod `.strict()` / missing field |
| Catalog expected values | Connection Status `MUT-UL-CSSTATUS-*` | `validateExpectedValues` + `.strict()` |
| Hierarchy order | Network Hierarchy `MUT-UL-NH-*` | `validateOrderSequence` + `.strict()` |
| **Reference-table allow-list** | Events `MUT-UL-EVT-001` | `validateReferenceTables` (unique to Events) |

### Deliberate SKIP — same pattern as already proven

| Endpoint | Why skip |
|---|---|
| Organisation Hierarchy | Identical `order === index+1` + expected names as Network Hierarchy |
| Consumer Category, Device Manufacturer, Meter Phase, Event Classification, Payment Contract, Event `validateKnownEvents` | Same “must contain seed list” as Connection Status |
| Event Priority ascending / expected `[1,2,3]` | Same ascending + containment pattern |
| Network Search, Organisation Search | No distinctive rules (code typeof / no-op `validateBackendRules`) |

### Bottom line

- **Contract:** fully integrated (14/14).
- **DB:** 10 static catalogs covered; scoped searches deferred (see table above).
- **Mutation:** structural patterns + the one distinct Events allow-list are proven; duplicating expected-value clones for the other catalogs would not add failure-mode coverage.

```bash
npm run test:utils-lookup:mutation-proof
npm run test:utils-lookup
```
