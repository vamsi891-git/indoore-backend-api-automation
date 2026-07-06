import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import { postWithAutoRefresh } from "../../../core/utils/authenticated.request";
import type { BulkUploadFileInput } from "../Data/bulk-upload-meters.data";
import { BulkUploadMetersResponse } from "../Mapper/bulk-upload-meters.mapper";

export type BulkUploadMetersApiResult = ApiCallResult<BulkUploadMetersResponse>;

export class BulkUploadMetersApi extends TimedApiClient {
  async bulkUploadMeters(
    upload: BulkUploadFileInput,
  ): Promise<BulkUploadMetersApiResult> {
    const start = Date.now();
    const rawResponse = await postWithAutoRefresh(
      this.authenticatedApi,
      "/indore/master-data/bulk-upload-meters",
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
    let responseBody: BulkUploadMetersResponse;
    if (!text.trim()) {
      responseBody = null as unknown as BulkUploadMetersResponse;
    } else {
      try {
        responseBody = JSON.parse(text) as BulkUploadMetersResponse;
      } catch {
        throw new Error(
          `POST /indore/master-data/bulk-upload-meters returned non-JSON (${rawResponse.status()}): ${text.slice(0, 200)}`,
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
