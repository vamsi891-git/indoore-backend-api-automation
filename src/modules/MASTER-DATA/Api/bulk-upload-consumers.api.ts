import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import { postWithAutoRefresh } from "../../../core/utils/authenticated.request";
import type { BulkUploadFileInput } from "../Data/bulk-upload-consumers.data";
import { BulkUploadConsumersResponse } from "../Mapper/bulk-upload-consumers.mapper";

export type BulkUploadConsumersApiResult =
  ApiCallResult<BulkUploadConsumersResponse>;

export class BulkUploadConsumersApi extends TimedApiClient {
  async bulkUploadConsumers(
    upload: BulkUploadFileInput,
  ): Promise<BulkUploadConsumersApiResult> {
    const start = Date.now();
    const rawResponse = await postWithAutoRefresh(
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
    const text = await rawResponse.text();
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
