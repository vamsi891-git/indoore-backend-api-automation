# Cursor prompt — billing-analysis networkLookupId data scan

Copy everything inside the box below into a **new Cursor chat** opened on:

`C:\Users\Best Infra\AUTOMATION TESTING\Indoore_backend_testing`

---

```
You are a senior SDET in Indoore_backend_testing.

Scan GET /revenue-protection/billing-analysis for every networkLookupId in a range.
For each id, conclude: DATA AVAILABLE or NO DATA.
Return only the network IDs that have data, so I can paste them into Swagger.

============================================================
ENDPOINT AND FILTERS (keep these exact)
============================================================
GET http://localhost:3000/revenue-protection/billing-analysis
  scopeType=network
  networkLookupId={id}
  fromDate=2020-06-01
  toDate=2020-06-30
  page=1
  limit=10
  sortOrder=desc

Example that I already have:
http://localhost:3000/revenue-protection/billing-analysis?scopeType=network&networkLookupId=2490&fromDate=2020-06-01&toDate=2020-06-30&page=1&limit=10&sortOrder=desc

Range: networkLookupId 1409 through 2490 inclusive (1082 ids).
Do not change dates or other query params. Only increment networkLookupId.

============================================================
AUTH
============================================================
Repo .env already has BASE_URL=http://localhost:3000.
Use the existing login path:
  TokenManager / AuthUtil / global setup (CAPTCHA + TOTP already implemented).
Do NOT invent a new login.
Do NOT print email, password, TOTP, or the Bearer token in chat.
If login fails, stop and say so. Do not guess captcha forever.

============================================================
WHAT “DATA AVAILABLE” MEANS
============================================================
- HTTP 2xx AND (data.total > 0 OR data.items.length > 0 OR data.pagination.total > 0)
  → DATA AVAILABLE. Record id + total.
- HTTP 2xx AND total 0 / empty items
  → NO DATA.
- HTTP 401/403/4xx/5xx or network error
  → ERROR. Record id + status + error.code. Not “no data”.

Unwrap { success, data } if present. Compare only this GET’s body. No second call. No DB.

============================================================
HOW TO RUN
============================================================
- Sequential or concurrency ≤ 4 so localhost is not overloaded.
- Log progress every 100 ids.
- Write JSON to reports/billing-analysis-network-scan-2020-06.json
  { range, withData: [{id, total, itemCount}], withDataIds, emptyCount, errors }
- After the scan, reply in chat with:
  1. How many ids scanned
  2. How many empty
  3. How many errors
  4. The full list of network IDs that HAVE data
  5. Ready-to-paste Swagger URLs for those ids (same query string, only networkLookupId changes)

============================================================
DO NOT
============================================================
- Do not query Postgres.
- Do not commit .env, tokens, or reports/*.json unless I ask.
- Do not leave this scan in the default smoke / test:unit suite as a permanent required test.
  One-off spec or script is fine; say the exact command you used.
- Do not assert a hardcoded total. Live response only.
- Do not skip ids. Full range 1409–2490.

When done, give me the network IDs that have data first.
```
