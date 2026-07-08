import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { postMasterDataJsonWithRetry } from "../utils/master-data-request.helper";
import type { BulkUploadFileInput } from "../Data/bulk-upload-meters.data";
import { BulkUploadMetersResponse } from "../Mapper/bulk-upload-meters.mapper";

export type BulkUploadMetersApiResult = ApiCallResult<BulkUploadMetersResponse>;

export class BulkUploadMetersApi extends TimedApiClient {
  async bulkUploadMeters(
    upload: BulkUploadFileInput,
  ): Promise<BulkUploadMetersApiResult> {
    const { rawResponse, responseBody, responseTime } =
      await postMasterDataJsonWithRetry<BulkUploadMetersResponse>(
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
        },
      );
    return {
      rawResponse,
      responseBody,
      responseTime,
    };
  }
}
