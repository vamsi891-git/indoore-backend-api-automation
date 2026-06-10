import {
  InviteUserResponse,
  SentInvitationItem,
  SentInvitationsListResponse,
} from "../schemas/auth.schemas";
import { normalizeInviteEmail } from "../Data/invite.data";

export interface InviteUserModel {
  invitationId: string;
  email: string;
  expiresAt: Date;
  replacedPendingInvitation: boolean;
  emailSent: boolean;
}

export interface SentInvitationsListModel {
  invitations: SentInvitationItem[];
  summary: SentInvitationsListResponse["data"]["summary"];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  filterOptions: SentInvitationsListResponse["data"]["filterOptions"];
}

export type InvitationListStatus = "pending" | "accepted" | "expired";

export class InviteMapper {
  /**
   * Mirrors `buildInviterInvitationWhere` status buckets:
   * accepted → used_at set; pending → unused & not expired; expired → unused & past expires_at.
   */
  static classifyInvitationStatus(
    item: Pick<SentInvitationItem, "acceptedAt" | "expiresAt">,
    now: Date = new Date(),
  ): InvitationListStatus {
    if (item.acceptedAt != null) {
      return "accepted";
    }
    if (new Date(item.expiresAt).getTime() <= now.getTime()) {
      return "expired";
    }
    return "pending";
  }

  static countInvitationsByStatus(
    invitations: SentInvitationItem[],
    now: Date = new Date(),
  ): Record<InvitationListStatus, number> {
    return invitations.reduce(
      (counts, item) => {
        counts[this.classifyInvitationStatus(item, now)] += 1;
        return counts;
      },
      { pending: 0, accepted: 0, expired: 0 } as Record<
        InvitationListStatus,
        number
      >,
    );
  }

  static distinctInvitationRoles(invitations: SentInvitationItem[]): string[] {
    return [...new Set(invitations.map((item) => item.role))].sort((a, b) =>
      a.localeCompare(b),
    );
  }

  static mapInviteUser(response: InviteUserResponse): InviteUserModel {
    const { data } = response;
    return {
      invitationId: data.invitationId,
      email: data.email,
      expiresAt: new Date(data.expiresAt),
      replacedPendingInvitation: data.replacedPendingInvitation,
      emailSent: data.emailSent,
    };
  }

  static mapSentInvitationsList(
    response: SentInvitationsListResponse,
  ): SentInvitationsListModel {
    const { data } = response;
    return {
      invitations: data.invitations,
      summary: data.summary,
      page: data.page,
      limit: data.limit,
      total: data.total,
      totalPages: data.totalPages,
      filterOptions: data.filterOptions,
    };
  }

  static resolveInvitableRole(
    rolesBody: {
      data?: { roles?: Array<{ name: string; isUltimate?: boolean }> };
    },
    preferred: readonly string[],
    fallback: string,
  ): string {
    const roles = rolesBody.data?.roles ?? [];
    for (const name of preferred) {
      const match = roles.find(
        (role) => role.name.toLowerCase() === name.toLowerCase() && !role.isUltimate,
      );
      if (match) {
        return match.name;
      }
    }
    const nonUltimate = roles.find((role) => !role.isUltimate);
    return nonUltimate?.name ?? fallback;
  }

  static emailsMatch(requestEmail: string, responseEmail: string): boolean {
    return normalizeInviteEmail(requestEmail) === normalizeInviteEmail(responseEmail);
  }

  static findInvitationById(
    list: SentInvitationsListModel,
    invitationId: string,
  ): SentInvitationItem | undefined {
    return list.invitations.find((item) => item.id === invitationId);
  }
}
