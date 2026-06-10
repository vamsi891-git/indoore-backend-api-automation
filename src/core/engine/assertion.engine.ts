import {APIResponse,expect} from "@playwright/test";
export class AssertionEngine {
  // =====================================
  // STATUS CODE
  // =====================================
  validateStatusCode(response: APIResponse,expectedStatus: number,responseBody?: unknown): void {
    const actual = response.status();
    const bodyDetail = responseBody !== undefined ? `\nResponse body: ${JSON.stringify(responseBody)}`: "";
    expect(actual,`Expected status ${expectedStatus} but received ${actual}${bodyDetail}`).toBe(expectedStatus);
  }
  // =====================================
  // CONTENT TYPE
  // =====================================
  validateContentType(response: APIResponse,expectedType: string = "application/json"): void {
    const contentType =response.headers()["content-type"];
    expect(contentType,"Invalid content-type").toContain(expectedType);
  }
  // =====================================
  // RESPONSE TIME
  // =====================================
  validateResponseTime(responseTime: number,maxTime: number): void {
    expect(responseTime,`Response exceeded ${maxTime}ms`).toBeLessThan(maxTime);
  }
  // =====================================
  // EMPTY RESPONSE
  // =====================================
  validateNotEmpty(data: any[]): void {
    expect(data.length,"Response data is empty").toBeGreaterThan(0);
  }
  // =====================================
  // REQUIRED FIELDS
  // =====================================
  validateRequiredFields(json: object,fields: string[]): void {
    const record =json as Record<string, unknown>;
    for (const field of fields) {
      expect(record[field], `Missing or undefined field: ${field}`).toBeDefined();
    }
  }
  // =====================================
  // SECURITY VALIDATION
  // =====================================
  validateSensitiveData(json: any): void {
    const jsonString =JSON.stringify(json);
    const sensitivePatterns = [/Bearer\s+[A-Za-z0-9-_\.]+/,/eyJ[A-Za-z0-9-_]+/,/"(?:password|passwd|pwd|secret|apiKey|api_key|accessToken|access_token|refreshToken|refresh_token)"\s*:\s*"(?!null)[^"]+"/i];
      // Match credential fields with values, not permission keys like reset_password
    for (const pattern of sensitivePatterns) {
      expect(jsonString).not.toMatch(pattern);
    }
  }
  // =====================================
  // FINAL BUSINESS ASSERTIONS
  // =====================================
  assertValidationResults(results: any[]): void {
    const failedResults =results.filter(r => r.status === "FAIL");
    expect(failedResults,JSON.stringify(failedResults,null,2)).toHaveLength(0);
  }
}