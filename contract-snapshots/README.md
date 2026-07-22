# Contract snapshots

Git-tracked baselines for API **display/structural** contracts (column keys + headers, row field key sets).

## Revenue Protection — all 6 endpoints

| Endpoint | Snapshot file | Spec |
|---|---|---|
| `GET .../aberrations` | `revenue-protection/aberrations-columns.json` | `aberrations.contract.spec.ts` |
| `GET .../aberrations/detail` (Cases) | `revenue-protection/cases-columns.json` | `cases.contract.spec.ts` |
| `GET .../atr-zone` | `revenue-protection/atr-zone-columns.json` | `atr-zone.contract.spec.ts` |
| `GET .../aberration-entry/zone` | `revenue-protection/aberration-entry-zone-columns.json` | `aberration-entry-zone.contract.spec.ts` |
| `GET .../aberration-entry/eenltmt` | `revenue-protection/aberration-entry-eenltmt-columns.json` | `aberration-entry-eenltmt.contract.spec.ts` |
| `PATCH .../aberration-entry/:ivrsNo` | `revenue-protection/aberration-entry-by-ivrs-response.json` | `aberration-entry-by-ivrs.contract.spec.ts` |

`PATCH` by IVRS has **no** `columns`/`rows` grid — that snapshot locks the success envelope keys (`data.ivrsNo`) only.

## UTILS-LOOKUP — all 14 live endpoints

| Spec | Snapshots |
|---|---|
| `utils-lookup.contract.spec.ts` | `contract-snapshots/utils-lookup/*.json` (consumer/DTR search + catalogs + hierarchies) |

```bash
npm run test:utils-lookup:contract
```

## Nested paths

`snapshotName` may contain `/`. That creates subfolders — it does **not** flatten to a single segment:

| `assertContractSnapshot(...)` name | On-disk file |
|---|---|
| `revenue-protection/cases-columns` | `contract-snapshots/revenue-protection/cases-columns.json` |

On first create, the helper prints:
`[contract-snapshot] Created new snapshot at: contract-snapshots/...`

## When a test fails

A failing contract snapshot means the backend contract changed — for example a column header rename, a column reorder, or a key added/removed.

1. Confirm the change is intentional with the backend/frontend owners.
2. Accept the new baseline:

```bash
# PowerShell — whole Revenue Protection module
$env:UPDATE_CONTRACT_SNAPSHOTS="true"
npm run test:revenue-protection:contract
Remove-Item Env:UPDATE_CONTRACT_SNAPSHOTS
```

3. Commit the updated JSON under this folder so the PR review shows the contract diff.

## Break-and-recover check (verification discipline)

Confirm a snapshot actually fails on drift (not only that it passes when unchanged):

```bash
node scripts/contract-break-recover.mjs contract-snapshots/revenue-protection/<file>.json <spec>.ts mutate
node scripts/contract-break-recover.mjs ... run    # expect FAIL
node scripts/contract-break-recover.mjs ... restore
node scripts/contract-break-recover.mjs ... run    # expect PASS
```

Keep `UPDATE_CONTRACT_SNAPSHOTS=false` during this exercise.

Zod still validates types; these snapshots catch value-level display metadata Zod cannot see.
