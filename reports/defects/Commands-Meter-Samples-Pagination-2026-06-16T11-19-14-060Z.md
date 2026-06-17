# API defect report (for backend developer)

> Automation failed on a **business/API contract** check. This usually indicates a backend, SQL, or response-mapping issue — not a test-script typo.

## At a glance

| Field | Value |
|-------|-------|
| **API** | Commands Meter Samples — Pagination |
| **Test** | Validate POST /commands/meter-samples — paginated startId |
| **Endpoint** | POST /indore/commands/meter-samples |
| **Base URL** | https://api.bestinfra.app |
| **Response time** | 401 ms |
| **HTTP status** | 200 |
| **Failed checks** | 1 / 6 |
| **First failure** | Paginated ID Window |
| **Run at** | 2026-06-16T11:19:14.060Z |

## Failure detail

```
[2mexpect([22m[31mreceived[39m[2m).[22mtoBeLessThanOrEqual[2m([22m[32mexpected[39m[2m)[22m

Expected: <= [32m38510[39m
Received:    [31m79374[39m
```

## Expected behavior (from backend / contract)

startId + count window returns sequential meterSampleId values.


## Request sent by automation

```json
{
  "count": 5,
  "startId": 6
}
```

## API response (excerpt)

```json
{
  "success": true,
  "data": [
    {
      "meterSampleId": 6,
      "sequenceNumber": 79368,
      "deviceId": "ABCDEF2400166",
      "nodeId": "00-1b-c5-0c-60-30-52-26",
      "profileObisCode": "AQBeWwD/",
      "formattedProfileObisCode": "1.0.94.91.0.255",
      "registerValues": [
        {
          "registerObisCode": "AAABAAD/",
          "formattedRegisterObisCode": "0.0.1.0.0.255",
          "formattedValue": "2025-07-23T08:30:24+05:30",
          "attributeId": 2,
          "unit": 0,
          "scalar": 0,
          "registerValue": "CQwH6QcXAwgeGP8BSgA=",
          "description": null
        },
        {
          "registerObisCode": "AQAMBwD/",
          "formattedRegisterObisCode": "1.0.12.7.0.255",
          "formattedValue": "229.99 V",
          "attributeId": 2,
          "unit": 35,
          "scalar": -2,
          "registerValue": "ElnX",
          "description": null
        },
        {
          "registerObisCode": "AQALBwD/",
          "formattedRegisterObisCode": "1.0.11.7.0.255",
          "formattedValue": "0.00 A",
          "attributeId": 2,
          "unit": 33,
          "scalar": -2,
          "registerValue": "EgAA",
          "description": null
        },
        {
          "registerObisCode": "AQBbBwD/",
          "formattedRegisterObisCode": "1.0.91.7.0.255",
          "formattedValue": "0.00 A",
          "attributeId": 2,
          "unit": 33,
          "scalar": -2,
          "registerValue": "EgAA",
          "description": null
        },
        {
          "registerObisCode": "AQANBwD/",
          "formattedRegisterObisCode": "1.0.13.7.0.255",
          "formattedValue": "1.00",
          "attributeId": 2,
          "unit": 255,
          "scalar": -2,
          "registerValue": "D2Q=",
          "description": null
        },
        {
          "registerObisCode": "AQAOBwD/",
          "formattedRegisterObisCode": "1.0.14.7.0.255",
          "formattedValue": "50.0 Hz",
          "attributeId": 2,
          "unit": 44,
          "scalar": -1,
          "registerValue": "EgH0",
          "description": null
        },
        {
          "registerObisCode": "AQAJBwD/",
          "formattedRegisterObisCode": "1.0.9.7.0.255",
          "formattedValue": "0 VA",
          "attributeId": 2,
          "unit": 28,
          "scalar": 0,
          "registerValue": "BgAAAAA=",
          "description": null
        },
        {
          "registerObisCode": "AQABBwD/",
          "formattedRegisterObisCode": "1.0.1.7.0.255",
          "formattedValue": "0 W",
          "attributeId": 2,
          "unit": 27,
          "scalar": 0,
          "registerValue": "BgAAAAA=",
          "description": null
        },
        {
          "registerObisCode": "AQABCAD/",
          "formattedRegisterObisCode": "1.0.1.8.0.255",
          "formattedValue": "950 Wh",
          "attributeId": 2,
          "unit": 30,
          "scalar": 1,
          "registerValue": "BgAAAF8=",
          "description": null
        },
        {
          "registerObisCode": "AQAJCAD/",
          "formattedRegisterObisCode": "1.0.9.8.0.255",
          "formattedValue": "1050 VAh",
          "attributeId": 2,
          "unit": 31,
          "scalar": 1,
          "registerValue": "BgAAAGk=",
          "description": null
        },
        {
          "registerObisCode": "AQABBgD/",
          "formattedRegisterObisCode": "1.0.1.6.0.255",
          "formattedValue": "0 W",
          "attributeId": 2,
          "unit": 27,
          "scalar": 0,
          "registerValue": "EgAA",
          "description": null
        },
        {
          "registerObisCode": "AQABBgD/",
          "formattedRegisterObisCode": "1.0.1.6.0.255",
          "formattedValue": "",
          "attributeId": 5,
          "unit": 0,
          "scalar": 0,
          "registerValue": "CQz///////////8BSgA=",
          "description": null
        },
        {
          "registerObisCode": "AQAJBgD/",
          "formattedRegisterObisCode": "1.0.9.6.0.255",
          "formattedValue": "0 VA",
          "attributeId": 2,
          "unit": 28,
          "scalar": 0,
          "registerValue": "EgAA",
          "description": null
        },
        {
          "registerObisCode": "AQAJBgD/",
          "formattedRegisterObisCode": "1.0.9.6.0.255",
          "formattedValue": "",
          "attributeId": 5,
          "unit": 0,
          "scalar": 0,
          "registerValue": "CQz///////////8BSgA=",
          "description": null
        },
        {
          "registerObisCode": "AABeWw7/",
          "formattedRegisterObisCode": "0.0.94.91.14.255",
          "formattedValue": "622224 min.",
          "attributeId": 2,
          "unit": 6,
          "scalar": 0,
          "registerValue": "BgAJfpA=",
          "description": null
        },
        {
          "registerObisCode": "AABeWwD/",
          "formattedRegisterObisCode": "0.0.94.91.0.255",
          "formattedValue": "23",
          "attributeId": 2,
          "unit": 0,
          "scalar": 0,
          "registerValue": "BgAAABc=",
          "description": null
        },
        {
          "registerObisCode": "AAAAAQD/",
          "formattedRegisterObisCode": "0.0.0.1.0.255",
          "formattedValue": "29",
          "attributeId": 2,
          "unit": 0,
          "scalar": 0,
          "registerValue": "BgAAAB0=",
          "description": null
        },
        {
          "registerObisCode": "AABgAgD/",
          "formattedRegisterObisCode": "0.0.96.2.0.255",
          "formattedValue": "155",
          "attributeId": 2,
          "unit": 0,
          "scalar": 0,
          "registerValue": "EZs=",
          "description": null
        },
        {
          "registerObisCode": "AQACCAD/",
          "formattedRegisterObisCode": "1.0.2.8.0.255",
          "formattedValue": "0 Wh",
          "attributeId": 2,
          "unit": 30,
          "scalar": 1,
          "registerValue": "BgAAAAA=",
          "description": null
        },
        {
          "re
... (truncated)
```

## All failed validations

1. **Paginated ID Window** — [2mexpect([22m[31mreceived[39m[2m).[22mtoBeLessThanOrEqual[2m([22m[32mexpected[39m[2m)[22m

Expected: <= [32m38510[39m
Received:    [31m79374[39m

## Passed checks before failure

- Status
- Content Type
- Response Time
- Sensitive Data
- Success Response

## Suggested steps for developer

1. Reproduce with the same query params (Postman/curl) against `https://api.bestinfra.app/indore/commands/meter-samples`.
2. Compare response with the **Expected behavior** section above.
3. Trace the repository/service method for this report and confirm SQL filters + DTO field names.
4. Fix backend logic or API serialization; re-run: `npx playwright test --grep "Commands Meter Samples — Pagination"`.

---
*Generated by Indoore API automation — share this file in Jira/Azure DevOps/GitHub issue.*
