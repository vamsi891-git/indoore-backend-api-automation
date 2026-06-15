# API defect report (for backend developer)

> Automation failed on a **business/API contract** check. This usually indicates a backend, SQL, or response-mapping issue — not a test-script typo.

## At a glance

| Field | Value |
|-------|-------|
| **API** | Event Detail Report API |
| **Test** | Validate Event Detail Report API |
| **Endpoint** | GET /indore/reports/event-detail?fromDate=2025-12-20&toDate=2025-12-20&limit=30&organisationLookupId=30 |
| **Base URL** | https://api.bestinfra.app |
| **Response time** | 2867 ms |
| **HTTP status** | 200 |
| **Failed checks** | 6 / 25 |
| **First failure** | Query Echo |
| **Run at** | 2026-06-13T09:15:02.441Z |

## Failure detail

```
[2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m"2025-12-20"[39m
Received: [31mundefined[39m
```

## Expected behavior (from backend / contract)

GET /indore/reports/event-detail should return 200 with success=true, rows[], appliedFilters, previewNote, and pagination metadata for the requested date range and organisationLookupId.


## Request sent by automation

```json
{
  "fromDate": "2025-12-20",
  "toDate": "2025-12-20",
  "organisationLookupId": 30,
  "limit": 30
}
```

## API response (excerpt)

```json
{
  "success": true,
  "data": {
    "columns": [
      {
        "key": "slNo",
        "header": "SL NO"
      },
      {
        "key": "division",
        "header": "Division"
      },
      {
        "key": "zone",
        "header": "Zone"
      },
      {
        "key": "feeder",
        "header": "Feeder"
      },
      {
        "key": "dtr",
        "header": "DTR"
      },
      {
        "key": "name",
        "header": "Name"
      },
      {
        "key": "address",
        "header": "Address"
      },
      {
        "key": "ivrsNumber",
        "header": "IVRS Number"
      },
      {
        "key": "tariff",
        "header": "Tariff"
      },
      {
        "key": "msn",
        "header": "MSN"
      },
      {
        "key": "phase",
        "header": "Phase"
      },
      {
        "key": "eventClassificationName",
        "header": "Event Classification"
      },
      {
        "key": "eventId",
        "header": "Event ID"
      },
      {
        "key": "eventName",
        "header": "Event Name"
      },
      {
        "key": "eventCount",
        "header": "Event Count"
      },
      {
        "key": "durationHhMm",
        "header": "Duration (HH:MM)"
      }
    ],
    "rows": [
      {
        "id": "meter-18139371",
        "slNo": 1,
        "division": "indore central",
        "zone": "Hawa Bangla",
        "feeder": "8022734205",
        "dtr": "RJ6617",
        "name": "BALWANT SINGH NARAYAN SINGH",
        "address": "..143-SAHAKAR NAGAR --.",
        "ivrsNumber": "N3008006528",
        "tariff": "LV1.2",
        "msn": "18139371",
        "phase": "3PH WC",
        "eventClassificationName": "Class_D2",
        "eventId": 554,
        "eventName": "Current unbalance",
        "eventCount": 14,
        "durationHhMm": "0:52"
      },
      {
        "id": "meter-19267374",
        "slNo": 2,
        "division": "indore central",
        "zone": "Hawa Bangla",
        "feeder": "8022734205",
        "dtr": "RJ666",
        "name": "USHA AGARWAL",
        "address": "223 JAWAHAR NAGAR223 JAWAHAR NAGAR -INDORE",
        "ivrsNumber": "N3008013717",
        "tariff": "LV1.2",
        "msn": "19267374",
        "phase": "3PH WC",
        "eventClassificationName": "Class_D2",
        "eventId": 550,
        "eventName": "Voltage unbalance",
        "eventCount": 11,
        "durationHhMm": "0:05"
      },
      {
        "id": "meter-00266693",
        "slNo": 3,
        "division": "",
        "zone": "",
        "feeder": "",
        "dtr": "RJ668",
        "name": "RAJ KUAMR VARMA",
        "address": "13 KRISHNA FORM HOUSE\tHUKMA KHEDI\tINDORE",
        "ivrsNumber": "N3008014798",
        "tariff": "LV1.2",
        "msn": "00266693",
        "phase": "1 PH",
        "eventClassificationName": "Class_D1",
        "eventId": 528,
        "eventName": "Earth loading",
        "eventCount": 9,
        "durationHhMm": "0:38"
      },
      {
        "id": "meter-18139044",
        "slNo": 4,
        "division": "indore central",
        "zone": "Hawa Bangla",
        "feeder": "8022734205",
        "dtr": "RJ661",
        "name": "MIS RAJLAXMI PARADICE",
        "address": "..279 PRAGATI NAGAR  COMMON .",
        "ivrsNumber": "N3008000997",
        "tariff": "LV1.2",
        "msn": "18139044",
        "phase": "3PH WC",
        "eventClassificationName": "Class_D2",
        "eventId": 554,
        "eventName": "Current unbalance",
        "eventCount": 9,
        "durationHhMm": "0:25"
      },
      {
        "id": "meter-18139057",
        "slNo": 5,
        "division": "indore central",
        "zone": "Hawa Bangla",
        "feeder": "8022734205",
        "dtr": "RJ662",
        "name": "NILESH SEWAKANI",
        "address": "25/1/2/4 HRS HERITEJRETI MUNDI F.NO. 701",
        "ivrsNumber": "N3008008151",
        "tariff": "LV1.2",
        "msn": "18139057",
        "phase": "3PH WC",
        "eventClassificationName": "Class_D2",
        "eventId": 554,
        "eventName": "Current unbalance",
        "eventCount": 9,
        "durationHhMm": "0:16"
      },
      {
        "id": "meter-85080389",
        "slNo": 6,
        "division": "indore central",
        "zone": "Hawa Bangla",
        "feeder": "8022734205",
        "dtr": "RJ663",
        "name": "SMT PUSHPALATA DABHORKAR",
        "address": "..MAMTA NAGAR ...",
        "ivrsNumber": "N3008010982",
        "tariff": "LV1.2",
        "msn": "85080389",
        "phase": "1 PH",
        "eventClassificationName": "Class_D1",
        "eventId": 528,
        "eventName": "Earth loading",
        "eventCount": 8,
        "durationHhMm": "0:28"
      },
      {
        "id": "meter-18139174",
        "slNo": 7,
        "division": "indore central",
        "zone": "Hawa Bangla",
        "feeder": "8022734205",
        "dtr": "RJ6614",
        "name": "RASHMI AGARWAL",
        "address": "AGROHA MANSION HUKAMAKHEDISAHKAR NAGAR   .",
        "ivrsNumber": "N3008005178",
        "tariff": "LV1.2",
        "msn": "18139174",
        "phase": "3PH WC",
        "eventClassificationName": "Class_D2",
        "eventId": 554,
        "eventName": "Current unbalance",
        "eventCount": 8,
        "durationHhMm": "0:25"
      },
      {
        "id": "meter-19265407",
        "slNo": 8,
        "division": "indore central",
        "zone": "Hawa Bangla",
        "feeder": "8022734205",
        "dtr": "RJ6619",
        "name": "RAJVEER SINGH PITA HEMSINGH SOLANKI",
        "address": "SERVE NO 202-1AHIR KHEDI INDORE",
        "ivrsNumber": "N3008019445",
        "tariff": "LV2.2",
        "msn": "19265407",
        "phase": "3PH WC",
        "eventClassificationName": "Class_D2",
        "eventId": 555,
        "eventName": "Current bypass",
        "eventCount": 8,
        "durationHhMm": "0:24"
      },
      {
        "id": "meter-18139069",
        "slNo": 9,
        "division": "indore central",
        "zone": "Hawa Bangla",
        "feeder": "8022734205",
        "dtr": "RJ6614",
        "name": "
... (truncated)
```

