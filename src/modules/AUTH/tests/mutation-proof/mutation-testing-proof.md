# AUTH — Mutation / Contract / DB proof

```bash
npm run test:auth:contract
npm run test:auth:mutation-proof
# AUTH_DB_SQL_READY=true
npm run test:auth:db
```

Gate: `AUTH_DB_SQL_READY=true` · SQL aligned with `AuthRepository` (`general.user_credentials`, `auth_devices`, `user_invitations`, `refresh_tokens`).

Read surfaces: `/me`, `/devices`, `/invitations/mine`.
