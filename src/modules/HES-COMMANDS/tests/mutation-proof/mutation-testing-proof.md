# HES-COMMANDS — Mutation / Contract / DB proof

```bash
npm run test:hes-commands:contract
npm run test:hes-commands:mutation-proof
# HES_COMMANDS_DB_SQL_READY=true
npm run test:hes-commands:db
```

Gate: `HES_COMMANDS_DB_SQL_READY=true` · SQL aligned with `CommandsRepository.getCommandsHistory`
(`general.hes_command_logs` count + request_id/selected spot).

Async E2E: default accepts IN_PROGRESS until HES callback; set `HES_E2E_REQUIRE_COMPLETION=true` for strict FINISHED.
