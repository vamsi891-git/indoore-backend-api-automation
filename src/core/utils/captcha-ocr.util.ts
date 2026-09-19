import sharp from "sharp";
import { createWorker, PSM, type Worker } from "tesseract.js";
import { LoggerEngine } from "../engine/logger.engine";

/** Same charset as the login SVG CAPTCHA (no 0/O/1/I/l/i). */
export const CAPTCHA_OCR_CHARSET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

const DEFAULT_CAPTCHA_ATTEMPTS = 5;

let ocrWorker: Promise<Worker> | undefined;

function getOcrWorker(): Promise<Worker> {
  if (!ocrWorker) {
    ocrWorker = (async () => {
      const worker = await createWorker("eng", 1, {
        logger: () => undefined,
      });
      await worker.setParameters({
        tessedit_char_whitelist: CAPTCHA_OCR_CHARSET,
        tessedit_pageseg_mode: PSM.SINGLE_LINE,
      });
      return worker;
    })();
  }
  return ocrWorker;
}

export function normalizeCaptchaOcrText(raw: string): string {
  return raw
    .replace(/\s+/g, "")
    .split("")
    .filter((ch) => CAPTCHA_OCR_CHARSET.includes(ch))
    .join("");
}

/**
 * Rasterize a login CAPTCHA SVG and OCR the 6-character answer.
 * Does not call the API. Prefer non-prod `data.text` when the API returns it.
 */
export async function solveCaptchaSvg(svg: string): Promise<string> {
  const trimmed = svg.trim();
  if (!trimmed) {
    throw new Error("CAPTCHA SVG is empty");
  }

  const png = await sharp(Buffer.from(trimmed))
    .resize(540, 168, { fit: "fill" })
    .grayscale()
    .threshold(160)
    .png()
    .toBuffer();

  const worker = await getOcrWorker();
  const { data } = await worker.recognize(png);
  const guess = normalizeCaptchaOcrText(data.text ?? "");
  if (!guess) {
    throw new Error("CAPTCHA OCR returned no characters from the allowed charset");
  }
  return guess;
}

function isInvalidCaptchaError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /INVALID_CAPTCHA/i.test(message);
}

/**
 * Staff login with OCR CAPTCHA. Retries live inside AuthApi.login (INVALID_CAPTCHA).
 * Uses existing CSRF / 2FA / device-selection. Never logs credentials.
 */
export async function getAuthenticatedSession(
  email: string,
  password: string,
  maxAttempts = DEFAULT_CAPTCHA_ATTEMPTS,
): Promise<{ accessToken: string }> {
  const { AuthApi } = await import("./auth.util");
  try {
    const session = await AuthApi.login({ email, password });
    LoggerEngine.debug(
      `CAPTCHA login succeeded (maxAttempts=${maxAttempts})`,
    );
    return { accessToken: session.accessToken };
  } catch (error) {
    const lastError = error instanceof Error ? error : new Error(String(error));
    LoggerEngine.debug(
      `CAPTCHA login failed code=${
        isInvalidCaptchaError(lastError) ? "INVALID_CAPTCHA" : "OTHER"
      }`,
    );
    if (isInvalidCaptchaError(lastError) && !/after \d+ CAPTCHA attempt/i.test(lastError.message)) {
      throw new Error(
        `Login failed after ${maxAttempts} CAPTCHA attempt(s). ${lastError.message}`,
      );
    }
    throw lastError;
  }
}
