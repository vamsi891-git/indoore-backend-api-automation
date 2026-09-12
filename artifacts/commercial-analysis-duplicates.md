# Commercial Analysis — duplicate meters (October 2025)

**Only Power Factor and Load Factor have duplicate meter serials.**  
Maximum Demand, Consumption Compare, Consumption Pattern, and Day/Night have **no duplicate records**.

Same serial on **two DTRs** is allowed. A problem is the same serial **on the same DTR** with the **same value**.

Household = domestic. Non-household = non-domestic.

Meter lists to search: `artifacts/Commercial-Analysis-Meters-to-Refer.xlsx`

## Summary

| Report | Household | Non-household | Duplicates? |
| --- | --- | --- | --- |
| Power Factor Violation | 5,219 | 4,297 (different list) | **Yes** — 180 household serials, 359 non-household serials listed more than once (same PF, usually two DTRs) |
| Load Factor &lt; 5% | 15,266 | Same 15,266 (filter ignored) | **Yes** — 4 serials with the same LF twice |
| Load Factor &gt; 100% | 183 | Same 183 | **No** |
| Load Factor &lt; 5% last 3 months | 14,993 | Same 14,993 | **Yes** — 3 serials with the same LF twice |
| Load Factor &lt; 5% last 6 months | Billing not ready | Billing not ready | — |
| MD &gt; CD last 3 months | 47,116 | 10,884 (different list) | **No duplicates** |
| Sanction load violation | 46,620 | 10,952 (different list) | **No duplicates** |
| Improper MD | 4 | Same 4 | **No duplicates** |
| Consumption Compare Last Month | 2,703 | Same 2,703 | **No duplicates** |
| Compare last year / Abnormal High / Abnormal Low | Billing not ready | Billing not ready | — |
| Zero Consumption | 3,739 | Same 3,739 | **No duplicates** |
| Zero last 3 months | 2,806 | Same 2,806 | **No duplicates** |
| 100 units last 3 months | 7,669 | Same 7,669 | **No duplicates** |
| Other zero / 100-unit / 50% avg | Billing not ready | Billing not ready | — |
| Night Zero Consumption | 1,130 | Same 1,130 | **No duplicates** |
| Night ≤ 10% of day | 2,332 | Same 2,332 | **No duplicates** |

## Load Factor — serials to refer

**LF &lt; 5% (same LF twice — problem):** `85104069`, `85084417`, `97790242`, `92577647`

Allowed (two different LFs): `85081274`

**LF &lt; 5% last 3 months (same LF twice — problem):** `85104069`, `97790242`, `92577647`

Allowed (different LF): `93041980`, `85081274`, `85104049`, `19248672`

**LF &gt; 100%:** no repeated serials

## Power Factor — serials to refer

Open `Commercial-Analysis-Meters-to-Refer.xlsx`:

- Sheet **PF household** — 180 serials (8 appear 3 times: `85084520`, `85087757`, `99750020`, `85107083`, `85108072`, `85134099`, `92573530`, `93030064`)
- Sheet **PF non-household** — 359 serials (3 appear 3 times: `18167081`, `18176537`, `19249695`)

Example household: `14080783` on DTR RJ6610 and RJ6612.  
Example non-household: `85081254` on DTR RJM0000214 and RJM0000181.

## Other reports

No meter list is needed. MD, Compare Last Month, Zero Consumption, 100-unit 3 months, and Day/Night do **not** contain duplicate records.
