import {
  HES_COMMANDS_JOB_POLL_INTERVAL_MS,
  HES_COMMANDS_JOB_POLL_STUCK_MS,
  HES_COMMANDS_JOB_POLL_TIMEOUT_MS,
} from "../../../core/constants/api-timeouts";
import { parsePositiveMs } from "../utils/commands-job-e2e.helper";

export const commandsJobPollConfig = {
  jobPollTimeoutMs: parsePositiveMs(
    process.env.JOB_POLL_TIMEOUT_MS,
    HES_COMMANDS_JOB_POLL_TIMEOUT_MS,
  ),
  jobPollIntervalMs: parsePositiveMs(
    process.env.JOB_POLL_INTERVAL_MS,
    HES_COMMANDS_JOB_POLL_INTERVAL_MS,
  ),
  jobPollStuckMs: parsePositiveMs(
    process.env.JOB_POLL_STUCK_MS,
    HES_COMMANDS_JOB_POLL_STUCK_MS,
  ),
} as const;
