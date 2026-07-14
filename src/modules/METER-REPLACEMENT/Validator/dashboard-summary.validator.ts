import { expect } from "@playwright/test";
import {
  DashboardSummaryData,
  DashboardOverall,
  DashboardMyWork,
} from "../Mapper/dashboard-summary.mapper";

const OVERALL_REQUIRED_FIELDS = [
  "totalMetersRequested",
  "totalMetersReplaced",
  "totalPendingMeters",
  "totalUnmappedMeters",
] as const;

const MYWORK_REQUIRED_FIELDS = [
  "completedToday",
  "completedThisMonth",
  "totalCompleted",
  "latestCompletedDate",
] as const;

const DATE_PATTERN =
  /^\d{1,2}\s[A-Za-z]{3}\s\d{4},\s\d{1,2}:\d{2}\s(am|pm)$/i;

export class DashboardSummaryValidator {

  validateSuccess(success: boolean) {
    expect(success).toBeTruthy();
  }

  validateRootStructure(
    data: DashboardSummaryData,
  ) {
    expect(typeof data).toBe("object");
  }

  validateOverallObject(
    overall: DashboardOverall,
  ) {
    expect(typeof overall).toBe("object");
  }

  validateMyWorkObject(
    myWork: DashboardMyWork,
  ) {
    expect(typeof myWork).toBe("object");
  }

  validateOverallRequiredFields(
    overall: DashboardOverall,
  ) {

    OVERALL_REQUIRED_FIELDS.forEach((field) => {

      expect(overall).toHaveProperty(field);

    });

  }

  validateMyWorkRequiredFields(
    myWork: DashboardMyWork,
  ) {

    MYWORK_REQUIRED_FIELDS.forEach((field) => {

      expect(myWork).toHaveProperty(field);

    });

  }

  validateOverallTypes(
    overall: DashboardOverall,
  ) {

    expect(
      typeof overall.totalMetersRequested,
    ).toBe("number");

    expect(
      typeof overall.totalMetersReplaced,
    ).toBe("number");

    expect(
      typeof overall.totalPendingMeters,
    ).toBe("number");

    expect(
      typeof overall.totalUnmappedMeters,
    ).toBe("number");

  }

  validateMyWorkTypes(
    myWork: DashboardMyWork,
  ) {

    expect(
      typeof myWork.completedToday,
    ).toBe("number");

    expect(
      typeof myWork.completedThisMonth,
    ).toBe("number");

    expect(
      typeof myWork.totalCompleted,
    ).toBe("number");

    expect(
      myWork.latestCompletedDate === null ||
      typeof myWork.latestCompletedDate === "string",
    ).toBeTruthy();

  }

  validateTotalMetersRequested(
    overall: DashboardOverall,
  ) {
    expect(
      overall.totalMetersRequested,
    ).toBeGreaterThanOrEqual(0);
  }

  validateTotalMetersReplaced(
    overall: DashboardOverall,
  ) {
    expect(
      overall.totalMetersReplaced,
    ).toBeGreaterThanOrEqual(0);
  }

  validateTotalPendingMeters(
    overall: DashboardOverall,
  ) {
    expect(
      overall.totalPendingMeters,
    ).toBeGreaterThanOrEqual(0);
  }

  validateTotalUnmappedMeters(
    overall: DashboardOverall,
  ) {
    expect(
      overall.totalUnmappedMeters,
    ).toBeGreaterThanOrEqual(0);
  }

  validateCompletedToday(
    myWork: DashboardMyWork,
  ) {
    expect(
      myWork.completedToday,
    ).toBeGreaterThanOrEqual(0);
  }

  validateCompletedThisMonth(
    myWork: DashboardMyWork,
  ) {
    expect(
      myWork.completedThisMonth,
    ).toBeGreaterThanOrEqual(0);
  }

  validateTotalCompleted(
    myWork: DashboardMyWork,
  ) {
    expect(
      myWork.totalCompleted,
    ).toBeGreaterThanOrEqual(0);
  }

  validateLatestCompletedDate(
    myWork: DashboardMyWork,
  ) {

    if (
      myWork.latestCompletedDate === null
    ) {
      return;
    }

    expect(
      DATE_PATTERN.test(
        myWork.latestCompletedDate,
      ),
    ).toBeTruthy();

  }

