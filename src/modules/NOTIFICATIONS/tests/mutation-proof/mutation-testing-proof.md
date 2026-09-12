# NOTIFICATIONS — Mutation / Contract / DB proof

```bash
npm run test:notifications:contract
npm run test:notifications:mutation-proof
# NOTIFICATIONS_DB_SQL_READY=true
npm run test:notifications:db
```

## DB (Part 4)

| Check | Hard | Soft | Notes |
|---|---|---|---|
| Stats total/unread/read | ✅ exact vs `user_notifications` | — | JWT `user_id` |
| List pagination total | ✅ exact | — | Same user scope |
| First-row spot | ✅ id/title/isRead/type | ✅ skip if inbox empty | |

Verified live: **3/3** (stats 69/0/69, list total, spot).
