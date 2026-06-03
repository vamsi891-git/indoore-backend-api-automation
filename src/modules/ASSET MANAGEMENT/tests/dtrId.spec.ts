import { test } from "../../../../src/fixtures/api.fixture";
import { DtrDetailApi} from "../Api/DtrId.api";
import { DtrDetailMapper} from "../Mapper/dtrId.mapper";
import { DtrDetailValidator } from "../Validator/dtrId.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker} from "../../../../src/core/utils/performancetracker";
import { DtrDetailTestData } from "../Data/DtrId.data";
test.describe(
    "DTR Detail API",
    () => {
        test(
            "Validate DTR Detail API",
            {
                tag: [
                    "@smoke",
                    "@dtr"
                ]
            },
            async ({authenticatedApi}) => {
                const api =new DtrDetailApi(authenticatedApi);
                const {
                    rawResponse,
                    responseBody,
                    responseTime
                } = await api.getDtrDetails(DtrDetailTestData.dtrId, DtrDetailTestData.page, DtrDetailTestData.limit);
                await PerformanceTracker.track(
                    rawResponse,
                    "DTR Detail API",
                    `${process.env.BASE_URL}/indore/asset-management/dtr/2339?page=1&limit=20`,
                    responseTime
                );

                const assert =new AssertionEngine();
                const validation =new ValidationEngine();
                validation.execute("Status",() =>
                        assert.validateStatusCode(rawResponse,200)
                );
                validation.execute("Content",() =>
                        assert.validateContentType(rawResponse)
                );
                validation.execute("Response Time",() =>
                        assert.validateResponseTime(responseTime,60000)
                );
                validation.execute("Security",() =>
                        assert.validateSensitiveData(responseBody)
                );
                const data =DtrDetailMapper.mapData(responseBody.data);
                const validator =new DtrDetailValidator();
                validation.execute("DTR",() =>
                        validator.validateDtrFields(data)
                );
                validation.execute("Consumers",() =>
                        validator.validateConsumers(data)
                );
                validation.execute("Pagination",() =>
                        validator.validatePagination(data)
                );
                validation.execute("Duplicate Consumer",() =>
                        validator.validateDuplicateConsumers(data)
                );
                validation.printSummary("DTR Detail API",
                    responseTime
                )
            })
    })