  validateOverallIntegerValues(
    overall: DashboardOverall,
  ) {

    expect(
      Number.isInteger(
        overall.totalMetersRequested,
      ),
    ).toBeTruthy();

    expect(
      Number.isInteger(
        overall.totalMetersReplaced,
      ),
    ).toBeTruthy();

    expect(
      Number.isInteger(
        overall.totalPendingMeters,
      ),
    ).toBeTruthy();

    expect(
      Number.isInteger(
        overall.totalUnmappedMeters,
      ),
    ).toBeTruthy();

  }

  validateMyWorkIntegerValues(
    myWork: DashboardMyWork,
  ) {

    expect(
      Number.isInteger(
        myWork.completedToday,
      ),
    ).toBeTruthy();

    expect(
      Number.isInteger(
        myWork.completedThisMonth,
      ),
    ).toBeTruthy();

    expect(
      Number.isInteger(
        myWork.totalCompleted,
      ),
    ).toBeTruthy();

  }

  validateNoNullCriticalFields(
    data: DashboardSummaryData,
  ) {

    expect(data.overall).not.toBeNull();

    expect(data.myWork).not.toBeNull();

  }

  validateNoUndefinedCriticalFields(
    data: DashboardSummaryData,
  ) {

    expect(data.overall).not.toBeUndefined();

    expect(data.myWork).not.toBeUndefined();

  }

  validateBusinessRules(
    data: DashboardSummaryData,
  ) {

    expect(data).toHaveProperty(
      "overall",
    );

    expect(data).toHaveProperty(
      "myWork",
    );

  }
  validateOverallBusinessRule(
    overall: DashboardOverall,
  ) {

    expect(
      overall.totalMetersRequested,
    ).toBeGreaterThanOrEqual(
      overall.totalMetersReplaced,
    );

    expect(
      overall.totalMetersRequested,
    ).toBeGreaterThanOrEqual(
      overall.totalPendingMeters,
    );

  }

  validateMyWorkBusinessRule(
    myWork: DashboardMyWork,
  ) {

    expect(
      myWork.completedThisMonth,
    ).toBeGreaterThanOrEqual(
      myWork.completedToday,
    );

    expect(
      myWork.totalCompleted,
    ).toBeGreaterThanOrEqual(
      myWork.completedThisMonth,
    );

  }

  validateOverallObjectSize(
    overall: DashboardOverall,
  ) {

    expect(
      Object.keys(overall).length,
    ).toBe(4);

  }

  validateMyWorkObjectSize(
    myWork: DashboardMyWork,
  ) {

    expect(
      Object.keys(myWork).length,
    ).toBe(4);

  }

  validateOverallNoExtraFields(
    overall: DashboardOverall,
  ) {

    expect(
      Object.keys(overall).sort(),
    ).toEqual([
      "totalMetersReplaced",
      "totalMetersRequested",
      "totalPendingMeters",
      "totalUnmappedMeters",
    ]);

  }

  validateMyWorkNoExtraFields(
    myWork: DashboardMyWork,
  ) {

    expect(
      Object.keys(myWork).sort(),
    ).toEqual([
      "completedThisMonth",
      "completedToday",
      "latestCompletedDate",
      "totalCompleted",
    ]);

  }

  validateLatestCompletedDateTrim(
    myWork: DashboardMyWork,
  ) {

    if (
      myWork.latestCompletedDate == null
    ) {
      return;
    }

    expect(
      myWork.latestCompletedDate,
    ).toBe(
      myWork.latestCompletedDate.trim(),
    );

  }

  validateLatestCompletedDateBusinessRule(
    myWork: DashboardMyWork,
  ) {

    if (
      myWork.totalCompleted === 0
    ) {

      expect(
        myWork.latestCompletedDate,
      ).toBeNull();

    }

  }

  validateOverallResponseIntegrity(
    overall: DashboardOverall,
  ) {

    expect(
      overall.totalMetersRequested,
    ).not.toBeNull();

    expect(
      overall.totalMetersReplaced,
    ).not.toBeNull();

    expect(
      overall.totalPendingMeters,
    ).not.toBeNull();

    expect(
      overall.totalUnmappedMeters,
    ).not.toBeNull();

  }

  validateMyWorkResponseIntegrity(
    myWork: DashboardMyWork,
  ) {

    expect(
      myWork.completedToday,
    ).not.toBeNull();

    expect(
      myWork.completedThisMonth,
    ).not.toBeNull();

    expect(
      myWork.totalCompleted,
    ).not.toBeNull();

  }

