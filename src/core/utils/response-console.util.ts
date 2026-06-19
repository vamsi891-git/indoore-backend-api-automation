export function shouldPrintResponseAlways(): boolean {
  const flag = process.env.API_TEST_PRINT_RESPONSE?.trim().toLowerCase();
  return flag === "1" || flag === "true" || flag === "yes";
}

export interface PrintApiResponseOptions {
  apiName: string;
  status?: number;
  body: unknown;
  requestParams?: unknown;
}

function formatBody(body: unknown): string {
  if (body === undefined) {
    return "(undefined)";
  }
  if (typeof body === "string") {
    try {
      return JSON.stringify(JSON.parse(body), null, 2);
    } catch {
      return body;
    }
  }
  return JSON.stringify(body, null, 2);
}

export function printApiResponse(options: PrintApiResponseOptions): void {
  const { apiName, status, body, requestParams } = options;
  const divider = "-".repeat(50);

  console.log(`\n${divider}`);
  console.log("API RESPONSE");
  console.log(divider);
  console.log(`API    : ${apiName}`);
  console.log(`Status : ${status ?? "—"}`);
  if (requestParams !== undefined) {
    console.log("Request:");
    console.log(JSON.stringify(requestParams, null, 2));
  }
  console.log("Body:");
  console.log(formatBody(body));
  console.log(`${divider}\n`);
}
