# Mutation testing proof — Revenue Protection (all 6 endpoints)

One-time credibility checks that existing validators/schemas/DB compare logic
**fail for the right reason** when inputs are deliberately wrong.

Tagged `@mutation-proof`.

- **Included** when you run the Revenue Protection module:
  `npm run test:revenue-protection` or `npm run test:module -- revenue-protection --api`
- **Excluded** from a bare `npx playwright test` (whole repo) unless
  `INCLUDE_MUTATION_PROOF=true`

Standalone:

```bash
npm run test:revenue-protection:mutation-proof
```

**Status: 6/6 endpoints covered** · **20 proofs passed** (2026-07-22)

---

## Endpoint matrix

| # | Endpoint | Spec file(s) | Proofs |
|---|---|---|---|
| 1 | `GET .../aberrations/detail` (Cases) | `pagination-math`, `schema-strict-extra-field`, `schema-missing-required-field`, `enum-drift`, `db-cross-validation-mismatch` | MUT-001…005 |
| 2 | `GET .../atr-zone` | `atr-zone.mutation.spec.ts` | MUT-ATZ-001…003 |
| 3 | `GET .../aberrations` | `aberrations.mutation.spec.ts` | MUT-ABE-001…003 |
| 4 | `GET .../aberration-entry/zone` | `aberration-entry-zone.mutation.spec.ts` | MUT-ABE-ENTRY-001…003 |
| 5 | `GET .../aberration-entry/eenltmt` | `aberration-entry-eenltmt.mutation.spec.ts` | MUT-ABE-EEN-001…003 |
| 6 | `PATCH .../aberration-entry/:ivrsNo` | `aberration-entry-by-ivrs.mutation.spec.ts` | MUT-ABE-IVRS-001…003 |

---

## Cases (MUT-001…005) — full pattern

| ID | Mutated | Exercised | Proves |
|---|---|---|---|
| MUT-001 | `totalPages` 3→4 | `CasesValidator.validatePagination` | Pagination math fails |
| MUT-002 | `row.debugFlag=true` | `CasesSuccessResponseSchema` | `.strict()` rejects extras |
| MUT-003 | delete `amountBilled` | schema | Required field named |
| MUT-004 | `status="InProgress"` | `CaseStatusSchema` | Enum drift rejected |
| MUT-005 | API 2800 vs DB 1500 | `compareApiToDb` | Field MISMATCH (no live DB) |

---

## ATR Zone (MUT-ATZ-001…003)

| ID | Mutated | Exercised |
|---|---|---|
| MUT-ATZ-001 | `totalPages` off-by-one | `AtrZoneValidator.validatePagination` |
| MUT-ATZ-002 | extra `debugFlag` | `AtrZoneSuccessResponseSchema` (`.strict()`) |
| MUT-ATZ-003 | delete `amountBilled` | schema |

---

## Aberrations (MUT-ABE-001…003)

| ID | Mutated | Exercised |
|---|---|---|
| MUT-ABE-001 | `totalPages` off-by-one | `AberrationsValidator.validatePagination` |
| MUT-ABE-002 | `attended+pending ≠ noOfCases` | `validateCaseCountConsistency` |
| MUT-ABE-003 | delete `amountBilled` | `AberrationsSuccessResponseSchema` |

**Note:** Aberrations row schema uses `.passthrough()`, not `.strict()` — so we do
**not** claim unexpected-key rejection for this endpoint. Case-count consistency
is the Aberrations-specific assertion instead.

---

## Aberration Entry zone / EENLTMT (MUT-ABE-ENTRY / MUT-ABE-EEN)

Same validator + `AberrationEntrySuccessResponseSchema` (`.strict()`):

| Pattern | Zone | EENLTMT |
|---|---|---|
| Pagination off-by-one | MUT-ABE-ENTRY-001 | MUT-ABE-EEN-001 |
| Extra field rejected | MUT-ABE-ENTRY-002 | MUT-ABE-EEN-002 |
| Missing `amountBilled` | MUT-ABE-ENTRY-003 | MUT-ABE-EEN-003 |

---

## By IVRS PATCH (MUT-ABE-IVRS-001…003)

No columns/pagination — envelope only:

| ID | Mutated | Exercised |
|---|---|---|
| MUT-ABE-IVRS-001 | `data.debugFlag=true` | `AberrationEntryByIvrsSuccessResponseSchema` |
| MUT-ABE-IVRS-002 | delete `ivrsNo` | schema |
| MUT-ABE-IVRS-003 | `ivrsNo=""` | schema (`min(1)`) |

---

## Fixtures

Synthetic only (under `tests/mutation-proof/fixtures/`). No live API/DB required.
