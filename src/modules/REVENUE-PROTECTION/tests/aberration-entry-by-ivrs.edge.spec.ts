import { expect } from "@playwright/test";
import { test } from "../../../fixtures/observability.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { REVENUE_PROTECTION_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { applyAllureTestCaseId } from "../../../core/utils/allure-test-case.helper";
import { assertZodSchema } from "../../../core/utils/zod-validation.helper";
import { AberrationEntryApi } from "../Api/aberration-entry.api";
import {
  aberrationEntryByIvrsMaxResponseTimeMs,
  buildAberrationEntryUpdatePayload,
} from "../Data/aberration-entry-by-ivrs.data";
import { AberrationEntryByIvrsMapper } from "../Mapper/aberration-entry-by-ivrs.mapper";
import { AberrationEntryByIvrsValidator } from "../Validator/aberration-entry-by-ivrs.validator";
import { AberrationEntryByIvrsSuccessResponseSchema } from "../schemas/aberration-entry-by-ivrs.schemas";
import { resolveAberrationEntryIvrsForUpdate } from "../utils/aberration-entry-by-ivrs.helper";
test.describe("Revenue Protection — Aberration Entry By IVRS Edge", () => {
  test.describe.configure({ retries: 1, mode: "serial" });
  test.setTimeout(REVENUE_PROTECTION_TEST_TIMEOUT_MS);

  test(
    "IND-REV-ABE-IVRS-EDGE-001 — IVRS with surrounding whitespace is trimmed",
    { tag: ["@revenue-protection", "@aberration-entry-by-ivrs", "@edge"] },
    async ({ authenticatedApi, obs }) => {
      await applyAllureTestCaseId("IND-REV-ABE-IVRS-EDGE-001");

      const known = await resolveAberrationEntryIvrsForUpdate(authenticatedApi);
      const api = new AberrationEntryApi(authenticatedApi);
      const validation = new ValidationEngine(obs);
      const validator = new AberrationEntryByIvrsValidator();
      const { rawResponse, responseBody, responseTime } =
        await api.patchAberrationEntryByIvrs(
          `  ${known}  `,
          buildAberrationEntryUpdatePayload({ remarks: "whitespace trim" }),
        );
      const assert = new AssertionEngine();
      const mapped = AberrationEntryByIvrsMapper.mapData(responseBody.data);

      validation.execute("Status Validation", () =>
        assert.validateStatusCode(rawResponse, 200, responseBody),
      );
      validation.execute("Response Time", () =>
        assert.validateResponseTime(
          responseTime,
          aberrationEntryByIvrsMaxResponseTimeMs,
        ),
      );
      validation.execute("Schema Validation", () =>
        assertZodSchema(AberrationEntryByIvrsSuccessResponseSchema, responseBody),
      );
      validation.execute("IVRS Echo", () =>
        validator.validateIvrsEcho(mapped, known),
      );
      validation.printSummary("By IVRS — Whitespace Trim", responseTime);
    },
  );

  test(
    "IND-REV-ABE-IVRS-EDGE-002 — GET by IVRS is not registered (Expect Express 404)",
    { tag: ["@revenue-protection", "@aberration-entry-by-ivrs", "@edge"] },
    async ({ authenticatedApi, obs }) => {
      await applyAllureTestCaseId("IND-REV-ABE-IVRS-EDGE-002");

      const ivrsNo = await resolveAberrationEntryIvrsForUpdate(authenticatedApi);
      const validation = new ValidationEngine(obs);
      const path = `/indore/revenue-protection/aberration-entry/${encodeURIComponent(ivrsNo)}`;
      const rawResponse = await authenticatedApi.get(path);
      const text = await rawResponse.text();

      validation.execute("GET not registered", () => {
        expect(rawResponse.status()).toBe(404);
        expect(text).toMatch(/Cannot GET/i);
      });
      validation.printSummary("By IVRS — GET undeployed", 0);
    },
  );
});
