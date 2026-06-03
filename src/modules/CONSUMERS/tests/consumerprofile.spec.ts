import { test }  from "../../../../src/fixtures/api.fixture";
import { ConsumerProfileApi } from "../Api/consumerprofile.api";
import { consumerProfileData }  from "../Data/consumerprofile.data";
import { ConsumerProfileMapper } from "../Mapper/consumerprofile.mapper";
import { ConsumerProfileValidator } from "../Validator/consumerprofile.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../../src/core/utils/performancetracker";
test.describe("Consumer Profile API",() => {
        test("Validate Consumer Profile API",
            {
                tag: [
                    "@consumer",
                    "@profile",
                    "@smoke"
                ]
            },
            async ({authenticatedApi}) => {
                const api =new ConsumerProfileApi(authenticatedApi);
                const {
                    rawResponse,
                    responseBody,
                    responseTime
                } = await api.getConsumerProfile(consumerProfileData.consumerNumber,consumerProfileData.query);
                await PerformanceTracker.track(rawResponse,"Consumer Profile API",`${process.env.BASE_URL}/indore/consumers/${consumerProfileData.consumerNumber}/profile`,responseTime);
                const assert =new AssertionEngine();
                const validation =new ValidationEngine();
                //======================================
                // BASE API VALIDATIONS
                //======================================
                validation.execute("Status Validation",() =>
                    assert.validateStatusCode(rawResponse,200)
                );
                validation.execute("Content Type",() =>
                        assert.validateContentType(rawResponse)
                );
                validation.execute("Response Time",() =>
                        assert.validateResponseTime(responseTime,60000)
                );
                validation.execute("Sensitive Data",() =>
                        assert.validateSensitiveData(responseBody)
                );
                validation.execute("Required Fields",() =>
                        assert.validateRequiredFields(responseBody.data,["consumerName","consumerNumber","uniqueId","meterSerialNumber","occupancyStatus","connectionDetails","connectionMeterDetails","latestActivities"])
                );

                //======================================
                // MAPPER
                //======================================
                const data =ConsumerProfileMapper.map(responseBody);
                const validator =new ConsumerProfileValidator();
                //=====================================
                // BACKEND VALIDATIONS
                //======================================
                validation.execute("Consumer Name",() =>
                        validator.validateConsumerName(data)
                );
                validation.execute("Consumer Number",() =>
                        validator.validateConsumerNumber(data)
                );
                validation.execute("Unique Id",() =>
                        validator.validateUniqueId(data)
                );
                validation.execute("Occupancy Validation",() =>
                        validator.validateOccupancy(data)
                );
                validation.execute("Address Validation",() =>
                        validator.validateAddress(data)
                );
                validation.execute("Connection Details",() =>
                        validator.validateConnectionDetails(data)
                );
                validation.execute("Meter Details",() =>
                        validator.validateMeterDetails(data)
                );
                validation.execute("Sanctioned Load",() =>
                        validator.validateSanctionedLoad(data)
                );
                validation.execute("Phase Validation",() =>
                        validator.validatePhase(data)
                );
                validation.execute("Email Validation",() =>
                        validator.validateEmail(data)
                );
                validation.execute("Activities Validation",() =>
                        validator.validateActivities(data)
                );
                validation.execute("Business Rules",() =>
                        validator.validateBusinessRules(data)
                );
                //======================================
                // SUMMARY
                //======================================
                validation.printSummary("Consumer Profile API",responseTime);
            }
        );
    });