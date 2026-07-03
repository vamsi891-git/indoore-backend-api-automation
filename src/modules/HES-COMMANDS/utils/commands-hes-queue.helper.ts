import { HES_COMMANDS_JOB_MIN_GAP_MS } from "../../../core/constants/api-timeouts";
import { parsePositiveMs } from "./commands-job-e2e.helper";

const minGapMs = parsePositiveMs(
  process.env.HES_JOB_MIN_GAP_MS,
  HES_COMMANDS_JOB_MIN_GAP_MS,
);

let lastHesJobStartedAt = 0;

/** Space HES command POSTs when many @e2e specs share one meter serial. */
export async function waitForHesJobQueueSlot(): Promise<void> {
  const now = Date.now();
  const waitMs = lastHesJobStartedAt + minGapMs - now;
  if (waitMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  lastHesJobStartedAt = Date.now();
}
