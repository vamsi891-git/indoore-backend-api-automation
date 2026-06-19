/** Email of the account used in global setup (Bearer token). Never target for device delete / force logout. */
export function resolveAutomationEmail(): string {
    return String(process.env.EMAIL || process.env.USERNAME || "")
        .trim()
        .toLowerCase();
}

export function isAutomationAccount(user: { email: string }): boolean {
    const automationEmail = resolveAutomationEmail();
    return (
        automationEmail.length > 0 &&
        user.email.toLowerCase() === automationEmail
    );
}

export const UserManagementData = {

    // =====================================
    // PAGINATION
    // =====================================

    page: 1,

    limit: 20,

    // =====================================
    // DYNAMIC IDS
    // =====================================

    userId: "",

    deviceId: "",

    // =====================================
    // UPDATE USER
    // =====================================

    updateUserPayload: {

        firstName: "Automation",

        lastName: "User",

        phone: "",

        designation: "manager",

        organisationId: 0,

        networkId: 0,

        role: "manager"
    },

    // =====================================
    // UPDATE STATUS
    // =====================================

    updateStatusPayload: {

        status: "active"
    },

    // =====================================
    // PERFORMANCE
    // =====================================

    maxResponseTime: 60000
};

export const UserDevicesTestConfig = {
    pageSize: 50,
    deviceTestUserId: String(process.env.DEVICE_TEST_USER_ID ?? "").trim(),
};