import { expect } from "@playwright/test";
import { backendRules } from "../Data/eventdatacurrent.data";
import { EventCurrentData } from "../Mapper/eventdatacurrent.mapper";
type TrendPeriod = keyof typeof backendRules.trendRegex;
export class EventCurrentValidator {
    validateResponse(response: any) {
        expect(response.success).toBeTruthy();
        expect(response.data).toBeDefined();
    }
    validateReportType(data: EventCurrentData) {
        expect(backendRules.reportTypes).toContain(data.reportType);
    }
    validatePeriod(data: EventCurrentData) {
        expect(backendRules.periods).toContain(data.period);
    }
    validateDates(data: EventCurrentData) {
        const from =new Date(data.fromDate);
        const to =new Date(data.toDate);
        expect(from.getTime()).toBeLessThanOrEqual(to.getTime());
    }
    validateTotals(data: EventCurrentData) {
        const total =data.records.reduce((sum, item) => sum + item.count, 0);
        expect(total).toBe(data.totalCount);
    }
    validateStructure(data: EventCurrentData) {
        const labels: string[] = [];
        for (const row of data.records) {
            expect(row.label).toBeTruthy();
            expect(row.count).toBeGreaterThanOrEqual(0);
            labels.push(row.label);
        }
        const expected =data.reportType === "phase-wise"?backendRules.phaseLabels:backendRules.categoryLabels;
        expect(labels).toEqual(expected);
    }
    validateTrend(data: EventCurrentData) {
        const regex =backendRules.trendRegex[data.period as TrendPeriod];
        for (const series of data.trend) {
            expect(series.name).toBeTruthy();
            series.data.forEach(point => {
                        expect(point.key).toMatch(regex);
                        expect(point.value).toBeGreaterThanOrEqual(0);
                    });
        }
    }
    validateBusinessAnomalies(data: EventCurrentData) {
        const findings = [];
        for (const row of data.records) {
            if (row.count === 0) {
                findings.push({period:data.period,
                    label:row.label,
                    issue:"No events"
                });
            }
        }
        if (findings.length) {
            console.log("\nBACKEND INVESTIGATION");
            console.table(findings);
        }
    }
    validate(data: EventCurrentData) {
        this.validateReportType(data);
        this.validatePeriod(data);
        this.validateDates(data);
        this.validateTotals(data);
        this.validateStructure(data);
        this.validateTrend(data);
    }
}