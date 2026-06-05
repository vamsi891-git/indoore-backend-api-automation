export const NotificationsData = {
    page: 1,
    limit: 10,
    notificationId: "",
    maxResponseTime: 60000,
    /** Minimum notifications required before CRUD mutations */
    seedCount: 1,

    /** Wait for async domain-event notifications after profile update seed */
    seedSettleMs: 3_000,

    /** Only delete when at least this many exist so one remains for the next run */
    minNotificationsToDelete: 2,
};
