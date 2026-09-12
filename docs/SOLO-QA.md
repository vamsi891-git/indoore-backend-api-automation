# Solo tester guide

This project is run by **one person**. Default rule: keep tests **read-only**, **one worker**, and **easy to debug**.

**API checklist:** [API-COVERAGE.md](./API-COVERAGE.md) — what each endpoint checks, and a gap list.

## What we currently do

| Area | What we do | Why |
|------|------------|-----|
| GET lists (meter / DTR / consumer / feeder / …) | Run them | Safe, checks the live API |
| POST add, PUT update, deactivate, bulk upload, invite, create role | Skipped | They change data |
| Validate add/DTR meter | Run GET; skip a case if we cannot find a matching meter | No auto-create meters |
| Contract snapshots | Run them | Tells you when JSON keys change |
| DB tests | Run only if DB env is set | Needs Postgres |
| Mutation-proof | Off unless you run `test:master-data:mutation-proof` | Extra / confusing |

## Commands

```bash
copy .env.example .env
# set BASE_URL, EMAIL, PASSWORD
# if login uses 2FA: TOTP_SECRET=...

npm install
npm run test:master-data
```

Always **one worker**. Do not change that unless you have a reason.

## If a list test fails on Columns

The API changed a column **header** (or dropped a column).

1. Open `src/modules/MASTER-DATA/Data/<name>.data.ts`
2. Change `EXPECTED_*_COLUMNS` to match the API
3. Re-run that spec

## If validate-dtr skips

Put a real serial in `.env` that matches the case:

```
VALIDATE_DTR_METER_VALID_SERIAL=
VALIDATE_DTR_METER_ON_DTR_SERIAL=
VALIDATE_DTR_METER_INACTIVE_SERIAL=
VALIDATE_DTR_METER_ASSIGNED_SERIAL=
```

If the serial is wrong, the test skips. It will not create a meter.

## Turn a write test back on

1. Remove its file name from `skippedWriteSpecs` in `playwright.config.ts`
2. In the spec, change `test.describe.skip` → `test.describe`

## If audit logs show "Meter Created" from tests

Those `CM…` meters were created **yesterday** by an old helper that ran during validate-add / validate-dtr (it POSTed add-meter to get serials). Create specs were already commented; the helper still wrote.

**Now:** that helper only does GET. Create APIs throw unless `ALLOW_WRITE_TESTS=true`. Do **not** set that on production.

**What to do with leftover meters:** do not delete them from this repo (that is another write). Ask the backend / DBA to remove test serials like `CM%` if they should not stay in production. After that, only run GET tests.

## Login / 2FA

Global setup logs in once. If the API asks for 2FA, set `TOTP_SECRET` from the authenticator QR (keep it in `.env` only).
