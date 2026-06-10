import { APIRequestContext } from "@playwright/test";
import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { AuthPaths } from "../Data/auth.data";

export interface InviteUserPayload {
  email: string;
  role: string;
  organisationId?: number;
  networkId?: number;
}

export interface InviteAcceptPayload {
  token: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  designation?: string;
}

export interface ListInvitationsQuery {
  page?: number;
  limit?: number;
  q?: string;
  status?: "all" | "pending" | "accepted" | "expired";
  role?: string;
}

export class InviteApi extends TimedApiClient {
  constructor(authenticatedApi: APIRequestContext) {
    super(authenticatedApi);
  }

  inviteUser(payload: InviteUserPayload): Promise<ApiCallResult> {
    return this.postJson(AuthPaths.invite, { data: payload });
  }

  listMyInvitations(query: ListInvitationsQuery = {}): Promise<ApiCallResult> {
    const params: Record<string, string | number | boolean> = {};
    if (query.page !== undefined) params.page = query.page;
    if (query.limit !== undefined) params.limit = query.limit;
    if (query.q !== undefined) params.q = query.q;
    if (query.status !== undefined) params.status = query.status;
    if (query.role !== undefined) params.role = query.role;
    return this.getJson(AuthPaths.invitationsMine, { params });
  }

  resendInvitation(invitationId: string): Promise<ApiCallResult> {
    return this.postJson(AuthPaths.invitationResend(invitationId));
  }

  deleteInvitation(invitationId: string): Promise<ApiCallResult> {
    return this.deleteJson(AuthPaths.invitationById(invitationId));
  }

  getRoles(): Promise<ApiCallResult> {
    return this.getJson(AuthPaths.roles);
  }
}

export class InvitePublicApi {
  constructor(private readonly request: APIRequestContext) {}

  async previewInvitation(token: string): Promise<ApiCallResult> {
    const start = Date.now();
    const rawResponse = await this.request.get(AuthPaths.invitePreview, {
      params: { token },
    });
    const text = await rawResponse.text();
    const responseBody = text ? JSON.parse(text) : null;
    return {
      rawResponse,
      responseBody,
      responseTime: Date.now() - start,
    };
  }

  async acceptInvitation(
    payload: InviteAcceptPayload,
    csrfToken: string,
  ): Promise<ApiCallResult> {
    const start = Date.now();
    const rawResponse = await this.request.post(AuthPaths.inviteAccept, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
        Cookie: `csrf_token=${csrfToken}`,
      },
      data: payload,
    });
    const text = await rawResponse.text();
    const responseBody = text ? JSON.parse(text) : null;
    return {
      rawResponse,
      responseBody,
      responseTime: Date.now() - start,
    };
  }
}
