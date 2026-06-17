# API defect report (for backend developer)

> Automation failed on a **business/API contract** check. This usually indicates a backend, SQL, or response-mapping issue — not a test-script typo.

## At a glance

| Field | Value |
|-------|-------|
| **API** | Consumption Pattern API |
| **Test** | Validate Consumption Pattern Report |
| **Endpoint** | GET /indore/analysis/commercial/consumption-pattern |
| **Base URL** | https://api.bestinfra.app |
| **Response time** | 3390 ms |
| **HTTP status** | 200 |
| **Failed checks** | 4 / 12 |
| **First failure** | Query Params Validation |
| **Run at** | 2026-06-16T07:45:42.417Z |

## Failure detail

```
[2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m7[39m
Received: [31mundefined[39m
```

## Expected behavior (from backend / contract)

pattern 'zero': all billing rows in window have kWh=0. pattern 'low': SUM(kWh) < threshold.


## Request sent by automation

```json
{
  "month": 7,
  "year": 2025,
  "pattern": "zero",
  "months": 1,
  "threshold": 100,
  "page": 1,
  "pageSize": 100
}
```

## API response (excerpt)

```json
{
  "success": true,
  "data": {
    "columns": [
      {
        "key": "circle",
        "header": "Circle"
      },
      {
        "key": "division",
        "header": "Division"
      },
      {
        "key": "subDivision",
        "header": "Sub Division"
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
        "header": "Consumer Name"
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
        "header": "Meter Sl No"
      },
      {
        "key": "phase",
        "header": "Phase"
      },
      {
        "key": "kWh",
        "header": "kWh"
      }
    ],
    "rows": [
      {
        "id": "meter-19271129",
        "meterLookupId": 80625,
        "circle": "Indore city circle",
        "division": "WEST",
        "subDivision": "GPH",
        "feeder": "AERODRUM 2(CHQ)",
        "dtr": "WSN79",
        "name": "",
        "ivrsNumber": "",
        "tariff": "",
        "msn": "19271129",
        "phase": "3PH 4CT",
        "kWh": 0
      },
      {
        "id": "meter-85112330",
        "meterLookupId": 138777,
        "circle": "Indore city circle",
        "division": "EAST",
        "subDivision": "KHAZRANA",
        "feeder": "PARMANU NAGAR(CHQ)",
        "dtr": "RJ6612",
        "name": "SATI BAI GOKUL",
        "ivrsNumber": "N3374035086",
        "tariff": "LV2.2",
        "msn": "85112330",
        "phase": "1 PH",
        "kWh": 0
      },
      {
        "id": "meter-93027889",
        "meterLookupId": 97051,
        "circle": "Indore city circle",
        "division": "WEST",
        "subDivision": "Sangam Nagar",
        "feeder": "KUSHWAH NAGAR(CHQ)",
        "dtr": "WI4016",
        "name": "SMT.PREMABAI SADASHIV",
        "ivrsNumber": "N3471014120",
        "tariff": "LV1.2",
        "msn": "93027889",
        "phase": "1 PH",
        "kWh": 0
      },
      {
        "id": "meter-93038425",
        "meterLookupId": 109576,
        "circle": "Indore city circle",
        "division": "WEST",
        "subDivision": "Sangam Nagar",
        "feeder": "KUSHWAH NAGAR(CHQ)",
        "dtr": "WI4013",
        "name": "PANKAJ RAMCHARAN GUPTA",
        "ivrsNumber": "N3471009007",
        "tariff": "LV1.2",
        "msn": "93038425",
        "phase": "1 PH",
        "kWh": 0
      },
      {
        "id": "meter-97792503",
        "meterLookupId": 1202,
        "circle": "Indore city circle",
        "division": "CENTRAL",
        "subDivision": "Hawabangla",
        "feeder": "PARMANU NAGAR(CHQ)",
        "dtr": "RJ6610",
        "name": "HIMALI SONPATAKI",
        "ivrsNumber": "N3008001953",
        "tariff": "LV1.2",
        "msn": "97792503",
        "phase": "1 PH",
        "kWh": 0
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 100,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

## All failed validations

1. **Query Params Validation** — [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m7[39m
Received: [31mundefined[39m
2. **Report Pattern Validation** — [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

[1mMatcher error[22m: [31mreceived[39m value must be a string

Received has value: [31mundefined[39m
3. **Pagination Validation** — [2mexpect([22m[31mreceived[39m[2m).[22mtoBeGreaterThan[2m([22m[32mexpected[39m[2m)[22m

[1mMatcher error[22m: [31mreceived[39m value must be a number or bigint

Received has value: [31mundefined[39m
4. **Total Count Validation** — [2mexpect([22m[31mreceived[39m[2m).[22mtoBeGreaterThanOrEqual[2m([22m[32mexpected[39m[2m)[22m

[1mMatcher error[22m: [31mreceived[39m value must be a number or bigint

Received has value: [31mundefined[39m

## Passed checks before failure

- Status Code Validation
- Content Type Validation
- Response Time Validation
- Sensitive Data Validation
- Response Validation
- Mandatory Fields Validation
- Pattern Business Validation
- Duplicate Consumer Validation

## Suggested steps for developer

1. Reproduce with the same query params (Postman/curl) against `https://api.bestinfra.app/indore/analysis/commercial/consumption-pattern`.
2. Compare response with the **Expected behavior** section above.
3. Trace the repository/service method for this report and confirm SQL filters + DTO field names.
4. Fix backend logic or API serialization; re-run: `npx playwright test --grep "Consumption Pattern API"`.

---
*Generated by Indoore API automation — share this file in Jira/Azure DevOps/GitHub issue.*
