import { test } from"../../../../src/fixtures/api.fixture";
import { NetworkHierarchyApi} from "../Api/networkhierarchy.api";
import {NetworkHierarchyMapper} from "../Mapper/networkhierarchy.mapper";
import {NetworkHierarchyValidator} from "../Validator/networkhierarchy.validator";
import { AssertionEngine}from"../../../core/engine/assertion.engine";
import { ValidationEngine} from"../../../core/engine/validation.engine";
import {PerformanceTracker} from "../../../../src/core/utils/performancetracker";
test.describe("Network Hierarchy API",() => {
        test("Validate Network Hierarchy API",{tag: [  "@smoke", "@hierarchy" ]},
            async ({ authenticatedApi}) => {
                const api = new NetworkHierarchyApi(authenticatedApi);
                const {
                    rawResponse,
                    responseBody,
                    responseTime
                }  = await api.getNetworkHierarchy();
                await PerformanceTracker.track( rawResponse, "Network Hierarchy API",
                        `${process.env.BASE_URL}/indore/asset-management/network-hierarchy`,
                        responseTime
                    );
                const assert =  new AssertionEngine();
                const validation =new ValidationEngine();
                validation.execute( "Status Validation",() =>
                        assert.validateStatusCode( rawResponse, 200 )
                );
                validation.execute("Content Validation", () =>
                        assert.validateContentType(rawResponse)
                );
                validation.execute("Response Time", () => 
                     assert.validateResponseTime(responseTime,60000)
                );
                validation.execute("Security Validation",() =>
                    assert.validateSensitiveData(responseBody)                               
                );
                const data =NetworkHierarchyMapper.mapData(responseBody.data);
                const validator =new NetworkHierarchyValidator();
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
                validation.printSummary("Network Hierarchy API",
                    responseTime
                );
            }
        );
    });