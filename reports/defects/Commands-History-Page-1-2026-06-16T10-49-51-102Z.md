# API defect report (for backend developer)

> Automation failed on a **business/API contract** check. This usually indicates a backend, SQL, or response-mapping issue — not a test-script typo.

## At a glance

| Field | Value |
|-------|-------|
| **API** | Commands History — Page 1 |
| **Test** | Validate GET /commands/history — page 1 default pagination |
| **Endpoint** | GET /indore/commands/history |
| **Base URL** | https://api.bestinfra.app |
| **Response time** | 251 ms |
| **HTTP status** | 200 |
| **Failed checks** | 1 / 11 |
| **First failure** | Full API Contract |
| **Run at** | 2026-06-16T10:49:51.102Z |

## Failure detail

```
[2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32mtrue[39m
Received: [31mfalse[39m
```

## Expected behavior (from backend / contract)

skip/take pagination; ORDER BY requested_time DESC; bulk jobs may share requestId across meters.


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
      "requestId": 1781606815771240,
      "requestedBy": "Vamsi krishna",
      "commandName": "On Demand Profile",
      "selectedMeter": "85080223",
      "selectionType": "Single",
      "requestedTime": "Jun 16, 2026 4:16 PM",
      "status": "FAILED",
      "reason": "The content on the request is invalid! Meter does not exist. 85080223"
    },
    {
      "sno": 2,
      "requestId": 1781606722499990,
      "requestedBy": "Vamsi krishna",
      "commandName": "Get Metering Mode",
      "selectedMeter": "00250709",
      "selectionType": "Single",
      "requestedTime": "Jun 16, 2026 4:15 PM",
      "status": "SUCCESS",
      "reason": null
    },
    {
      "sno": 3,
      "requestId": 1781606698173648,
      "requestedBy": "Vamsi krishna",
      "commandName": "Get Metering Mode",
      "selectedMeter": "00250709",
      "selectionType": "Single",
      "requestedTime": "Jun 16, 2026 4:14 PM",
      "status": "IN_PROGRESS",
      "reason": null
    },
    {
      "sno": 4,
      "requestId": 1781606667380738,
      "requestedBy": "Vamsi krishna",
      "commandName": "Get Metering Mode",
      "selectedMeter": ", 00250709",
      "selectionType": "Single",
      "requestedTime": "Jun 16, 2026 4:14 PM",
      "status": "REJECTED",
      "reason": "Forbidden: meter not found in MDMS."
    },
    {
      "sno": 5,
      "requestId": 1781606587108942,
      "requestedBy": "Vamsi krishna",
      "commandName": "Get Metering Mode",
      "selectedMeter": "99751580",
      "selectionType": "Single",
      "requestedTime": "Jun 16, 2026 4:13 PM",
      "status": "SUCCESS",
      "reason": null
    },
    {
      "sno": 6,
      "requestId": 1781606406108655,
      "requestedBy": "Vamsi krishna",
      "commandName": "Get Tariff Calendar",
      "selectedMeter": "99751580",
      "selectionType": "Single",
      "requestedTime": "Jun 16, 2026 4:10 PM",
      "status": "SUCCESS",
      "reason": null
    },
    {
      "sno": 7,
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
      "sno": 8,
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
      "sno": 9,
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
      "sno": 10,
      "requestId": 17816042071345080000,
      "requestedBy": "Vamsi krishna",
      "commandName": "Ping Meter",
      "selectedMeter": "00250709",
      "selectionType": "Bulk",
      "requestedTime": "Jun 16, 2026 3:33 PM",
      "status": "SUCCESS",
      "reason": null
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 43,
    "totalRecords": 427,
    "limit": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

## All failed validations

1. **Full API Contract** — [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32mtrue[39m
Received: [31mfalse[39m

## Passed checks before failure

- Status
- Content Type
- Response Time
- Sensitive Data
- Success Response
- Requested Time DESC
- Unique Row Keys (requestId + meter)
- Bulk Job Row Consistency
- Pagination Field Types
- Total Records

## Suggested steps for developer

1. Reproduce with the same query params (Postman/curl) against `https://api.bestinfra.app/indore/commands/history`.
2. Compare response with the **Expected behavior** section above.
3. Trace the repository/service method for this report and confirm SQL filters + DTO field names.
4. Fix backend logic or API serialization; re-run: `npx playwright test --grep "Commands History — Page 1"`.

---
*Generated by Indoore API automation — share this file in Jira/Azure DevOps/GitHub issue.*
