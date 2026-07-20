import type { APIResponse } from "@playwright/test";
import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import { postWithAutoRefresh } from "../../../core/utils/authenticated.request";
import type { BulkUploadFileInput } from "../Data/bulk-upload-consumers.data";
import { BulkUploadConsumersResponse } from "../Mapper/bulk-upload-consumers.mapper";
export type BulkUploadConsumersApiResult =
  ApiCallResult<BulkUploadConsumersResponse>;
const RETRY_STATUSES = new Set([429, 500, 502, 503, 504]);
const MAX_UPLOAD_ATTEMPTS = 5;
const BASE_RETRY_DELAY_MS = 3_000;
function retryDelayMs(status: number, attempt: number): number {
  if (status === 429) {
    return BASE_RETRY_DELAY_MS * attempt * 2;
  }
  return BASE_RETRY_DELAY_MS * attempt;
}
export class BulkUploadConsumersApi extends TimedApiClient {
  async bulkUploadConsumers(
    upload: BulkUploadFileInput,
  ): Promise<BulkUploadConsumersApiResult> {
    const start = Date.now();
    let rawResponse!: APIResponse;
    let text = "";
    for (let attempt = 1; attempt <= MAX_UPLOAD_ATTEMPTS; attempt += 1) {
      rawResponse = await postWithAutoRefresh(
        this.authenticatedApi,
        "/indore/master-data/bulk-upload-consumers",
        {
          multipart: {
            file: {
              name: upload.fileName,
              mimeType: upload.mimeType,
              buffer: upload.buffer,
            },
          },
          timeout: MASTER_DATA_MAX_RESPONSE_TIME_MS,
        },
      );
      text = await rawResponse.text();
      const status = rawResponse.status();
      if (!RETRY_STATUSES.has(status) || attempt === MAX_UPLOAD_ATTEMPTS) {
        break;
      }
      await new Promise<void>((resolve) =>
        setTimeout(resolve, retryDelayMs(status, attempt)),
      );
    }
    let responseBody: BulkUploadConsumersResponse;
    if (!text.trim()) {
      responseBody = null as unknown as BulkUploadConsumersResponse;
    } else {
      try {
        responseBody = JSON.parse(text) as BulkUploadConsumersResponse;
      } catch {
        throw new Error(
          `POST /indore/master-data/bulk-upload-consumers returned non-JSON (${rawResponse.status()}): ${text.slice(0, 200)}`,
        );
      }
    }
    return {
      rawResponse,
      responseBody,
      responseTime: Date.now() - start,
    };
  }
}
