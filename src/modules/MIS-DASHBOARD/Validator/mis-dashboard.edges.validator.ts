import { expect } from "@playwright/test";
import type { MisDashboardErrorCode } from "../Data/mis-dashboard.edges.data";

export type MisDashboardErrorBody = {
  success?: boolean;
  error?: {
    code?: string;
    message?: string;
  };
};

export class MisDashboardEdgesValidator {
  validateValidationError(body: MisDashboardErrorBody): void {
    expect(body.success).toBeFalsy();
    expect(body.error).toBeDefined();
    expect(body.error?.code).toBe("VALIDATION_ERROR");
    expect(body.error?.message).toBeTruthy();
  }

  validateRouteNotFound(body: MisDashboardErrorBody): void {
    expect(body.success).toBeFalsy();
    expect(body.error).toBeDefined();
    expect(body.error?.code).toBe("ROUTE_NOT_FOUND");
  }

  validateExpectedError(
    body: MisDashboardErrorBody,
    code: MisDashboardErrorCode,
  ): void {
    if (code === "ROUTE_NOT_FOUND") {
      this.validateRouteNotFound(body);
      return;
    }
    this.validateValidationError(body);
  }
}
