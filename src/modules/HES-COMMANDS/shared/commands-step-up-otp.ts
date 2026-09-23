import { generateTotp, getTotpSecret } from "../../../core/utils/totp.util";

/**
 * Step-up 2FA for HES command SET posts: include `otp` in the JSON body
 * (same TOTP_SECRET as login). GETs do not need otp.
 */
export function buildCommandsStepUpOtp(): string {
  const secret = getTotpSecret();
  if (!secret) {
    throw new Error("TOTP_SECRET required for step-up command SET (pass otp in POST body)");
  }
  return generateTotp(secret, 0);
}