  validateOverallSafeInteger(
    overall: DashboardOverall,
  ) {

    expect(
      overall.totalMetersRequested,
    ).toBeLessThanOrEqual(
      Number.MAX_SAFE_INTEGER,
    );

    expect(
      overall.totalMetersReplaced,
    ).toBeLessThanOrEqual(
      Number.MAX_SAFE_INTEGER,
    );

    expect(
      overall.totalPendingMeters,
    ).toBeLessThanOrEqual(
      Number.MAX_SAFE_INTEGER,
    );

    expect(
      overall.totalUnmappedMeters,
    ).toBeLessThanOrEqual(
      Number.MAX_SAFE_INTEGER,
    );

  }

  validateMyWorkSafeInteger(
    myWork: DashboardMyWork,
  ) {

    expect(
      myWork.completedToday,
    ).toBeLessThanOrEqual(
      Number.MAX_SAFE_INTEGER,
    );

    expect(
      myWork.completedThisMonth,
    ).toBeLessThanOrEqual(
      Number.MAX_SAFE_INTEGER,
    );

    expect(
      myWork.totalCompleted,
    ).toBeLessThanOrEqual(
      Number.MAX_SAFE_INTEGER,
    );

  }

  validateOverallNonNegative(
    overall: DashboardOverall,
  ) {

    Object.values(overall).forEach((value) => {

      expect(value).toBeGreaterThanOrEqual(0);

    });

  }

  validateMyWorkNonNegative(
    myWork: DashboardMyWork,
  ) {

    expect(
      myWork.completedToday,
    ).toBeGreaterThanOrEqual(0);

    expect(
      myWork.completedThisMonth,
    ).toBeGreaterThanOrEqual(0);

    expect(
      myWork.totalCompleted,
    ).toBeGreaterThanOrEqual(0);

  }

  validateRequestedConsistency(
    overall: DashboardOverall,
  ) {

    expect(
      overall.totalMetersRequested,
    ).toBeGreaterThanOrEqual(
      overall.totalMetersReplaced +
      overall.totalPendingMeters,
    );

  }

  validateCompletedCountsConsistency(
    myWork: DashboardMyWork,
  ) {

    expect(
      myWork.completedToday,
    ).toBeLessThanOrEqual(
      myWork.completedThisMonth,
    );

  }

  validateZeroDashboardScenario(
    overall: DashboardOverall,
    myWork: DashboardMyWork,
  ) {

    if (
      overall.totalMetersRequested === 0
    ) {

      expect(
        overall.totalMetersReplaced,
      ).toBe(0);

      expect(
        overall.totalPendingMeters,
      ).toBe(0);

      expect(
        myWork.totalCompleted,
      ).toBeGreaterThanOrEqual(0);

    }

  }

  validateCompletedDatePresence(
    myWork: DashboardMyWork,
  ) {

    if (
      myWork.latestCompletedDate != null
    ) {

      expect(
        myWork.totalCompleted,
      ).toBeGreaterThan(0);

    }

  }

  validateOverallCountsRelationship(
    overall: DashboardOverall,
  ) {

    expect(
      overall.totalMetersRequested,
    ).toBeGreaterThanOrEqual(
      overall.totalUnmappedMeters,
    );

  }

  validateTodayMonthRelationship(
    myWork: DashboardMyWork,
  ) {

    expect(
      myWork.completedToday,
    ).toBeLessThanOrEqual(
      myWork.completedThisMonth,
    );

  }

  validateMonthTotalRelationship(
    myWork: DashboardMyWork,
  ) {

    expect(
      myWork.completedThisMonth,
    ).toBeLessThanOrEqual(
      myWork.totalCompleted,
    );

  }

  validateOverallNumericFields(
    overall: DashboardOverall,
  ) {

    Object.values(overall).forEach((value) => {

      expect(
        typeof value,
      ).toBe("number");

    });

  }

  validateMyWorkNumericFields(
    myWork: DashboardMyWork,
  ) {

    expect(
      typeof myWork.completedToday,
    ).toBe("number");

    expect(
      typeof myWork.completedThisMonth,
    ).toBe("number");

    expect(
      typeof myWork.totalCompleted,
    ).toBe("number");

  }

}