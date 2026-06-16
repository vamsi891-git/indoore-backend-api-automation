import { test } from "../../../../src/fixtures/api.fixture";
import { LiveLoadProfileApi } from "../Api/liveloadprofile.api";
import { liveLoadProfileData }  from "../Data/liveloadprofile.data";
import {  LiveLoadProfileMapper } from "../Mapper/liveloadprofile.mapper";
import { LiveLoadProfileValidator} from "../Validator/liveloadprofile.validator";
import { AssertionEngine} from "../../../core/engine/assertion.engine";
import { ValidationEngine} from "../../../core/engine/validation.engine";
import { PerformanceTracker} from "../../../../src/core/utils/performancetracker";
test.describe( "Live Load Profile API", () => {
        test("Validate Live Load Profile API",
            {
                tag: [
                    "@consumer",
                    "@live-load",
                    "@smoke"
                ]
            },
            async ({authenticatedApi}) => {
                const api = new LiveLoadProfileApi(authenticatedApi);
                const {
                    rawResponse,
                    responseBody,
                    responseTime
                } = await api.getLiveLoadProfile(liveLoadProfileData.consumerNumber);
                await PerformanceTracker.track(
                    rawResponse,
                    "Live Load Profile API",
                    `${process.env.BASE_URL}/indore/consumers/${liveLoadProfileData.consumerNumber}/live-load-profile`,
                    responseTime
                );
                const assert = new AssertionEngine();
                const validation =  new ValidationEngine();
                validation.execute("Status",() => 
                    assert.validateStatusCode(rawResponse,200)
                );
                validation.execute("Content Type",() => 
                    assert.validateContentType(rawResponse)
                );
                validation.execute("Response Time",() => 
                    assert.validateResponseTime(responseTime,liveLoadProfileData.maxResponseTime)
                );
                validation.execute("Sensitive Data",() => 
                    assert.validateSensitiveData(responseBody)
                );
                validation.execute("Required Fields",() => 
                    assert.validateRequiredFields(responseBody,["success"])
                );
                validation.execute("Data Present When 200",() => {
                    if (rawResponse.status() === 200) {
                        assert.validateRequiredFields(responseBody,["data"]);
                    }
                });
                const data =LiveLoadProfileMapper.map(responseBody);
                validation.execute("Mapped Required Fields",() =>
                    assert.validateRequiredFields(data,["activePower","apparentPower","reactivePower","powerFactor"])
                );
                const validator = new LiveLoadProfileValidator();
                validation.execute("Success",() => 
                    validator.validateSuccess(data)
                );
                validation.execute("Structure",() => 
                    validator.validateStructure(data)
                );
                validation.execute("Titles",() => 
                    validator.validateTitles(data)
                );
                validation.execute("Units",() => 
                    validator.validateUnits(data)
                );
                validation.execute("Meter Phase",() => 
                    validator.validateMeterPhase(data)
                );
                validation.execute("Nullable",() => 
                    validator.validateNullable(data)
                );
                validation.execute("Power Factor",() => 
                    validator.validatePowerFactor(data)
                );
                validation.execute("Power Range",() => 
                    validator.validatePowerRanges(data)
                );  
                validation.execute("Power Rules",() => 
                    validator.validatePowerRules(data)
                );
                validation.execute("Share Percent",() => 
                    validator.validateSharePercent(data)
                );
                validation.execute("Date",() => 
                    validator.validateDate(data)
                );
                validation.printSummary("Live Load Profile API",responseTime
                );

            });

    });