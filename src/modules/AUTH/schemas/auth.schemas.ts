import { z } from "zod";

export const AuthErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
});

export const AuthErrorResponseSchema = z.object({
  success: z.literal(false),
  error: AuthErrorSchema,
});

const AuthDeviceSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().nullable().optional(),
    deviceType: z.string().optional(),
    browser: z.string().nullable().optional(),
    os: z.string().nullable().optional(),
    lastSeenAt: z.string().nullable().optional(),
    trustedAt: z.string().nullable().optional(),
  })
  .passthrough();

export const AuthLoginSessionSchema = z.object({
  accessToken: z.string().min(1),
  expiresIn: z.number().int().positive().optional(),
});

export const AuthDeviceSelectionSchema = z.object({
  requiresDeviceSelection: z.literal(true),
  challengeToken: z.string().min(1),
  expiresIn: z.number().int().positive().optional(),
  maxDevices: z.number().int().positive().optional(),
  devices: z.array(AuthDeviceSchema).min(1),
});

export const AuthLoginDataSchema = z.union([
  AuthLoginSessionSchema,
  AuthDeviceSelectionSchema,
]);

export const AuthLoginSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: AuthLoginDataSchema,
});

export const AuthRefreshSessionSchema = z.object({
  accessToken: z.string().min(1),
  expiresIn: z.number().int().positive().optional(),
  tokenType: z.string().min(1).optional(),
});

export const AuthRefreshSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: AuthRefreshSessionSchema,
});

export type AuthLoginSuccessResponse = z.infer<
  typeof AuthLoginSuccessResponseSchema
>;
export type AuthRefreshSuccessResponse = z.infer<
  typeof AuthRefreshSuccessResponseSchema
>;
export type AuthLoginData = z.infer<typeof AuthLoginDataSchema>;
export type AuthLoginSession = z.infer<typeof AuthLoginSessionSchema>;
export type AuthDeviceSelection = z.infer<typeof AuthDeviceSelectionSchema>;

export function isDeviceSelectionPayload(
  data: AuthLoginData,
): data is AuthDeviceSelection {
  return "requiresDeviceSelection" in data && data.requiresDeviceSelection === true;
}

export function isLoginSessionPayload(
  data: AuthLoginData,
): data is AuthLoginSession {
  return "accessToken" in data;
}

// --- Invite user (POST /indore/auth/invite) ---

export const InviteUserDataSchema = z.object({
  invitationId: z.string().uuid(),
  email: z.string().email().max(320),
  expiresAt: z.string().datetime(),
  replacedPendingInvitation: z.boolean(),
  emailSent: z.boolean(),
});

export const InviteUserResponseSchema = z.object({
  success: z.literal(true),
  data: InviteUserDataSchema,
});

export const InviteUserRequestSchema = z.object({
  email: z.string().trim().email().max(320),
  role: z.string().trim().min(1).max(50),
  organisationId: z.coerce.number().int().positive().optional(),
  networkId: z.coerce.number().int().positive().optional(),
});

// --- List sent invitations (GET /indore/auth/invitations/mine) ---

export const SentInvitationItemSchema = z
  .object({
    id: z.string().uuid(),
    email: z.string().email(),
    role: z.string().min(1),
    status: z.enum(["pending", "accepted", "expired"]),
    isExpired: z.boolean(),
    expiresInSec: z.number().int(),
    expiresAt: z.string().datetime(),
    acceptedAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
    organisationScopeId: z.number().int().positive().nullable(),
    organisationScopeName: z.string().nullable(),
    organisationScopeLevelName: z.string().nullable(),
    networkScopeId: z.number().int().positive().nullable(),
    networkScopeName: z.string().nullable(),
    networkScopeLevelName: z.string().nullable(),
  })
  .passthrough();

export const SentInvitationsListDataSchema = z.object({
  invitations: z.array(SentInvitationItemSchema),
  summary: z.object({
    total: z.number().int().nonnegative(),
    acceptedCount: z.number().int().nonnegative(),
    pendingCount: z.number().int().nonnegative(),
    expiredCount: z.number().int().nonnegative(),
  }),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  filterOptions: z.object({
    statuses: z.array(z.string()),
    roles: z.array(z.string()),
  }),
});

export const SentInvitationsListResponseSchema = z.object({
  success: z.literal(true),
  data: SentInvitationsListDataSchema,
});

// --- Preview invitation (GET /indore/auth/invite/preview) ---

export const InvitePreviewDataSchema = z
  .object({
    email: z.string().email(),
    role: z.string().min(1),
    expiresAt: z.string().datetime(),
    inviterName: z.string().optional(),
    organisationScopeName: z.string().nullable().optional(),
    networkScopeName: z.string().nullable().optional(),
  })
  .passthrough();

export const InvitePreviewResponseSchema = z.object({
  success: z.literal(true),
  data: InvitePreviewDataSchema,
});

// --- Accept invitation (POST /indore/auth/invite/accept) ---

export const InviteAcceptUserSchema = z
  .object({
    id: z.string().uuid(),
    email: z.string().email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
  })
  .passthrough();

export const InviteAcceptDataSchema = z.object({
  user: InviteAcceptUserSchema,
  accessToken: z.string().min(1),
  expiresIn: z.number().int().positive(),
  tokenType: z.string().min(1),
  permissions: z.array(z.string()),
  isUltimate: z.boolean(),
  is2FAEnforced: z.boolean(),
  requires2FASetup: z.boolean(),
});

export const InviteAcceptResponseSchema = z.object({
  success: z.literal(true),
  data: InviteAcceptDataSchema,
});

export const InviteAcceptRequestSchema = z.object({
  token: z.string().trim().min(20).max(512),
  password: z.string().min(8),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  phone: z.string().trim().max(15).optional(),
  designation: z.string().trim().max(120).optional(),
});

export type InviteUserResponse = z.infer<typeof InviteUserResponseSchema>;
export type InviteUserData = z.infer<typeof InviteUserDataSchema>;
export type SentInvitationsListResponse = z.infer<
  typeof SentInvitationsListResponseSchema
>;
export type SentInvitationItem = z.infer<typeof SentInvitationItemSchema>;
export type InvitePreviewResponse = z.infer<typeof InvitePreviewResponseSchema>;
export type InviteAcceptResponse = z.infer<typeof InviteAcceptResponseSchema>;
