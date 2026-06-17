# API defect report (for backend developer)

> Automation failed on a **business/API contract** check. This usually indicates a backend, SQL, or response-mapping issue — not a test-script typo.

## At a glance

| Field | Value |
|-------|-------|
| **API** | Commands History — Page 2 |
| **Test** | Validate GET /commands/history — page 2 hasPreviousPage |
| **Endpoint** | GET /indore/commands/history |
| **Base URL** | https://api.bestinfra.app |
| **Response time** | 357 ms |
| **HTTP status** | 200 |
| **Failed checks** | 2 / 8 |
| **First failure** | Page 2 Pagination |
| **Run at** | 2026-06-16T06:38:41.519Z |

## Failure detail

```
expect is not defined
```

## Expected behavior (from backend / contract)

Page 2: hasPreviousPage true; sno 1..limit per page.


## Request sent by automation

```json
{
  "page": 2,
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
      "sno": 11,
      "requestId": 395,
      "requestedBy": "Automation User",
      "commandName": "Get Relay Status",
      "selectedMeter": "99751580",
      "selectionType": "Single",
      "requestedTime": "Jun 15, 2026 3:28 PM",
      "status": "FAILED",
      "reason": "The content on the request is invalid! timeoutTime cannot be earlier than current time."
    },
    {
      "sno": 12,
      "requestId": 394,
      "requestedBy": "Automation User",
      "commandName": "Ping Meter",
      "selectedMeter": "99751580",
      "selectionType": "Single",
      "requestedTime": "Jun 15, 2026 3:28 PM",
      "status": "SUCCESS",
      "reason": null
    },
    {
      "sno": 13,
      "requestId": 393,
      "requestedBy": "Automation User",
      "commandName": "Get Relay Status",
      "selectedMeter": "99751580",
      "selectionType": "Single",
      "requestedTime": "Jun 15, 2026 3:27 PM",
      "status": "FAILED",
      "reason": "The content on the request is invalid! timeoutTime cannot be earlier than current time."
    },
    {
      "sno": 14,
      "requestId": 392,
      "requestedBy": "Automation User",
      "commandName": "Get Relay Status",
      "selectedMeter": "99751580",
      "selectionType": "Single",
      "requestedTime": "Jun 15, 2026 3:20 PM",
      "status": "FAILED",
      "reason": "The content on the request is invalid! timeoutTime cannot be earlier than current time."
    },
    {
      "sno": 15,
      "requestId": 390,
      "requestedBy": "Automation User",
      "commandName": "Ping Meter",
      "selectedMeter": "99751580",
      "selectionType": "Single",
      "requestedTime": "Jun 15, 2026 3:19 PM",
      "status": "SUCCESS",
      "reason": null
    },
    {
      "sno": 16,
      "requestId": 391,
      "requestedBy": "Malleswari Dondapati",
      "commandName": "Get Relay Status",
      "selectedMeter": "00250709",
      "selectionType": "Single",
      "requestedTime": "Jun 15, 2026 3:19 PM",
      "status": "SUCCESS",
      "reason": null
    },
    {
      "sno": 17,
      "requestId": 389,
      "requestedBy": "Automation User",
      "commandName": "Get Relay Status",
      "selectedMeter": "99751580",
      "selectionType": "Single",
      "requestedTime": "Jun 15, 2026 3:19 PM",
      "status": "FAILED",
      "reason": "The content on the request is invalid! timeoutTime cannot be earlier than current time."
    },
    {
      "sno": 18,
      "requestId": 388,
      "requestedBy": "Automation User",
      "commandName": "Ping Meter",
      "selectedMeter": "99751580",
      "selectionType": "Single",
      "requestedTime": "Jun 15, 2026 3:19 PM",
      "status": "SUCCESS",
      "reason": null
    },
    {
      "sno": 19,
      "requestId": 387,
      "requestedBy": "Lingala Krishna Jayanth Rao",
      "commandName": "Get Relay Status",
      "selectedMeter": "20151631",
      "selectionType": "Single",
      "requestedTime": "Jun 15, 2026 3:18 PM",
      "status": "FAILED",
      "reason": "The content on the request is invalid! timeoutTime cannot be earlier than current time."
    },
    {
      "sno": 20,
      "requestId": 386,
      "requestedBy": "Malleswari Dondapati",
      "commandName": "Get Relay Status",
      "selectedMeter": "99751580",
      "selectionType": "Single",
      "requestedTime": "Jun 15, 2026 3:18 PM",
      "status": "FAILED",
      "reason": "The content on the request is invalid! timeoutTime cannot be earlier than current time."
    }
  ],
  "pagination": {
    "currentPage": 2,
    "totalPages": 41,
    "totalRecords": 405,
    "limit": 10,
    "hasNextPage": true,
    "hasPreviousPage": true
  }
}
```

## All failed validations

1. **Page 2 Pagination** — expect is not defined
2. **SNO Resets Per Page** — [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m1[39m
Received: [31m11[39m

## Passed checks before failure

- Status
- Content Type
- Response Time
- Sensitive Data
- Success Response
- Requested Time DESC

## Suggested steps for developer

1. Reproduce with the same query params (Postman/curl) against `https://api.bestinfra.app/indore/commands/history`.
2. Compare response with the **Expected behavior** section above.
3. Trace the repository/service method for this report and confirm SQL filters + DTO field names.
4. Fix backend logic or API serialization; re-run: `npx playwright test --grep "Commands History — Page 2"`.

---
*Generated by Indoore API automation — share this file in Jira/Azure DevOps/GitHub issue.*
