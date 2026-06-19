import { test } from "../../../../src/fixtures/api.fixture";
import {OrganisationHierarchyApi} from "../Api/organizationhierarchy.api";
import {OrganisationHierarchyMapper}from "../Mapper/organizationhierarchy.mapper";
import { OrganisationHierarchyValidator} from "../Validator/organizationhierarchy.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import {ValidationEngine} from "../../../core/engine/validation.engine";
import { PerformanceTracker} from "../../../../src/core/utils/performancetracker";
test.describe("Organisation Hierarchy API",() => {
        test("Validate Organisation Hierarchy API",
            {
                tag: [
                    "@smoke",
                    "@hierarchy"
                ]
            },
            async ({authenticatedApi}) => {
                const api =new OrganisationHierarchyApi(authenticatedApi);
                const {
                    rawResponse,
                    responseBody,
                    responseTime
                } =await api.getOrganisationHierarchy();
                await PerformanceTracker.track(
                    rawResponse,
                    "Organisation Hierarchy API",
                    `${process.env.BASE_URL}/indore/asset-management/organisation-hierarchy`,
                    responseTime
                );
                const assert =new AssertionEngine();
                const validation =new ValidationEngine();
                validation.execute("Status Validation",() =>
                     assert.validateStatusCode(rawResponse,200)
                );
                validation.execute("Content Validation",() => 
                    assert.validateContentType(rawResponse)
                );
                validation.execute("Response Time",() =>
                     assert.validateResponseTime(responseTime,60000)
                );
                validation.execute("Security Validation",() =>
                    assert.validateSensitiveData(responseBody)
                );
                const data =OrganisationHierarchyMapper.mapData(responseBody.data);
                const validator =new OrganisationHierarchyValidator();
                validation.execute("Items",() => 
                    validator.validateItemsExist(data)
                );
                validation.execute("Fields",() =>
                    validator.validateHierarchyFields(data.hierarchy)
                );
                validation.execute("Duplicate IDs",() => 
                    validator.validateDuplicateIds(data.hierarchy)
                );
                validation.execute("Expected Levels",() =>
                     validator.validateExpectedLevels(data.hierarchy)
                );
                validation.printSummary("Organisation Hierarchy API",responseTime);
            })
    })