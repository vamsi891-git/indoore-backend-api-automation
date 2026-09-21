# Decisions

Recorded so a solo maintainer (or a future teammate) does not re-litigate settled choices.

## One auth session

**Decision:** Login once in `global.setup.ts`; reuse `playwright/.auth/token.json` via `TokenManager`.

**Why:** Captcha + TOTP make per-test login slow and rate-limit prone (`429 TOO_MANY_REQUESTS`). Parallel workers share a file lock (`refresh.lock`) and coalesce in-process refresh so tokens are not corrupted.

**Not:** Fresh login per spec. That burns captchas and trips the auth API.

## GET-only on production

**Decision:** Default commands and module scripts exercise GET/list APIs. Write specs stay in `skippedWriteSpecs` / `test.describe.skip`.

**Why:** This suite proves **data display** completeness for MDMS screens. Creating meters, DTRs, or consumers on a shared env is a data incident waiting to happen. `ALLOW_WRITE_TESTS=true` must never be set on production.

**Not:** Full CRUD E2E as the default gate.

## Zod for shape; snapshots for header order

**Decision:**

- **Zod** (module `schemas/`) asserts envelope and field types.
- **`EXPECTED_*_COLUMNS` in `Data/*.data.ts`** asserts table header text/order the UI care about.
- **`@contract-snapshot`** (extras) freezes richer display metadata when needed.

**Why:** Zod does not see “Column A renamed to Column B” if both are strings. Header lists catch UI-breaking renames without hardcoding row values. Snapshots catch order/key drift beyond what day-to-day GET specs need.

**Not:** Asserting live fleet totals (`totalConsumers === 133137`) in regression — those drift daily and create noise.

## Retry ownership

**Decision:** Only `TimedApiClient` GET retries (429 / 502–504) via `http-retry.policy`. Specs and `authenticated.request` do not stack their own HTTP retries on GET.

**Why:** Nested retries turn a short outage into a 10-minute flake and amplify rate limits. Writes never retry (skipped on prod; must not hide 5xx).

## Optional subsystems fenced (`src/extras/`)

**Decision:** Postgres compare, contract snapshots, defect LLM, and observability JSONL live under `src/extras/`. Default GET / `@smoke` must not require `DB_*` or LLM keys. `OBS_DISABLED=1` silences traces and perf HEAD probes.

**Why:** Most day-to-day runs are API-only on a laptop without VPN DB access. Optional power stays available for `@db` / `@contract-snapshot` / defect triage without coupling the happy path.

## Workers default to 1

**Decision:** Config and module scripts default to one worker. `WORKERS` / `PLAYWRIGHT_WORKERS` can raise the count (capped at 8) for experiments; CI keeps 1.

**Why:** Solo maintainer + shared token file. Parallelism is optional, not the default.

## Empty lists valid in regression; smoke may require data

**Decision:** Regression treats empty `rows` as a valid 200. Smoke cases with `nonEmptyExpected: true` must see at least one primary row (or equivalent non-empty signal).

**Why:** A quiet day must not fail hundreds of regression tests. Smoke still catches “UI would be blank” for critical screens when data is expected.

## Thin Api factory — rejected for now

**Decision:** Keep copy-pasted `TimedApiClient` subclasses (and scaffold that pattern). Do not add a `createGetApi` factory layer.

**Why:** Solo maintainer readability beats one more abstraction. Scaffold already copies the existing module shape.
