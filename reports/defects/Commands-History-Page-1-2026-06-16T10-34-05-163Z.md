# API defect report (for backend developer)

> Automation failed on a **business/API contract** check. This usually indicates a backend, SQL, or response-mapping issue — not a test-script typo.

## At a glance

| Field | Value |
|-------|-------|
| **API** | Commands History — Page 1 |
| **Test** | Validate GET /commands/history — page 1 default pagination |
| **Endpoint** | GET /indore/commands/history |
| **Base URL** | https://api.bestinfra.app |
| **Response time** | 1016 ms |
| **HTTP status** | 200 |
| **Failed checks** | 2 / 10 |
| **First failure** | Unique Request IDs |
| **Run at** | 2026-06-16T10:34:05.164Z |

## Failure detail

```
[2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m10[39m
Received: [31m6[39m
```

## Expected behavior (from backend / contract)

skip/take pagination; ORDER BY requested_time DESC; totalRecords/totalPages math.


## Request sent by automation

```json
{
  "page": 1,
  "limit": 10
}
```

## API response (excerpt)

```json
{
  "success": true,
  "message": "Commands history fetched successfully",
  "data": [
    {
      "sno": 1,
      "requestId": 1781604344834117,
      "requestedBy": "Automation User",
      "commandName": "Get Relay Status",
      "selectedMeter": "85092812",
      "selectionType": "Single",
      "requestedTime": "Jun 16, 2026 3:35 PM",
      "status": "IN_PROGRESS",
      "reason": null
    },
    {
      "sno": 2,
      "requestId": 1781604303311775,
      "requestedBy": "Automation User",
      "commandName": "Get Relay Status",
      "selectedMeter": "85092812",
      "selectionType": "Single",
      "requestedTime": "Jun 16, 2026 3:35 PM",
      "status": "SUCCESS",
      "reason": null
    },
    {
      "sno": 3,
      "requestId": 17816042071345080000,
      "requestedBy": "Vamsi krishna",
      "commandName": "Ping Meter",
      "selectedMeter": "85092812",
      "selectionType": "Bulk",
      "requestedTime": "Jun 16, 2026 3:33 PM",
      "status": "SUCCESS",
      "reason": null
    },
    {
      "sno": 4,
      "requestId": 17816042071345080000,
      "requestedBy": "Vamsi krishna",
      "commandName": "Ping Meter",
      "selectedMeter": "00250709",
      "selectionType": "Bulk",
      "requestedTime": "Jun 16, 2026 3:33 PM",
      "status": "SUCCESS",
      "reason": null
    },
    {
      "sno": 5,
      "requestId": 17816042071345080000,
      "requestedBy": "Vamsi krishna",
      "commandName": "Ping Meter",
      "selectedMeter": "99751580",
      "selectionType": "Bulk",
      "requestedTime": "Jun 16, 2026 3:33 PM",
      "status": "SUCCESS",
      "reason": null
    },
    {
      "sno": 6,
      "requestId": 17816042071345080000,
      "requestedBy": "Vamsi krishna",
      "commandName": "Ping Meter",
      "selectedMeter": "19272930",
      "selectionType": "Bulk",
      "requestedTime": "Jun 16, 2026 3:33 PM",
      "status": "SUCCESS",
      "reason": null
    },
    {
      "sno": 7,
      "requestId": 17816042071345080000,
      "requestedBy": "Vamsi krishna",
      "commandName": "Ping Meter",
      "selectedMeter": "20151631",
      "selectionType": "Bulk",
      "requestedTime": "Jun 16, 2026 3:33 PM",
      "status": "SUCCESS",
      "reason": null
    },
    {
      "sno": 8,
      "requestId": 1781603392207563,
      "requestedBy": "Vamsi krishna",
      "commandName": "Get Payment Details",
      "selectedMeter": "99751580",
      "selectionType": "Single",
      "requestedTime": "Jun 16, 2026 3:19 PM",
      "status": "SUCCESS",
      "reason": null
    },
    {
      "sno": 9,
      "requestId": 1781603362239482,
      "requestedBy": "Malleswari Dondapati",
      "commandName": "Get Relay Status",
      "selectedMeter": "85092812",
      "selectionType": "Single",
      "requestedTime": "Jun 16, 2026 3:19 PM",
      "status": "IN_PROGRESS",
      "reason": null
    },
    {
      "sno": 10,
      "requestId": 1781603336539097,
      "requestedBy": "Malleswari Dondapati",
      "commandName": "Get Relay Status",
      "selectedMeter": "85092812",
      "selectionType": "Single",
      "requestedTime": "Jun 16, 2026 3:18 PM",
      "status": "IN_PROGRESS",
      "reason": null
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 43,
    "totalRecords": 421,
    "limit": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

## All failed validations

1. **Unique Request IDs** — [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m10[39m
Received: [31m6[39m
2. **Full API Contract** — [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m10[39m
Received: [31m6[39m

## Passed checks before failure

- Status
- Content Type
- Response Time
- Sensitive Data
- Success Response
- Requested Time DESC
- Pagination Field Types
- Total Records

## Suggested steps for developer

1. Reproduce with the same query params (Postman/curl) against `https://api.bestinfra.app/indore/commands/history`.
2. Compare response with the **Expected behavior** section above.
3. Trace the repository/service method for this report and confirm SQL filters + DTO field names.
4. Fix backend logic or API serialization; re-run: `npx playwright test --grep "Commands History — Page 1"`.

---
*Generated by Indoore API automation — share this file in Jira/Azure DevOps/GitHub issue.*
