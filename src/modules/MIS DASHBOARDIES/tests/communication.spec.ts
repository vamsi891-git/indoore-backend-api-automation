import { test } from "../../../fixtures/api.fixture";
import {CommStatsApi } from "../Api/communication.api";
import { CommStatsMapper } from "../Mapper/communication.mapper";
import { CommStatsValidator } from "../Validator/communication.validator";
import { commStatsQuery } from "../Data/communication.data";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
test.describe( "MIS Communication Stats API",() => {
    test("Validate Communication Stats",
      {
        tag: [
          "@smoke",
          "@comm-stats"
        ]
      },
      async ({authenticatedApi}) => {
        const api =new CommStatsApi(authenticatedApi);
        const {
          rawResponse,
          responseBody,
          responseTime
        } =await api.getCommStats(commStatsQuery);
        const assert =new AssertionEngine();
        const validation =new ValidationEngine();
        validation.execute("Status",() => 
          assert.validateStatusCode(rawResponse,200)
        );
        validation.execute("Content",() => 
          assert.validateContentType(rawResponse,"application/json")
        );
        validation.execute("Performance",() => 
          assert.validateResponseTime(responseTime,120000)
        );
        validation.execute("Sensitive Data",() => 
          assert.validateSensitiveData(responseBody)
        );
        const data =CommStatsMapper.mapCommStats(responseBody.data);
        const validator =new CommStatsValidator();
        validation.execute("Response",() => 
          validator.validateResponse(responseBody)
        );
        validation.execute("Date Validation",() => 
          validator.validateDates(data)
        );
        validation.execute("Overall Validation",() => 
          validator.validateOverall(data)
        );
        validation.execute("Category Validation",() => 
          validator.validateCategories(data)
        );
        validation.execute("Phase Validation",() => 
          validator.validatePhases(data)
        );
        validation.execute("Trend Validation",() => 
          validator.validateTrend(data)
        );
        validation.printSummary("Communication Stats API",responseTime );
      }
    );
  });