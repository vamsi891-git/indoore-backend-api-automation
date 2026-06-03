import { test } from "../../../../src/fixtures/api.fixture";

import { DashboardMetricsApi } from "../Api/dashboardmetrics.api";

import { DashboardMetricsData } from "../Data/dashboardmetrics.data";

import { DashboardMetricsMapper } from "../Mapper/dashboardmetrics.mapper";

import { DashboardMetricsValidator } from "../Validator/dashboardmetrics.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import {  PerformanceTracker } from "../../../../src/core/utils/performancetracker";
test.describe( "Dashboard Metrics API", () => {
        test( "Validate Dashboard Metrics API",
            {
                tag: [
                    "@dashboard",
                    "@smoke",
                    "@metrics"
                ]
            },
            async ({authenticatedApi}) => {
                const api =new DashboardMetricsApi(authenticatedApi);
                const {
                    rawResponse,
                    responseBody,
                    responseTime
                }  = await api.getDashboardMetrics();
                await PerformanceTracker.track(
                    rawResponse,
                    "Dashboard Metrics API",
                    `${process.env.BASE_URL}/indore/dashboard/metrics`,
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
                const data =DashboardMetricsMapper.mapData(responseBody.data);
                const validator =new DashboardMetricsValidator();
                validation.execute("Timestamp",() =>
                        validator.validateTimestamp(data)
                );
                validation.execute("Connection Status",() =>
                        validator.validateMetricGroup(data.connectionStatus)
                );
                validation.execute("Category Wise",() =>
                        validator.validateMetricGroup(data.categoryWiseConsumer)
                );
                validation.execute("Phase Wise",() =>
                        validator.validateMetricGroup(data.phaseWiseConsumer)
                );
                validation.execute("OEM Wise",() =>
                        validator.validateMetricGroup(data.oemWiseConsumer)
                );
                validation.execute("Consumer Type",() =>
                        validator.validateMetricGroup(data.consumerType)
                );
                validation.execute("Network Details",() =>
                        validator.validateMetricGroup(data.networkDetails)
                );
                validation.execute("Sparkline Validation",() =>
                        validator.validateSparkline(data.consumerType,DashboardMetricsData.sparklineLength
                            )
                );
                validation.execute("Trend Validation",() =>
                        validator.validateTrend(data.consumerType)
                );
                validation.execute("Connection Percentage",() =>
                        validator.validateConnectionPercentageTotal(data)
                );
                validation.printSummary("Dashboard Metrics API",
                    responseTime
                );
            }
        );
    });