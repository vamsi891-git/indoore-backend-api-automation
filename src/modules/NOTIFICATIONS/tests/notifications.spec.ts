import { test } from "../../../../src/fixtures/api.fixture";
import { AssertionEngine } from "../../../../src/core/engine/assertion.engine";
import { ValidationEngine } from "../../../../src/core/engine/validation.engine";
import { PerformanceTracker } from "../../../../src/core/utils/performancetracker";
import { TokenManager } from "../../../../src/core/utils/token-manager";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { NotificationsApi } from "../Api/notifications.api";
import { NotificationsData } from "../Data/notifications.data";
import { NotificationsMapper } from "../Mapper/notifications.mapper";
import { NotificationsValidator } from "../Validator/notifications.validator";

test.describe("Notifications CRUD Flow", () => {
    test(
        "Validate Notifications Module",
        {
            tag: ["@smoke", "@notifications"],
        },
        async ({ authenticatedApi }) => {
            const assert = new AssertionEngine();
            const validation = new ValidationEngine();
            const notificationApi = new NotificationsApi(authenticatedApi);
            const validator = new NotificationsValidator();

            const validateJsonCall = (
                label: string,
                result: ApiCallResult,
                expectedStatus = 200,
            ) => {
                validation.execute(`${label} Status Code`, () =>
                    assert.validateStatusCode(
                        result.rawResponse,
                        expectedStatus,
                    ),
                );
                validation.execute(`${label} Content Type`, () =>
                    assert.validateContentType(result.rawResponse),
                );
                validation.execute(`${label} Response Time`, () =>
                    assert.validateResponseTime(
                        result.responseTime,
                        NotificationsData.maxResponseTime,
                    ),
                );
                validation.execute(`${label} Sensitive Data`, () =>
                    assert.validateSensitiveData(result.responseBody),
                );
            };

            const trackPerformance = async (
                label: string,
                result: ApiCallResult,
            ) => {
                await PerformanceTracker.track(
        result.rawResponse,
        label,
        result.rawResponse.url(),
                    result.responseTime,
                );
            };

            const seedResults: ApiCallResult[] = [];

            // =====================================
            // STEP 0 — SEED NOTIFICATIONS WHEN EMPTY
            // =====================================
            let notificationsResponse =
                await notificationApi.getNotifications(
                    NotificationsData.page,
                    NotificationsData.limit,
                );

            let notificationsList =
                NotificationsMapper.mapNotificationsList(
                    notificationsResponse.responseBody,
                );

            const userId = NotificationsMapper.getUserIdFromAccessToken(
                await TokenManager.getToken(),
            );

            if (notificationsList.total < NotificationsData.seedCount) {
                while (
                    notificationsList.total < NotificationsData.seedCount
                ) {
                    const seedResponse =
                        await notificationApi.createNotification(
                            NotificationsMapper.buildSeedPayload(
                                userId,
                                notificationsList.total,
                            ),
                        );

                    seedResults.push(seedResponse);

                    if (seedResponse.rawResponse.ok()) {
                        validation.execute(
                            "Validate Seed Notification Response",
                            () =>
                                validator.validateCreateResponse(
                                    seedResponse.responseBody,
                                ),
                        );
                    } else {
                        break;
                    }

                    notificationsResponse =
                        await notificationApi.getNotifications(
                            NotificationsData.page,
                            NotificationsData.limit,
                        );

                    notificationsList =
                        NotificationsMapper.mapNotificationsList(
                            notificationsResponse.responseBody,
                        );
                }
            }

            if (notificationsList.total < NotificationsData.seedCount) {
                const profileSeedResponse =
                    await notificationApi.triggerNotificationViaProfileUpdate(
                        userId,
                    );

                seedResults.push(profileSeedResponse);

                if (profileSeedResponse.rawResponse.ok()) {
                    await new Promise((resolve) =>
                        setTimeout(
                            resolve,
                            NotificationsData.seedSettleMs,
                        ),
                    );

                    notificationsResponse =
                        await notificationApi.getNotifications(
                            NotificationsData.page,
                            NotificationsData.limit,
                        );

                    notificationsList =
                        NotificationsMapper.mapNotificationsList(
                            notificationsResponse.responseBody,
                        );
                }
            }

            validateJsonCall("Notifications", notificationsResponse);

            validation.execute("Validate Notifications Response", () =>
                validator.validateResponse(
                    notificationsResponse.responseBody,
                ),
            );

            const statsResponse =
                await notificationApi.getNotificationStats();

            validateJsonCall("Stats", statsResponse);

            const stats = NotificationsMapper.mapStats(
                statsResponse.responseBody,
            );

            validation.execute("Validate Stats", () =>
                validator.validateStats(stats),
            );

            validation.execute("Validate Stats Calculation", () =>
                validator.validateStatsCalculation(stats),
            );

            await trackPerformance("Get Notification Stats", statsResponse);

            if (notificationsList.total === 0) {
                const notifications = notificationsList.notifications;

                validation.execute("Validate No Data Scenario", () =>
                    validator.validateNoDataScenario(
                        notifications,
                        stats,
                        notificationsList.total,
                    ),
                );

                await trackPerformance(
                    "Get Notifications",
                    notificationsResponse,
                );

                validation.printSummary(
                    "Notifications CRUD Flow (No Data — add notifications in app for 67 checks)",
                    notificationsResponse.responseTime +
                        statsResponse.responseTime,
                );
                return;
            }

            const notifications = notificationsList.notifications;

            // =====================================
            // STEP 1 — GET NOTIFICATIONS (with data)
            // =====================================

            validation.execute("Validate Notifications", () =>
                validator.validateNotifications(notifications),
            );

            validation.execute("Validate Notification Structure", () =>
                validator.validateNotificationStructure(notifications),
            );

            validation.execute("Validate Duplicate Notifications", () =>
                validator.validateDuplicateNotifications(notifications),
            );

            validation.execute("Validate Notification IDs", () =>
                validator.validateNotificationIds(notifications),
            );

            validation.execute("Validate Notification Types", () =>
                validator.validateNotificationTypes(notifications),
            );

            validation.execute("Validate Priorities", () =>
                validator.validateNotificationPriorities(notifications),
            );

            validation.execute("Validate Read Notifications", () =>
                validator.validateReadNotifications(notifications),
            );

            validation.execute("Validate Domain Events", () =>
                validator.validateDomainEvents(notifications),
            );

            validation.execute("Validate Notification Sorting", () =>
                validator.validateNotificationSorting(notifications),
            );

            validation.execute("Validate Null Values", () =>
                validator.validateNullValues(notifications),
            );

            validation.execute("Validate NaN Values", () =>
                validator.validateNaNValues(notifications),
            );

            const targetNotification =
                notifications.find((item) => !item.isRead) ??
                notifications[0];

            const wasUnread = !targetNotification.isRead;
            NotificationsData.notificationId = targetNotification.id;

            await trackPerformance(
                "Get Notifications",
                notificationsResponse,
            );

            // =====================================
            // STEP 2 — MARK NOTIFICATION READ
            // =====================================
            const markReadResponse =
                await notificationApi.markNotificationRead(
                    NotificationsData.notificationId,
                );

            validateJsonCall("Mark Read", markReadResponse);

            validation.execute("Validate Mark Read Response", () =>
                validator.validateMarkReadResponse(
                    markReadResponse.responseBody,
                ),
            );

            await trackPerformance(
                "Mark Notification Read",
                markReadResponse,
            );

            // =====================================
            // STEP 4 — VERIFY MARK READ (LIST + STATS)
            // =====================================
            const notificationsAfterMarkReadResponse =
                await notificationApi.getNotifications(
                    NotificationsData.page,
                    NotificationsData.limit,
                );

            validateJsonCall(
                "Notifications After Mark Read",
                notificationsAfterMarkReadResponse,
            );

            const notificationsAfterMarkRead =
                NotificationsMapper.mapNotifications(
                    notificationsAfterMarkReadResponse.responseBody,
                );

            validation.execute("Validate Notification Marked Read", () =>
                validator.validateNotificationMarkedRead(
                    notificationsAfterMarkRead,
                    NotificationsData.notificationId,
                ),
            );

            await trackPerformance(
                "Get Notifications After Mark Read",
                notificationsAfterMarkReadResponse,
            );

            const statsAfterReadResponse =
                await notificationApi.getNotificationStats();

            validateJsonCall(
                "Stats After Mark Read",
                statsAfterReadResponse,
            );

            const statsAfterRead = NotificationsMapper.mapStats(
                statsAfterReadResponse.responseBody,
            );

            validation.execute("Validate Stats After Read", () =>
                validator.validateStatsAfterMarkRead(
                    stats,
                    statsAfterRead,
                    wasUnread,
                ),
            );

            await trackPerformance(
                "Get Notification Stats After Mark Read",
                statsAfterReadResponse,
            );

            // =====================================
            // STEP 5 — MARK ALL READ
            // =====================================
            const markAllReadResponse =
                await notificationApi.markAllNotificationsRead();

            validateJsonCall("Mark All Read", markAllReadResponse);

            validation.execute("Validate Mark All Read Response", () =>
                validator.validateMarkAllReadResponse(
                    markAllReadResponse.responseBody,
                ),
            );

            await trackPerformance(
                "Mark All Notifications Read",
                markAllReadResponse,
            );

            // =====================================
            // STEP 6 — VERIFY ALL READ (LIST + STATS)
            // =====================================
            const notificationsAfterAllReadResponse =
                await notificationApi.getNotifications(
                    NotificationsData.page,
                    NotificationsData.limit,
                );

            validateJsonCall(
                "Notifications After Mark All Read",
                notificationsAfterAllReadResponse,
            );

            const notificationsAfterAllRead =
                NotificationsMapper.mapNotifications(
                    notificationsAfterAllReadResponse.responseBody,
                );

            validation.execute("Validate All Notifications Marked Read", () =>
                validator.validateAllNotificationsMarkedReadList(
                    notificationsAfterAllRead,
                ),
            );

            await trackPerformance(
                "Get Notifications After Mark All Read",
                notificationsAfterAllReadResponse,
            );

            const statsAfterAllReadResponse =
                await notificationApi.getNotificationStats();

            validateJsonCall(
                "Stats After Mark All Read",
                statsAfterAllReadResponse,
            );

            const statsAfterAllRead = NotificationsMapper.mapStats(
                statsAfterAllReadResponse.responseBody,
            );

            validation.execute("Validate All Notifications Read", () =>
                validator.validateAllNotificationsRead(statsAfterAllRead),
            );

            await trackPerformance(
                "Get Notification Stats After Mark All Read",
                statsAfterAllReadResponse,
            );

            const apiResults = [
                ...seedResults,
                notificationsResponse,
                statsResponse,
                markReadResponse,
                notificationsAfterMarkReadResponse,
                statsAfterReadResponse,
                markAllReadResponse,
                notificationsAfterAllReadResponse,
                statsAfterAllReadResponse,
            ];

            // =====================================
            // STEP 7 — DELETE (only when 2+ exist at start)
            // =====================================
            if (stats.total >= NotificationsData.minNotificationsToDelete) {
                const deleteResponse =
                    await notificationApi.deleteNotification(
                        NotificationsData.notificationId,
                    );

                validateJsonCall("Delete Notification", deleteResponse);

                validation.execute("Validate Delete Response", () =>
                    validator.validateDeleteResponse(
                        deleteResponse.responseBody,
                    ),
                );

                await trackPerformance("Delete Notification", deleteResponse);

                const verifyDeleteResponse =
                    await notificationApi.getNotifications(
                        NotificationsData.page,
                        NotificationsData.limit,
                    );

                validateJsonCall(
                    "Notifications After Delete",
                    verifyDeleteResponse,
                );

                const notificationsAfterDelete =
                    NotificationsMapper.mapNotifications(
                        verifyDeleteResponse.responseBody,
                    );

                validation.execute("Validate Notification Deleted", () =>
                    validator.validateDeletedNotification(
                        notificationsAfterDelete,
                        NotificationsData.notificationId,
                    ),
                );

                await trackPerformance(
                    "Get Notifications After Delete",
                    verifyDeleteResponse,
                );

                const statsAfterDeleteResponse =
                    await notificationApi.getNotificationStats();

                validateJsonCall(
                    "Stats After Delete",
                    statsAfterDeleteResponse,
                );

                const statsAfterDelete = NotificationsMapper.mapStats(
                    statsAfterDeleteResponse.responseBody,
                );

                validation.execute("Validate Stats After Delete", () =>
                    validator.validateStatsAfterDelete(
                        statsAfterAllRead,
                        statsAfterDelete,
                    ),
                );

                await trackPerformance(
                    "Get Notification Stats After Delete",
                    statsAfterDeleteResponse,
                );

                apiResults.push(
                    deleteResponse,
                    verifyDeleteResponse,
                    statsAfterDeleteResponse,
                );
            }

            // =====================================
            // FINAL SUMMARY
            // =====================================
            const totalResponseTime = apiResults.reduce(
                (sum, result) => sum + result.responseTime,
                0,
            );

            validation.printSummary(
                "Notifications CRUD Flow",
                totalResponseTime,
            );
        },
    );
});
