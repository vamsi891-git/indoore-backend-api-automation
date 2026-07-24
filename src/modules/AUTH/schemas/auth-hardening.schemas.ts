import { z } from "zod";
import {
  AuthMeDataSchema,
  AuthDevicesDataSchema,
  SentInvitationsListDataSchema,
} from "./auth.schemas";

/** Soft generic envelopes for mutation scaffolding. */
export const AuthSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.unknown(),
    message: z.string().optional(),
  })
  .strict();

export const AuthListSuccessResponseSchema = AuthSuccessResponseSchema;

/** Strict roots for mutation-proof unexpected-field checks. */
export const AuthMeStrictResponseSchema = z
  .object({
    success: z.literal(true),
    data: AuthMeDataSchema,
  })
  .strict();

export const AuthDevicesStrictResponseSchema = z
  .object({
    success: z.literal(true),
    data: AuthDevicesDataSchema,
  })
  .strict();

export const SentInvitationsStrictResponseSchema = z
  .object({
    success: z.literal(true),
    data: SentInvitationsListDataSchema,
  })
  .strict();
