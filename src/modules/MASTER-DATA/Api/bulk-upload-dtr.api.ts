import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import { postWithAutoRefresh } from "../../../core/utils/authenticated.request";
import type { BulkUploadFileInput } from "../Data/bulk-upload-dtr.data";
import { BulkUploadDtrResponse } from "../Mapper/bulk-upload-dtr.mapper";

export type BulkUploadDtrApiResult = ApiCallResult<BulkUploadDtrResponse>;

export class BulkUploadDtrApi extends TimedApiClient {
  async bulkUploadDtr(
    upload: BulkUploadFileInput,
  ): Promise<BulkUploadDtrApiResult> {
    const start = Date.now();
    const rawResponse = await postWithAutoRefresh(
      this.authenticatedApi,
      "/indore/master-data/bulk-upload-dtr",
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
    let responseBody: BulkUploadDtrResponse;
    if (!text.trim()) {
      responseBody = null as unknown as BulkUploadDtrResponse;
    } else {
      try {
        responseBody = JSON.parse(text) as BulkUploadDtrResponse;
      } catch {
        throw new Error(
          `POST /indore/master-data/bulk-upload-dtr returned non-JSON (${rawResponse.status()}): ${text.slice(0, 200)}`,
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
