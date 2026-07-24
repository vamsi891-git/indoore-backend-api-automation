import { test, expect } from "../../../fixtures/observability.fixture";
import {
  assertContractSnapshot,
  buildLookupItemsContractSnapshot,
} from "../../../core/contract/contract-snapshot.helper";
import { ProfileImageApi } from "../Api/profileimage.api";
import { ProfileImageData } from "../Data/profileimage.data";

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

test.describe("USERS-PROFILE-IMAGE — Contract Snapshots", () => {
  test.setTimeout(120_000);

  test(
    "Profile Image Upload-URL Contract Snapshot",
    { tag: ["@contract-snapshot", "@users-profile-image"] },
    async ({ authenticatedApi }) => {
      const result = await new ProfileImageApi(
        authenticatedApi,
      ).getProfileImageUploadUrl(ProfileImageData.buildUploadRequest());
      expect(result.rawResponse.status()).toBe(200);
      const body = asRecord(result.responseBody);
      expect(body.success).toBe(true);
      const data = asRecord(body.data);
      await assertContractSnapshot(
        "users-profile-image/upload-url",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/users/me/profile-image/upload-url",
          dataKeys: Object.keys(data).sort(),
          itemKeys: Object.keys(data).sort(),
        }),
      );
    },
  );
});
