# Mutation + contract proof — ASSET-MANAGEMENT

## Contract snapshots — 3/3 live endpoints

| ID | Endpoint | Snapshot |
|---|---|---|
| Network Hierarchy | `GET .../network-hierarchy` | `contract-snapshots/asset-management/network-hierarchy.json` |
| Organisation Hierarchy | `GET .../organisation-hierarchy` | `contract-snapshots/asset-management/organisation-hierarchy.json` |
| DTR Detail | `GET .../dtr/:id` | `contract-snapshots/asset-management/dtr-detail.json` |

```bash
npm run test:asset-management:contract
```

---

## Mutation-proof — pattern coverage (3 endpoints)

Tagged `@mutation-proof`. Fixture-based (no live API) — same style as Revenue Protection.

| Pattern | IDs | Proves |
|---|---|---|
| Missing required field | MUT-AM-NH-001, MUT-AM-OH-001, MUT-AM-DTR-002 | Zod rejects removed keys |
| `.strict()` extra field | MUT-AM-NH-002, MUT-AM-OH-002, MUT-AM-DTR-003 | Unrecognized keys fail |
| Expected levels | MUT-AM-NH-003, MUT-AM-OH-003 | `validateExpectedLevels` fails |
| Duplicate IDs | MUT-AM-NH-004 | `validateDuplicateIds` fails |
| Empty consumer name | MUT-AM-DTR-001, MUT-AM-DTR-005 | Schema + validator |
| Pagination math | MUT-AM-DTR-004 | `validatePaginationConsistency` |
| Malformed meters / ids | MUT-AM-DTR-006…010 | negative id, null meters, bad types, empty account/rr |
| Hierarchy type/null/empty | MUT-AM-NH-005…008, MUT-AM-OH-004…006 | string count, null children, bad ids, empty names |
| DB compare mismatch | MUT-AM-DB-001 | `compareApiToDb` throws |

```bash
npm run test:asset-management:mutation-proof
```

---

## Bottom line

- **Contract:** 3/3 endpoints
- **Mutation:** distinctive Zod + validator + DB-compare proofs for all 3 APIs
- **DB (Part 4):** hard field/business compares in `Db/asset-management-db.compare.ts`;
  soft data-quality in `Db/asset-management-db.validator.ts` (Allure attachments, non-failing)

```bash
npm run test:asset-management:db
```

| Hard check | Soft check |
|---|---|
| DTR `total` ≤ DB meter count | Empty consumerName / accountId / rr / address thresholds |
| Pagination `totalPages = ceil(total/limit)` | Consumers without meters, missing dtrMeter |
| Hierarchy `consumerCount` == detail `total` | Empty network/office codes & names |
| Consumer spot-check vs DB (name, account, meter) | Zero-consumer DTRs counted |
| Visible DTR networks ≤ DB universe | — |