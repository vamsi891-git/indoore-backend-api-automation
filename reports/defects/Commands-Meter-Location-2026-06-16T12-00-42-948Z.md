# API defect report (for backend developer)

> Automation failed on a **business/API contract** check. This usually indicates a backend, SQL, or response-mapping issue — not a test-script typo.

## At a glance

| Field | Value |
|-------|-------|
| **API** | Commands Meter Location |
| **Test** | Validate POST /commands/meter-location — set location for known node |
| **Endpoint** | POST /indore/commands/meter-location |
| **Base URL** | https://api.bestinfra.app |
| **Response time** | 350 ms |
| **HTTP status** | 200 |
| **Failed checks** | 2 / 13 |
| **First failure** | HES SOAP Coordinates |
| **Run at** | 2026-06-16T12:00:42.949Z |

## Failure detail

```
[2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"<latitude>0</latitude>"[39m
Received string:    [31m"<soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\"><soap:Body><ns2:setLocationResponse xmlns:ns2=\"http://ws.terminal.service.connode.com/\"><return><createTime>2025-08-13T19:54:51+05:30</createTime><currentFirmwareVersion>ipa3-sei-dlms-insecure-g2:v23.32.0+b55408+g551911e</currentFirmwareVersion><hardwareVersion>ipa3</hardwareVersion><id>6</id><latitude>0.0</latitude><longitude>0.0</longitude><nodeId>00-1b-c5-0c-60-30-52-26</nodeId><nodeType>MESH</nodeType><parentNodeId>00-1b-c5-0c-60-61-3c-52</parentNodeId><port>0</port><status>LOGOUT</status><updateTime>2026-06-16T17:30:42.520+05:30</updateTime></return></ns2:setLocationResponse></soap:Body></soap:Envelope>"[39m
```

## Expected behavior (from backend / contract)

200 with nodeId echo, latitude/longitude, and HES setLocation SOAP response aligned with data fields.


## Request sent by automation

```json
{
  "nodeId": "00-1b-c5-0c-60-30-52-26",
  "meterId": "ABCDEF2400166",
  "latitude": 0,
  "longitude": 0
}
```

## API response (excerpt)

```json
{
  "success": true,
  "data": {
    "nodeId": "00-1b-c5-0c-60-30-52-26",
    "latitude": 0,
    "longitude": 0,
    "hesResponse": "<soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\"><soap:Body><ns2:setLocationResponse xmlns:ns2=\"http://ws.terminal.service.connode.com/\"><return><createTime>2025-08-13T19:54:51+05:30</createTime><currentFirmwareVersion>ipa3-sei-dlms-insecure-g2:v23.32.0+b55408+g551911e</currentFirmwareVersion><hardwareVersion>ipa3</hardwareVersion><id>6</id><latitude>0.0</latitude><longitude>0.0</longitude><nodeId>00-1b-c5-0c-60-30-52-26</nodeId><nodeType>MESH</nodeType><parentNodeId>00-1b-c5-0c-60-61-3c-52</parentNodeId><port>0</port><status>LOGOUT</status><updateTime>2026-06-16T17:30:42.520+05:30</updateTime></return></ns2:setLocationResponse></soap:Body></soap:Envelope>\n"
  }
}
```

## All failed validations

1. **HES SOAP Coordinates** — [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"<latitude>0</latitude>"[39m
Received string:    [31m"<soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\"><soap:Body><ns2:setLocationResponse xmlns:ns2=\"http://ws.terminal.service.connode.com/\"><return><createTime>2025-08-13T19:54:51+05:30</createTime><currentFirmwareVersion>ipa3-sei-dlms-insecure-g2:v23.32.0+b55408+g551911e</currentFirmwareVersion><hardwareVersion>ipa3</hardwareVersion><id>6</id><latitude>0.0</latitude><longitude>0.0</longitude><nodeId>00-1b-c5-0c-60-30-52-26</nodeId><nodeType>MESH</nodeType><parentNodeId>00-1b-c5-0c-60-61-3c-52</parentNodeId><port>0</port><status>LOGOUT</status><updateTime>2026-06-16T17:30:42.520+05:30</updateTime></return></ns2:setLocationResponse></soap:Body></soap:Envelope>"[39m
2. **Full API Contract** — [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"<latitude>0</latitude>"[39m
Received string:    [31m"<soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\"><soap:Body><ns2:setLocationResponse xmlns:ns2=\"http://ws.terminal.service.connode.com/\"><return><createTime>2025-08-13T19:54:51+05:30</createTime><currentFirmwareVersion>ipa3-sei-dlms-insecure-g2:v23.32.0+b55408+g551911e</currentFirmwareVersion><hardwareVersion>ipa3</hardwareVersion><id>6</id><latitude>0.0</latitude><longitude>0.0</longitude><nodeId>00-1b-c5-0c-60-30-52-26</nodeId><nodeType>MESH</nodeType><parentNodeId>00-1b-c5-0c-60-61-3c-52</parentNodeId><port>0</port><status>LOGOUT</status><updateTime>2026-06-16T17:30:42.520+05:30</updateTime></return></ns2:setLocationResponse></soap:Body></soap:Envelope>"[39m

## Passed checks before failure

- Status
- Content Type
- Response Time
- Sensitive Data
- Success Response
- Node ID Echo
- Node ID Format
- Coordinates
- HES SOAP Envelope
- HES SOAP Node ID
- HES SOAP Metadata

## Suggested steps for developer

1. Reproduce with the same query params (Postman/curl) against `https://api.bestinfra.app/indore/commands/meter-location`.
2. Compare response with the **Expected behavior** section above.
3. Trace the repository/service method for this report and confirm SQL filters + DTO field names.
4. Fix backend logic or API serialization; re-run: `npx playwright test --grep "Commands Meter Location"`.

---
*Generated by Indoore API automation — share this file in Jira/Azure DevOps/GitHub issue.*
