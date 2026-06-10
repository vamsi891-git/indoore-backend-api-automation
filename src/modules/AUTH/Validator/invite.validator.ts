import { expect } from "@playwright/test";
import {
  InviteMapper,
  InvitationListStatus,
  InviteUserModel,
  SentInvitationsListModel,
} from "../Mapper/invite.mapper";
import { SentInvitationItem } from "../schemas/auth.schemas";

export class InviteValidator {
  private readonly clockSkewSec = 5;

  validateInviteUserResponse(
    model: InviteUserModel,
    requestEmail: string,
    now: Date = new Date(),
    expiryToleranceMs = 5 * 60_000,
  ) {
    expect(InviteMapper.emailsMatch(requestEmail, model.email)).toBe(true);
    expect(model.invitationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(model.expiresAt.getTime()).toBeGreaterThan(now.getTime());
    expect(model.expiresAt.getTime() - now.getTime()).toBeLessThanOrEqual(
      48 * 60 * 60_000 + expiryToleranceMs,
    );
    expect(typeof model.replacedPendingInvitation).toBe("boolean");
    expect(typeof model.emailSent).toBe("boolean");
  }

  /** Mirrors `countSentInvitationsSummary` — each row is in exactly one bucket. */
  validateSummaryPartition(summary: SentInvitationsListModel["summary"]) {
    expect(summary.total).toBeGreaterThanOrEqual(0);
    expect(summary.acceptedCount).toBeGreaterThanOrEqual(0);
    expect(summary.pendingCount).toBeGreaterThanOrEqual(0);
    expect(summary.expiredCount).toBeGreaterThanOrEqual(0);
    expect(
      summary.acceptedCount + summary.pendingCount + summary.expiredCount,
    ).toBe(summary.total);
  }

  validateSummaryCounts(summary: SentInvitationsListModel["summary"]) {
    this.validateSummaryPartition(summary);
  }

  /**
   * Pagination `total` matches the active status filter
   * (`listInvitationsByInviter` count vs global summary).
   */
  validateFilteredTotal(
    list: SentInvitationsListModel,
    status: "all" | InvitationListStatus,
  ) {
    const { summary } = list;
    if (status === "all") {
      expect(list.total).toBe(summary.total);
      return;
    }
    if (status === "pending") {
      expect(list.total).toBe(summary.pendingCount);
    }
    if (status === "accepted") {
      expect(list.total).toBe(summary.acceptedCount);
    }
    if (status === "expired") {
      expect(list.total).toBe(summary.expiredCount);
    }
  }

  validatePagination(list: SentInvitationsListModel) {
    expect(list.page).toBeGreaterThan(0);
    expect(list.limit).toBeGreaterThan(0);
    expect(list.total).toBeGreaterThanOrEqual(0);
    expect(list.totalPages).toBeGreaterThanOrEqual(0);
    expect(list.invitations.length).toBeLessThanOrEqual(list.limit);

    if (list.total === 0) {
      expect(list.invitations.length).toBe(0);
      expect(list.totalPages).toBe(0);
      return;
    }

    expect(list.totalPages).toBe(Math.ceil(list.total / list.limit));
    if (list.page === 1 && list.total <= list.limit) {
      expect(list.invitations.length).toBe(list.total);
    }
  }

  validateFilterOptions(list: SentInvitationsListModel) {
    expect(Array.isArray(list.filterOptions.statuses)).toBe(true);
    expect(Array.isArray(list.filterOptions.roles)).toBe(true);
    expect(list.filterOptions.statuses).toEqual(
      expect.arrayContaining(["pending", "accepted", "expired"]),
    );
    expect(list.filterOptions.statuses.length).toBe(3);

    const uniqueRoles = [...new Set(list.filterOptions.roles)];
    expect(uniqueRoles.length).toBe(list.filterOptions.roles.length);

    for (const role of list.filterOptions.roles) {
      expect(role.trim().length).toBeGreaterThan(0);
    }
  }

  /** Distinct inviter roles (`distinctInvitationRolesForInviter`) cover page items. */
  validateFilterRolesCatalog(list: SentInvitationsListModel) {
    const pageRoles = InviteMapper.distinctInvitationRoles(list.invitations);
    for (const role of pageRoles) {
      expect(list.filterOptions.roles).toContain(role);
    }
  }

  /** `orderBy: { created_at: 'desc' }` */
  validateCreatedAtDescOrder(invitations: SentInvitationItem[]) {
    for (let index = 1; index < invitations.length; index += 1) {
      const previous = new Date(invitations[index - 1]!.createdAt).getTime();
      const current = new Date(invitations[index]!.createdAt).getTime();
      expect(previous).toBeGreaterThanOrEqual(current);
    }
  }

  validateScopeFields(item: SentInvitationItem) {
    if (item.organisationScopeId == null) {
      expect(item.organisationScopeName).toBeNull();
      expect(item.organisationScopeLevelName).toBeNull();
    } else {
      expect(item.organisationScopeId).toBeGreaterThan(0);
      expect(item.organisationScopeName?.trim().length ?? 0).toBeGreaterThan(0);
      expect(
        item.organisationScopeLevelName?.trim().length ?? 0,
      ).toBeGreaterThan(0);
    }

    if (item.networkScopeId == null) {
      expect(item.networkScopeName).toBeNull();
      expect(item.networkScopeLevelName).toBeNull();
    } else {
      expect(item.networkScopeId).toBeGreaterThan(0);
      expect(item.networkScopeName?.trim().length ?? 0).toBeGreaterThan(0);
      expect(item.networkScopeLevelName?.trim().length ?? 0).toBeGreaterThan(0);
    }
  }

  /** Mirrors `classifyInvitationLookup` + list DTO status flags */
  validateInvitationItem(item: SentInvitationItem, now: Date = new Date()) {
    expect(item.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(item.email).toContain("@");
    expect(item.role.trim().length).toBeGreaterThan(0);
    expect(["pending", "accepted", "expired"]).toContain(item.status);

    const expiresAt = new Date(item.expiresAt);
    const createdAt = new Date(item.createdAt);
    expect(createdAt.getTime()).toBeLessThanOrEqual(expiresAt.getTime());

    const classified = InviteMapper.classifyInvitationStatus(item, now);
    expect(item.status).toBe(classified);
    expect(item.isExpired).toBe(item.status === "expired");

    if (item.status === "pending") {
      expect(item.acceptedAt).toBeNull();
      expect(expiresAt.getTime()).toBeGreaterThan(now.getTime());
      expect(item.expiresInSec).toBeGreaterThan(0);
    }

    if (item.status === "accepted") {
      expect(item.acceptedAt).toBeTruthy();
      expect(new Date(item.acceptedAt!).getTime()).toBeGreaterThanOrEqual(
        createdAt.getTime(),
      );
    }

    if (item.status === "expired") {
      expect(item.acceptedAt).toBeNull();
      expect(expiresAt.getTime()).toBeLessThanOrEqual(now.getTime());
      expect(item.expiresInSec).toBe(0);
    }

    const expectedExpiresInSec = Math.max(
      0,
      Math.floor((expiresAt.getTime() - now.getTime()) / 1000),
    );
    expect(Math.abs(item.expiresInSec - expectedExpiresInSec)).toBeLessThanOrEqual(
      this.clockSkewSec,
    );

    this.validateScopeFields(item);
  }

  validateListInvitations(
    list: SentInvitationsListModel,
    status: "all" | InvitationListStatus = "all",
    now: Date = new Date(),
  ) {
    this.validateSummaryPartition(list.summary);
    this.validateFilteredTotal(list, status);
    this.validatePagination(list);
    this.validateFilterOptions(list);
    this.validateFilterRolesCatalog(list);
    this.validateCreatedAtDescOrder(list.invitations);
    list.invitations.forEach((item) => this.validateInvitationItem(item, now));
  }

  validateStatusFilter(
    invitations: SentInvitationItem[],
    status: InvitationListStatus,
    now: Date = new Date(),
  ) {
    expect(invitations.length).toBeGreaterThanOrEqual(0);
    for (const item of invitations) {
      expect(InviteMapper.classifyInvitationStatus(item, now)).toBe(status);
      expect(item.status).toBe(status);
    }
  }

  validateRoleFilter(
    invitations: SentInvitationItem[],
    role: string,
  ) {
    for (const item of invitations) {
      expect(item.role.toLowerCase()).toBe(role.toLowerCase());
    }
  }

  validateEmailSearch(
    invitations: SentInvitationItem[],
    query: string,
  ) {
    const needle = query.trim().toLowerCase();
    for (const item of invitations) {
      expect(item.email.toLowerCase()).toContain(needle);
    }
  }

  validateCreatedInvitationInList(
    list: SentInvitationsListModel,
    invitationId: string,
    email: string,
    role: string,
  ) {
    const item = InviteMapper.findInvitationById(list, invitationId);
    expect(item, `Invitation ${invitationId} not found in list`).toBeDefined();
    expect(InviteMapper.emailsMatch(email, item!.email)).toBe(true);
    expect(item!.role.toLowerCase()).toBe(role.toLowerCase());
    expect(item!.status).toBe("pending");
    this.validateInvitationItem(item!);
  }

  validatePreviewInvalid(
    status: number,
    body: { success?: boolean; error?: { code?: string; message?: string } },
    expectedCode: string,
  ) {
    expect(status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error?.code).toBe(expectedCode);
    expect(body.error?.message?.length).toBeGreaterThan(0);
  }

  validateAcceptInvalid(
    status: number,
    body: { success?: boolean; error?: { code?: string; message?: string } },
    expectedCode: string,
  ) {
    expect([401, 404, 409]).toContain(status);
    expect(body.success).toBe(false);
    expect(body.error?.code).toBe(expectedCode);
  }

  validateUnknownRoleError(
    status: number,
    body: { success?: boolean; error?: { code?: string; message?: string } },
    role: string,
  ) {
    expect(status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error?.code).toBe("VALIDATION_ERROR");
    expect(body.error?.message?.toLowerCase()).toContain(role.toLowerCase());
  }
}