## All failed validations

1. **Query Echo** — [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m"2025-12-20"[39m
Received: [31mundefined[39m
2. **Date Range Format** — [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31mfalse[39m
3. **Scoped Meter Count** — [2mexpect([22m[31mreceived[39m[2m).[22mtoBeGreaterThanOrEqual[2m([22m[32mexpected[39m[2m)[22m

[1mMatcher error[22m: [31mreceived[39m value must be a number or bigint

Received has value: [31mundefined[39m
4. **Total Row Count** — [2mexpect([22m[31mreceived[39m[2m).[22mtoBeGreaterThanOrEqual[2m([22m[32mexpected[39m[2m)[22m

[1mMatcher error[22m: [31mreceived[39m value must be a number or bigint

Received has value: [31mundefined[39m
5. **Truncation** — [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m"boolean"[39m
Received: [31m"undefined"[39m
6. **Applied Filters** — [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m30[39m
Received: [31mnull[39m

## Passed checks before failure

- Status Code
- Content Type
- Response Time
- Sensitive Data
- Success
- Root Structure
- Preview Note
- Rows Limit
- No Data Scenario
- Rows Present When Total Positive
- Rows Structure
- Consumer Fields
- Meter Fields
- Hierarchy Fields
- Event Fields
- Duration Format
- SL No Sequence
- Unique SL No
- Unique Meter Event Combination

## Suggested steps for developer

1. Reproduce with the same query params (Postman/curl) against `https://api.bestinfra.app/indore/reports/event-detail?fromDate=2025-12-20&toDate=2025-12-20&limit=30&organisationLookupId=30`.
2. Compare response with the **Expected behavior** section above.
3. Trace the repository/service method for this report and confirm SQL filters + DTO field names.
4. Fix backend logic or API serialization; re-run: `npx playwright test --grep "Event Detail Report API"`.

---
*Generated by Indoore API automation — share this file in Jira/Azure DevOps/GitHub issue.*
