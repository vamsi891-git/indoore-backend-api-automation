import { request as playwrightRequest } from "@playwright/test";

/** 1×1 transparent PNG for lightweight profile-image upload tests. */
export const PROFILE_IMAGE_TEST_BYTES = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
);

export async function putImageToPresignedUrl(
    uploadUrl: string,
    imageBytes: Buffer,
    contentType: string,
): Promise<{ status: number; body: string }> {
    const ctx = await playwrightRequest.newContext();
    const response = await ctx.put(uploadUrl, {
        headers: { "Content-Type": contentType },
        data: imageBytes,
    });
    const body = await response.text();
    await ctx.dispose();
    return { status: response.status(), body };
}
