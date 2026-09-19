import { test, expect } from "@playwright/test";
import {
  CAPTCHA_OCR_CHARSET,
  normalizeCaptchaOcrText,
  solveCaptchaSvg,
} from "../utils/captcha-ocr.util";

test.describe("captcha-ocr.util", () => {
  test("normalizeCaptchaOcrText keeps charset only", () => {
    expect(normalizeCaptchaOcrText(" 7 9 B v E x 0 O I l ")).toBe("79BvEx");
    expect(CAPTCHA_OCR_CHARSET.includes("0")).toBe(false);
  });

  test("solveCaptchaSvg rejects an empty SVG", async () => {
    await expect(solveCaptchaSvg("   ")).rejects.toThrow("CAPTCHA SVG is empty");
  });
});
