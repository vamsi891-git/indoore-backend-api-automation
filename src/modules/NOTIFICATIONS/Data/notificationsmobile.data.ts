export const NotificationsMobileData = {
    consumerCid: "3543025952",
    notificationType: "general",
    message: "HI",
    maxResponseTime: 60_000,
    expectedMessage: "Mobile notification processed successfully.",
    validNotificationTypes: [
        "outage",
        "general",
        "disconnection",
        "alert",
        "warning",
        "info",
        "success",
    ] as const,
};
