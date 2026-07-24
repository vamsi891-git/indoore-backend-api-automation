import { compareApiToDb, type DbCompareObs } from "../../../core/db/db-compare.engine";
import type {
  DbAuthDeviceRow,
  DbAuthInvitationSummary,
  DbAuthUserRow,
} from "./auth.db";

export function compareAuthCountLteDb(options: {
  label: string;
  apiCount: number;
  dbCount: number;
  obs?: DbCompareObs;
}): void {
  if (options.apiCount > options.dbCount) {
    throw new Error(
      `${options.label}: API ${options.apiCount} exceeds DB ${options.dbCount}`,
    );
  }
  if (options.apiCount === options.dbCount) {
    compareApiToDb(
      [
        {
          label: options.label,
          apiValue: options.apiCount,
          dbValue: options.dbCount,
        },
      ],
      `DB vs API — ${options.label}`,
      options.obs,
    );
  }
}

export function compareAuthMeToDb(options: {
  api: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    status: string;
    organisationLookupId?: number | null;
    networkLookupId?: number | null;
  };
  dbRow: DbAuthUserRow;
  obs?: DbCompareObs;
}): void {
  const fields = [
    {
      label: "id",
      apiValue: options.api.id,
      dbValue: options.dbRow.id,
    },
    {
      label: "email",
      apiValue: options.api.email.trim().toLowerCase(),
      dbValue: String(options.dbRow.email ?? "")
        .trim()
        .toLowerCase(),
    },
    {
      label: "firstName",
      apiValue: options.api.firstName.trim(),
      dbValue: String(options.dbRow.first_name ?? "").trim(),
    },
    {
      label: "lastName",
      apiValue: options.api.lastName.trim(),
      dbValue: String(options.dbRow.last_name ?? "").trim(),
    },
    {
      label: "role",
      apiValue: options.api.role.trim(),
      dbValue: String(options.dbRow.role_name ?? "").trim(),
    },
    {
      label: "status",
      apiValue: options.api.status.trim().toLowerCase(),
      dbValue: String(options.dbRow.status ?? "")
        .trim()
        .toLowerCase(),
    },
  ];

  if (
    options.api.organisationLookupId != null ||
    options.dbRow.organisation_lookup_id != null
  ) {
    fields.push({
      label: "organisationLookupId",
      apiValue: options.api.organisationLookupId ?? null,
      dbValue: options.dbRow.organisation_lookup_id,
      optional: true,
    } as never);
  }
  if (
    options.api.networkLookupId != null ||
    options.dbRow.network_lookup_id != null
  ) {
    fields.push({
      label: "networkLookupId",
      apiValue: options.api.networkLookupId ?? null,
      dbValue: options.dbRow.network_lookup_id,
      optional: true,
    } as never);
  }

  compareApiToDb(fields, "DB vs API — Auth /me", options.obs);
}

export function compareAuthDeviceSpotToDb(options: {
  api: { id: string; deviceType?: string | null; name?: string | null };
  dbRow: DbAuthDeviceRow;
  obs?: DbCompareObs;
}): void {
  compareApiToDb(
    [
      {
        label: "id",
        apiValue: options.api.id,
        dbValue: options.dbRow.id,
      },
      {
        label: "deviceType",
        apiValue: options.api.deviceType?.trim() ?? null,
        dbValue: options.dbRow.device_type?.trim() ?? null,
        optional: true,
      },
      {
        label: "name",
        apiValue: options.api.name?.trim() ?? null,
        dbValue: options.dbRow.name?.trim() ?? null,
        optional: true,
      },
    ],
    "DB vs API — Auth device spot",
    options.obs,
  );
}

export function compareAuthInvitationSummaryToDb(options: {
  api: {
    total: number;
    acceptedCount: number;
    pendingCount: number;
    expiredCount: number;
  };
  dbRow: DbAuthInvitationSummary;
  obs?: DbCompareObs;
}): void {
  compareApiToDb(
    [
      {
        label: "summary.total",
        apiValue: options.api.total,
        dbValue: options.dbRow.total,
      },
      {
        label: "summary.acceptedCount",
        apiValue: options.api.acceptedCount,
        dbValue: options.dbRow.accepted_count,
      },
      {
        label: "summary.pendingCount",
        apiValue: options.api.pendingCount,
        dbValue: options.dbRow.pending_count,
      },
      {
        label: "summary.expiredCount",
        apiValue: options.api.expiredCount,
        dbValue: options.dbRow.expired_count,
      },
    ],
    "DB vs API — Auth invitation summary",
    options.obs,
  );
}
