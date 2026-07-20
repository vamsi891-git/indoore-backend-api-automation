import { expect } from "@playwright/test";
import type {
  AberrationEntryByIvrsData,
  AberrationEntryByIvrsResponse,
} from "../Mapper/aberration-entry-by-ivrs.mapper";

export class AberrationEntryByIvrsValidator {
  validateResponse(response: AberrationEntryByIvrsResponse): void {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
  }

  validateIvrsEcho(data: AberrationEntryByIvrsData, requestedIvrs: string): void {
    expect(data.ivrsNo.trim().length).toBeGreaterThan(0);
    expect(data.ivrsNo.trim().toLowerCase()).toBe(
      requestedIvrs.trim().toLowerCase(),
    );
  }
}
