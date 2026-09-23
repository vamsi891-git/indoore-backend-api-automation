import { defineConfig } from "@playwright/test";
import dotenv from "dotenv";
import { DEFAULT_TEST_TIMEOUT_MS } from "./src/core/constants/api-timeouts";
import {
  enableStripIndorePrefix,
  isStripIndorePrefixEnabled,
  normalizeApiBaseUrl,
} from "./src/core/utils/api-path.util";
import { env, loadEnv, resolvePlaywrightWorkers } from "./src/core/config/env.schema";

dotenv.config();
loadEnv();

if (isStripIndorePrefixEnabled()) {
  enableStripIndorePrefix();
}

/**
 * Write tests (POST/PUT/PATCH/delete) are off for now.
 * To turn one back on: delete its line here AND change `test.describe.skip`
 * to `test.describe` in that spec file.
 */
const skippedWriteSpecs = [
  "**/create-consumer.spec.ts",
  "**/activation.spec.ts",
  "**/create-dtr.spec.ts",
  "**/create-meter.spec.ts",
  "**/update-meter.spec.ts",
  "**/deactivate-meter.spec.ts",
  "**/bulk-upload-consumers.spec.ts",
  "**/bulk-upload-dtr.spec.ts",
  "**/bulk-upload-meters.spec.ts",
  "**/meter-consumer-e2e.spec.ts",
  "**/meter-dtr-e2e.spec.ts",
  "**/meter-dtr-consumer-e2e.spec.ts",
  "**/meter-crud-lifecycle.spec.ts",
  "**/create-submission-e2e.spec.ts",
  "**/create-submission-negative.spec.ts",
  "**/rolepermission.spec.ts",
  "**/rolepermission-advanced.spec.ts",
  "**/rolepermission-negative.spec.ts",
  "**/00-invite-setup.spec.ts",
  "**/10-invite-preview.spec.ts",
  "**/11-invite-validate.spec.ts",
  "**/15-invite-user.spec.ts",
  "**/90-invite-accept-validate.spec.ts",
  "**/91-invite-e2e.spec.ts",
  "**/92-invite-delete.spec.ts",
  "**/invite-accept.spec.ts",
  "**/zone-wise-atr-events-import.spec.ts",
];

const cli = process.argv.join(" ");
const greppingMutation = /@mutation-proof/.test(cli);
const runMutationProof = env.INCLUDE_MUTATION_PROOF || greppingMutation;

const workers = resolvePlaywrightWorkers();

export default defineConfig({
  globalSetup: require.resolve("./src/global.setup.ts"),
  testDir: "./src",
  testIgnore: skippedWriteSpecs,
  fullyParallel: false,
  workers,
  timeout: DEFAULT_TEST_TIMEOUT_MS,
  retries: env.CI ? 1 : 0,
  grepInvert: runMutationProof ? /@mutation-proof-oneoff/ : /@mutation-proof/,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["json", { outputFile: "reports/playwright-results.json" }],
    [
      "allure-playwright",
      {
        detail: true,
        outputFolder: "allure-results",
        suiteTitle: true,
      },
    ],
  ],
  use: {
    baseURL: normalizeApiBaseUrl(env.BASE_URL),
  },
});
