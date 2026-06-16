import { test } from "../../../../src/fixtures/api.fixture";
import { PowerQualityApi } from "../Api/powerquality.api";
import {  powerQualityData }  from "../Data/powerquality.data";
import {  PowerQualityMapper }  from "../Mapper/powerquality.mapper";
import { PowerQualityValidator } from "../Validator/powerquality.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import {PerformanceTracker }from "../../../../src/core/utils/performancetracker";
test.describe("Power Quality API",() => {
        test("Validate Power Quality API",
            {
              tag: [
                    "@consumer",
                    "@power",
                    "@smoke"
                ]
            },
            async ({authenticatedApi}) => {
             const api = new PowerQualityApi(authenticatedApi);
                const {
                    rawResponse,
                    responseBody,
                    responseTime
                } = await api.getPowerQuality(powerQualityData.consumerNumber);
                await PerformanceTracker.track(
                    rawResponse,
                    "power Quality API",
                    `${process.env.BASE_URL}/indore/consumers/${powerQualityData.consumerNumber}/power-quality`,
                    responseTime
                );
                const assert =new AssertionEngine();
                const validation = new ValidationEngine();

                validation.execute("Status",() =>
                        assert.validateStatusCode(rawResponse,200)
                );
                validation.execute("Content Type",() =>
                        assert.validateContentType(rawResponse)
                );
                validation.execute("Response Time",() =>
                        assert.validateResponseTime(responseTime,powerQualityData.maxResponseTime)
                );
                validation.execute( "Sensitive Data",() =>
                        assert.validateSensitiveData(responseBody)
                );
                validation.execute("Required Fields",() =>
                        assert.validateRequiredFields(responseBody,["success","data"])
                );
                const data =PowerQualityMapper.map(responseBody);
                validation.execute("Mapped Required Fields",() =>
                        assert.validateRequiredFields(data,["overallPf","frequency","neutralCurrent","mdKw","mdKva"])
                );
                const validator =new PowerQualityValidator();
                validation.execute("Success",() => 
                    validator.validateSuccess(data)
                );
                validation.execute("Titles",() => validator.validateTitles(data)
                );
                validation.execute("Units",() => validator.validateUnits(data)
                );

                validation.execute("Subtitles",() => 
                    validator.validateSubtitles(data)
                );
                validation.execute("Nullable",() => 
                    validator.validateNullableBehavior(data)
                );
                validation.execute("PowerFactor",() => 
                    validator.validatePowerFactor(data)
                );
                validation.execute("Frequency",() => 
                    validator.validateFrequency(data)
                );
                validation.execute("NeutralCurrent",() => 
                    validator.validateNeutralCurrent(data)
                );
                validation.execute("Demand",() => 
                    validator.validateDemand(data)
                );
                validation.execute("Cross Field",() => 
                    validator.validateCrossField(data)
                );
                validation.execute("Business Rules",() => 
                    validator.validateBusinessRules(data)
                );
                validation.printSummary("Power Quality API",responseTime);
            });
    });