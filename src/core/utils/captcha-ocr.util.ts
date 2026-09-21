import sharp from "sharp";
import { createWorker, PSM, type Worker } from "tesseract.js";
import { LoggerEngine } from "../engine/logger.engine";

/** Same charset as the login SVG CAPTCHA (no 0/O/1/I/l/i). */
export const CAPTCHA_OCR_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

/** Live login CAPTCHA is 4–6 characters after charset filter. */
export const CAPTCHA_MIN_LENGTH = 4;
export const CAPTCHA_MAX_LENGTH = 6;

const DEFAULT_CAPTCHA_ATTEMPTS = 5;

let ocrWorker: Promise<Worker> | undefined;

function getOcrWorker(): Promise<Worker> {
  if (!ocrWorker) {
    ocrWorker = (async () => {
      const worker = await createWorker("eng", 1, {
        logger: () => undefined,
        errorHandler: () => undefined,
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

export function isPlausibleCaptchaGuess(guess: string): boolean {
  return guess.length >= CAPTCHA_MIN_LENGTH && guess.length <= CAPTCHA_MAX_LENGTH;
}

type RasterPass = {
  name: string;
  build: (svg: Buffer) => Promise<Buffer>;
};

/**
 * Few fast rasterizations. Captcha tokens expire if OCR takes too long.
 */
function rasterPasses(): RasterPass[] {
  return [
    {
      name: "hires-sharpen",
      build: (svg) =>
        sharp(svg, { density: 200 })
          .resize(960, 240, { fit: "fill" })
          .grayscale()
          .normalize()
          .sharpen({ sigma: 1.2 })
          .png()
          .toBuffer(),
    },
    {
      name: "threshold-150",
      build: (svg) =>
        sharp(svg, { density: 200 })
          .resize(960, 240, { fit: "fill" })
          .grayscale()
          .normalize()
          .threshold(150)
          .png()
          .toBuffer(),
    },
    {
      name: "negate-threshold",
      build: (svg) =>
        sharp(svg, { density: 200 })
          .resize(800, 200, { fit: "fill" })
          .grayscale()
          .normalize()
          .negate()
          .threshold(145)
          .png()
          .toBuffer(),
    },
  ];
}

/**
 * Rasterize a login CAPTCHA SVG and OCR the answer (4–6 charset chars).
 * Returns the first plausible guess immediately (captchaId expires if we linger).
 */
export async function solveCaptchaSvg(svg: string): Promise<string> {
  const trimmed = svg.trim();
  if (!trimmed) {
    throw new Error("CAPTCHA SVG is empty");
  }

  const svgBuf = Buffer.from(trimmed);
  const worker = await getOcrWorker();
  let best = "";

  for (const pass of rasterPasses()) {
    try {
      const png = await pass.build(svgBuf);
      const { data } = await worker.recognize(png);
      const guess = normalizeCaptchaOcrText(data.text ?? "");
      if (guess.length > best.length) {
        best = guess;
      }
      if (isPlausibleCaptchaGuess(guess)) {
        LoggerEngine.debug(`CAPTCHA OCR pass=${pass.name} guess=${guess} (accepted)`);
        return guess;
      }
      LoggerEngine.debug(
        `CAPTCHA OCR pass=${pass.name} guess=${guess || "(empty)"} (rejected length)`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      LoggerEngine.debug(`CAPTCHA OCR pass=${pass.name} failed: ${message}`);
    }
  }

  if (isPlausibleCaptchaGuess(best)) {
    return best;
  }

  throw new Error(
    `CAPTCHA OCR could not read ${CAPTCHA_MIN_LENGTH}–${CAPTCHA_MAX_LENGTH} characters` +
      (best ? ` (best guess length ${best.length}: ${best})` : " (empty)"),
  );
}

function isInvalidCaptchaError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /INVALID_CAPTCHA/i.test(message);
}

/**
 * Staff login with OCR CAPTCHA. Retries live inside AuthApi.login (INVALID_CAPTCHA).
 */
export async function getAuthenticatedSession(
  email: string,
  password: string,
  maxAttempts = DEFAULT_CAPTCHA_ATTEMPTS,
): Promise<{ accessToken: string }> {
  const { AuthApi } = await import("./auth.util");
  try {
    const session = await AuthApi.login({ email, password });
    LoggerEngine.debug(`CAPTCHA login succeeded (maxAttempts=${maxAttempts})`);
    return { accessToken: session.accessToken };
  } catch (error) {
    const lastError = error instanceof Error ? error : new Error(String(error));
    if (isInvalidCaptchaError(lastError) && !/after \d+ CAPTCHA attempt/i.test(lastError.message)) {
      throw new Error(
        `Login failed after ${maxAttempts} CAPTCHA attempt(s). ${lastError.message}`,
        { cause: error },
      );
    }
    throw lastError;
  }
}
