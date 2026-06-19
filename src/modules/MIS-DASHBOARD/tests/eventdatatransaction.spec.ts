import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { EventTransactionApi } from "../Api/eventdatatransaction.api";
import { eventTransactionQueries } from "../Data/eventdatatransaction.data";
import { EventTransactionMapper } from "../Mapper/eventdatatransaction.mapper";
import { EventTransactionValidator } from "../Validator/eventdatatransaction.validator";
test.describe("MIS Event Transaction API", () => {
        eventTransactionQueries.forEach(query => {
                test(`${query.reportType}-${query.period}`,
                        async ({ authenticatedApi }) => {
                                if (query.period === "monthly") {
                                        test.skip(true,"Known backend defect: monthly timeout/Internal Server Error");
                                }
                                const api = new EventTransactionApi(authenticatedApi);
                                const result = await api.getTransactionData(query);
                                expect(result.rawResponse.status()).toBe(200);
                                const data = EventTransactionMapper.map(result.responseBody.data);
                                const validator = new EventTransactionValidator();
                                validator.validateResponse(result.responseBody);
                                validator.validate(data);
                                validator.validateAnomalies(data);
                        });
        });
});