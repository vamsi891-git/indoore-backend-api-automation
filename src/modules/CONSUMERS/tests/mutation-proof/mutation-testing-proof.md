# Mutation + contract + DB proof — CONSUMERS

## Contract snapshots — 14/14

| Endpoint | Snapshot |
|---|---|
| Consumer Profile … Activation | `contract-snapshots/consumers/*.json` |

```bash
UPDATE_CONTRACT_SNAPSHOTS=true npm run test:consumers:contract
# then UPDATE_CONTRACT_SNAPSHOTS=false
npm run test:consumers:contract
```

## Mutation-proof — fixture-only

Tagged `@mutation-proof`. Covers missing field, `.strict()`, invalid types, pagination math (event log list), duplicates (nearest accounts soft), DB compare fixture, data-quality soft.

```bash
npm run test:consumers:mutation-proof
```

## DB (Part 4)

| Endpoint | Hard | Soft | Notes |
|---|---|---|---|
| Consumer Profile | ✅ Account_ID + IVRS vs `V_Consumerdetails` | ✅ | `CONSUMERS_DB_SQL_READY=true` |
| Validate meter | ✅ not-in-system + assigned vs `L_Meter_Lookup` / service point | — | Mirrors `ConsumersService.validateMeter` |
| Activation | ✅ `M_Consumer.IsActiveStatus` | — | Mirrors `updateConsumerActivation` |
| Telemetry / billing / nearest | deferred | deferred | Need `ConsumersRepository` SQL paste |
| Energy Consumption Graph | — | — | Deliberate skip (derived viz) |
| Activation | — | — | Deliberate skip (PATCH action) |

```bash
npm run test:consumers:db
```
