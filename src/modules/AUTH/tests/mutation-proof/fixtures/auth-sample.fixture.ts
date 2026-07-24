/** Fixtures for AUTH mutation-proof — shapes aligned with auth.schemas.ts. */

export const sampleAuthLoginSuccess = {
  success: true as const,
  data: {
    accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.sig",
    expiresIn: 3600,
  },
};

export const sampleAuthMeSuccess = {
  success: true as const,
  data: {
    user: {
      id: "11111111-1111-4111-8111-111111111111",
      email: "qa@example.com",
      firstName: "QA",
      lastName: "User",
      phone: null,
      designation: null,
      department: null,
      profileImageUrl: null,
      profileImageKey: null,
      role: "ADMIN",
      roleSortOrder: 1,
      roleDescription: null,
      organisationLookupId: null,
      organisationScopeId: null,
      networkLookupId: null,
      networkScopeId: null,
      consumerId: null,
      consumerTblRefId: null,
      isTwoFactorEnabled: false,
      isTwoFactorSetupCompleted: false,
      isTwoFactorEnforced: false,
      twoFactorSetupCompletedAt: null,
      sessionTimeoutMinutes: 30,
      sessionRefreshExpiresDays: 7,
      sessionAbsoluteLifetimeDays: 30,
      lastPasswordChangedAt: null,
      lastSuccessfulLoginAt: null,
      lastFailedLoginAt: null,
      failedLoginAttempts: 0,
      status: "active" as const,
      createdAt: "2024-01-01T00:00:00.000Z",
      roleIsUltimate: false,
    },
    permissions: ["auth:me"],
    isUltimate: false,
    requiresMandatory2FASetup: false,
  },
};

export const sampleAuthDevicesSuccess = {
  success: true as const,
  data: {
    deviceGroups: [
      {
        osKey: "windows",
        osLabel: "Windows",
        deviceCount: 1,
        activeSessionCount: 1,
        lastSeenAt: "2024-06-01T12:00:00.000Z",
        hasCurrentDevice: true,
        devices: [
          {
            id: "22222222-2222-4222-8222-222222222222",
            name: "QA Laptop",
            deviceType: "desktop",
            browser: "Chrome",
            os: "Windows",
            userAgent: "Mozilla/5.0",
            lastIpAddress: "127.0.0.1",
            lastLocationText: "Local",
            createdAt: "2024-01-01T00:00:00.000Z",
            lastSeenAt: "2024-06-01T12:00:00.000Z",
            trustedAt: null,
            revokedAt: null,
            isCurrentDevice: true,
            sessions: [
              {
                sessionId: "fam-1",
                ipAddress: "127.0.0.1",
                location: "Local",
                createdAt: "2024-01-01T00:00:00.000Z",
                lastActiveAt: "2024-06-01T12:00:00.000Z",
                expiresAt: "2024-07-01T00:00:00.000Z",
              },
            ],
          },
        ],
      },
    ],
    unlinkedSessions: [],
  },
};

export const sampleSentInvitationsSuccess = {
  success: true as const,
  data: {
    invitations: [
      {
        id: "33333333-3333-4333-8333-333333333333",
        email: "invitee@example.com",
        role: "VIEWER",
        status: "pending" as const,
        isExpired: false,
        expiresInSec: 3600,
        expiresAt: "2024-12-31T00:00:00.000Z",
        acceptedAt: null,
        createdAt: "2024-01-01T00:00:00.000Z",
        organisationScopeId: null,
        organisationScopeName: null,
        organisationScopeLevelName: null,
        networkScopeId: null,
        networkScopeName: null,
        networkScopeLevelName: null,
      },
    ],
    summary: {
      total: 1,
      acceptedCount: 0,
      pendingCount: 1,
      expiredCount: 0,
    },
    page: 1,
    limit: 20,
    total: 1,
    totalPages: 1,
    filterOptions: {
      statuses: ["all", "pending", "accepted", "expired"],
      roles: ["VIEWER"],
    },
  },
};

/** Generic list fixture (DQ). */
export const sampleAuthSuccess = {
  success: true as const,
  data: {
    items: [{ id: 1, name: "Sample" }],
    pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
  },
};
