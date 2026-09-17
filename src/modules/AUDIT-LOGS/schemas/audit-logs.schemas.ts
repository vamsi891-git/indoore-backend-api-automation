import { z } from "zod";
import { ApiErrorResponseSchema } from "../../../core/schemas/api-response.schemas";

const requiredLabel = z.string().trim().min(1);
const nullableString = z.string().nullable();

export const AuditActionFilterOptionSchema = z
  .object({
    value: requiredLabel,
    label: requiredLabel,
  })
  .strict();

export const AuditLogSchema = z
  .object({
    id: requiredLabel,
    actorId: requiredLabel,
    targetId: nullableString,
    actorFullName: nullableString,
    actorEmail: nullableString,
    actorRoleName: nullableString,
    targetFullName: nullableString,
    targetEmail: nullableString,
    targetRoleName: nullableString,
    action: requiredLabel,
    details: z.record(z.string(), z.unknown()).nullable(),
    ipAddress: nullableString,
    createdAt: requiredLabel,
    actionLabel: requiredLabel,
    actorLabel: requiredLabel,
    roleLabel: requiredLabel,
    ipAddressLabel: requiredLabel,
    detailsLines: z.array(z.string()),
    detailsLabel: z.string(),
  })
  .strict();

export const AuditLogsListDataSchema = z
  .object({
    logs: z.array(AuditLogSchema),
    actionFilterOptions: z.array(AuditActionFilterOptionSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    totalPages: z.number().int().nonnegative(),
    nextCursor: z.string().nullable(),
  })
  .strict();

export const AuditLogsListSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: AuditLogsListDataSchema,
  })
  .strict();

/** Same as the list envelope — used by mutation proofs for root-level checks. */
export const AuditLogsSuccessResponseSchema = AuditLogsListSuccessResponseSchema;

export { ApiErrorResponseSchema };
