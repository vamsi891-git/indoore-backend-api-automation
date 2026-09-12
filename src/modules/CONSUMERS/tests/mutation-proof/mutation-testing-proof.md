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
| Billing history | ✅ archive floor (`Billing_Class_D1`/`D3`) + length (`min(limit,db)` or pad-to-limit) | ✅ pad / empty calendar | Fixture IVRS with archive rows |
| Communication status | ✅ presence when API + `meter_last_seen` both set | ✅ archive-sourced lastSeen / absent lastSeen | `general.meter_last_seen` |
| Real-time power | ✅ V / I / PF per phase | ✅ null data skips | SP: `meter_ip_today_sp`; TP: archive `T_IPData_CateTP` |
| Power quality | ✅ PF / Hz / neutral / MD kW / MD kVA | ✅ empty/null skips | Archive `T_IPData_CateSP` / `T_IPData_CateTP` (IVRS `1019258045`) |
| Energy / event / nearest | deferred | deferred | Remaining `ConsumersRepository` SQL |
| Energy Consumption Graph | — | — | Deliberate skip (derived viz) |

```bash
npm run test:consumers:db
```

Verified live: **9/9** checks (profile, meter, activation, billing archive, communication lastSeen).
