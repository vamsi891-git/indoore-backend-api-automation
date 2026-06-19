import { test } from "../../../fixtures/api.fixture";
import { ConsumerMasterApi } from "../Api/consumer-master.api";
import {
  masterDataDefaultQuery,
  masterDataPage2Query,
  masterDataSmallPageQuery,
} from "../Data/master-data.common.data";
import { runConsumerMasterValidation } from "./consumer-master.harness";

test.describe("Consumer Master API", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(180_000);

  test(
    "Validate GET /indore/master-data/consumer-master-data — default page",
    { tag: ["@smoke", "@master-data", "@consumer-master"] },
    async ({ authenticatedApi }) => {
      const api = new ConsumerMasterApi(authenticatedApi);
      await runConsumerMasterValidation({
        api,
        query: { ...masterDataDefaultQuery },
        testLabel: "Consumer Master API",
      });
    },
  );

  test(
    "Validate pagination — page 2",
    { tag: ["@master-data", "@consumer-master"] },
    async ({ authenticatedApi }) => {
      const api = new ConsumerMasterApi(authenticatedApi);
      await runConsumerMasterValidation({
        api,
        query: { ...masterDataPage2Query },
        testLabel: "Consumer Master API — Page 2",
      });
    },
  );

  test(
    "Validate pagination — smaller page size",
    { tag: ["@master-data", "@consumer-master"] },
    async ({ authenticatedApi }) => {
      const api = new ConsumerMasterApi(authenticatedApi);
      await runConsumerMasterValidation({
        api,
        query: { ...masterDataSmallPageQuery },
        testLabel: "Consumer Master API — Limit 10",
      });
    },
  );

  test(
    "Validate search q — consumer or meter partial match",
    { tag: ["@master-data", "@consumer-master"] },
    async ({ authenticatedApi }) => {
      const api = new ConsumerMasterApi(authenticatedApi);
      const probe = await api.getConsumerMasterData({ ...masterDataDefaultQuery });
      const firstRow = (probe.responseBody.data?.rows ?? [])[0];
      const searchSource =
        firstRow?.meterSerialNumber?.trim() ||
        firstRow?.consumerName?.trim() ||
        firstRow?.consumerCid?.trim();

      if (!searchSource) {
        test.skip(true, "No searchable field on page 1");
        return;
      }

      const searchTerm = searchSource.slice(0, Math.min(6, searchSource.length));
      await runConsumerMasterValidation({
        api,
        query: { ...masterDataDefaultQuery, q: searchTerm },
        testLabel: "Consumer Master API — Search",
        searchTerm,
      });
    },
  );
});
