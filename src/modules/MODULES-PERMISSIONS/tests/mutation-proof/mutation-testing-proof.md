# MODULES-PERMISSIONS — Mutation / Contract / DB proof

```bash
npm run test:modules-permissions:contract
npm run test:modules-permissions:mutation-proof
# MODULES_PERMISSIONS_DB_SQL_READY=true
npm run test:modules-permissions:db
```

## DB (Part 4)

| Check | Hard | Soft | Notes |
|---|---|---|---|
| Modules catalog count | ✅ exact | — | Unscoped `general.modules` |
| Permissions catalog count | ✅ exact (nested sum) | — | Unscoped `general.permissions` |
| First module spot | ✅ key/name/enabled/permissionCount | — | |

Verified live: **3/3** (19 modules, 56 permissions, spot `billing`).
