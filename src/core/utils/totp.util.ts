import crypto from "crypto";

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function decodeBase32(secret: string): Buffer {
  const cleaned = secret.replace(/[\s=-]/g, "").toUpperCase();
  if (!cleaned) {
    throw new Error("TOTP_SECRET is empty");
  }

  let bits = "";
  for (const ch of cleaned) {
    const val = BASE32.indexOf(ch);
    if (val < 0) {
      throw new Error("TOTP_SECRET must be a base32 authenticator secret");
    }
    bits += val.toString(2).padStart(5, "0");
  }

  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

/** RFC 6238 TOTP (SHA-1, 30s, 6 digits). `periodOffset` is -1 / 0 / +1 for clock skew. */
export function generateTotp(
  secret: string,
  periodOffset = 0,
  atMs = Date.now(),
): string {
  const key = decodeBase32(secret);
  const counter = Math.floor(atMs / 1000 / 30) + periodOffset;
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buf.writeUInt32BE(counter >>> 0, 4);
  const hmac = crypto.createHmac("sha1", key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const bin =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(bin % 1_000_000).padStart(6, "0");
}

export function getTotpSecret(): string {
  return (process.env.TOTP_SECRET ?? "").trim();
}
