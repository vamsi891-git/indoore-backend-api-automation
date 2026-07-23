/**
 * METER-REPLACEMENT contract snapshots — structural only (counts/IDs drift).
 *
 * First run / intentional shape change:
 *   UPDATE_CONTRACT_SNAPSHOTS=true npm run test:meter-replacement:contract
 */
import { test, expect } from "../../../fixtures/observability.fixture";
import {
  assertContractSnapshot,
  buildLookupItemsContractSnapshot,
} from "../../../core/contract/contract-snapshot.helper";
import { DashboardSummaryApi } from "../Api/dashboard-summary.api";
import { ProgressApi } from "../Api/progress.api";
import { ConsumerSearchApi } from "../Api/consumer-search.api";
import { ConsumerDetailApi } from "../Api/consumer-detail.api";
import { MeterValidationApi } from "../Api/meter-validation.api";
import { SubmissionHistoryApi } from "../Api/submission-history.api";
import { SubmissionDetailApi } from "../Api/submission-detail.api";
import { consumerDetailData } from "../Data/consumer-detail.data";
import { consumerSearchData } from "../Data/consumer-search.data";
import { meterValidationData } from "../Data/meter-validation.data";
import { submissionHistoryData } from "../Data/submission-history.data";
import { submissionDetailData } from "../Data/submission-detail.data";

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function resolveConsumerId(): number {
  const fromEnv = Number(process.env.METER_REPLACEMENT_CONSUMER_ID ?? "");
  if (Number.isFinite(fromEnv) && fromEnv > 0) {
    return Math.floor(fromEnv);
  }
  return consumerDetailData.consumerId;
}

function resolveValidateSerial(): string {
  return (
    process.env.METER_REPLACEMENT_VALIDATE_SERIAL?.trim() ||
    meterValidationData.validMeterSerial
  );
}

function resolveSubmissionId(): number {
  const fromEnv = Number(process.env.METER_REPLACEMENT_SUBMISSION_ID ?? "");
  if (Number.isFinite(fromEnv) && fromEnv > 0) {
    return Math.floor(fromEnv);
  }
  return submissionDetailData.submissionId;
}

async function snapshotEnvelope(
  name: string,
  pathPattern: string,
  responseBody: unknown,
  itemSource?: unknown[],
): Promise<void> {
  const body = asRecord(responseBody);
  expect(body.success).toBe(true);
  const data = body.data;
  const dataRecord = Array.isArray(data) ? {} : asRecord(data);
  const items = itemSource ?? (Array.isArray(data) ? data : []);
  const itemKeys =
    items.length > 0 ? Object.keys(asRecord(items[0])) : Object.keys(dataRecord);
  await assertContractSnapshot(
    name,
    buildLookupItemsContractSnapshot({
      pathPattern,
      dataKeys: Array.isArray(data)
        ? ["data"]
        : Object.keys(dataRecord),
      itemKeys,
    }),
  );
}

test.describe("METER-REPLACEMENT — Contract Snapshots", () => {
  test.setTimeout(180_000);

  test(
    "Dashboard Summary Contract Snapshot",
    { tag: ["@contract-snapshot", "@meter-replacement", "@dashboard-summary"] },
    async ({ authenticatedApi }) => {
      const { responseBody } = await new DashboardSummaryApi(
        authenticatedApi,
      ).getDashboardSummary();
      const data = asRecord(asRecord(responseBody).data);
      await snapshotEnvelope(
        "meter-replacement/dashboard-summary",
        "/indore/meter-replacement/dashboard-summary",
        responseBody,
        [data.overall, data.myWork].filter(Boolean),
      );
    },
  );

  test(
    "Progress Contract Snapshot",
    { tag: ["@contract-snapshot", "@meter-replacement", "@progress"] },
    async ({ authenticatedApi }) => {
      const { responseBody } = await new ProgressApi(
        authenticatedApi,
      ).getProgress();
      const data = asRecord(asRecord(responseBody).data);
      await snapshotEnvelope(
        "meter-replacement/progress",
        "/indore/meter-replacement/progress",
        responseBody,
        [data.weekly, data.monthly].filter(Boolean),
      );
    },
  );

  test(
    "Consumer Search Contract Snapshot",
    { tag: ["@contract-snapshot", "@meter-replacement", "@consumer-search"] },
    async ({ authenticatedApi }) => {
      const { responseBody } = await new ConsumerSearchApi(
        authenticatedApi,
      ).searchConsumer(consumerSearchData.validSearch);
      const data = asRecord(responseBody).data;
      await snapshotEnvelope(
        "meter-replacement/consumer-search",
        "/indore/meter-replacement/consumers/search",
        responseBody,
        Array.isArray(data) ? data : [],
      );
    },
  );

  test(
    "Consumer Detail Contract Snapshot",
    { tag: ["@contract-snapshot", "@meter-replacement", "@consumer-detail"] },
    async ({ authenticatedApi }) => {
      const { responseBody } = await new ConsumerDetailApi(
        authenticatedApi,
      ).getConsumerDetail(resolveConsumerId());
      await snapshotEnvelope(
        "meter-replacement/consumer-detail",
        "/indore/meter-replacement/consumers/{consumerId}",
        responseBody,
      );
    },
  );

  test(
    "Meter Validation Contract Snapshot",
    { tag: ["@contract-snapshot", "@meter-replacement", "@meter-validation"] },
    async ({ authenticatedApi }) => {
      const { responseBody } = await new MeterValidationApi(
        authenticatedApi,
      ).validateMeter(resolveValidateSerial());
      await snapshotEnvelope(
        "meter-replacement/meter-validation",
        "/indore/meter-replacement/meters/validate",
        responseBody,
      );
    },
  );

  test(
    "Submission History Contract Snapshot",
    {
      tag: ["@contract-snapshot", "@meter-replacement", "@submission-history"],
    },
    async ({ authenticatedApi }) => {
      const { responseBody } = await new SubmissionHistoryApi(
        authenticatedApi,
      ).getSubmissionHistory(
        submissionHistoryData.page,
        submissionHistoryData.limit,
      );
      const data = asRecord(asRecord(responseBody).data);
      const items = Array.isArray(data.items) ? data.items : [];
      await snapshotEnvelope(
        "meter-replacement/submission-history",
        "/indore/meter-replacement/submissions/history",
        responseBody,
        items,
      );
    },
  );

  test(
    "Submission Detail Contract Snapshot",
    { tag: ["@contract-snapshot", "@meter-replacement", "@submission-detail"] },
    async ({ authenticatedApi }) => {
      const { responseBody } = await new SubmissionDetailApi(
        authenticatedApi,
      ).getSubmissionDetail(resolveSubmissionId());
      const data = asRecord(asRecord(responseBody).data);
      await snapshotEnvelope(
        "meter-replacement/submission-detail",
        "/indore/meter-replacement/submissions/{submissionId}",
        responseBody,
        [data.consumer, data.oldMeter, data.newMeter].filter(Boolean),
      );
    },
  );
});
