import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { postMasterDataJsonWithRetry } from "../utils/master-data-request.helper";
import type { BulkUploadFileInput } from "../Data/bulk-upload-dtr.data";
import { BulkUploadDtrResponse } from "../Mapper/bulk-upload-dtr.mapper";

export type BulkUploadDtrApiResult = ApiCallResult<BulkUploadDtrResponse>;

export class BulkUploadDtrApi extends TimedApiClient {
  async bulkUploadDtr(
    upload: BulkUploadFileInput,
  ): Promise<BulkUploadDtrApiResult> {
    const { rawResponse, responseBody, responseTime } =
      await postMasterDataJsonWithRetry<BulkUploadDtrResponse>(
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
        },
      );
    return {
      rawResponse,
      responseBody,
      responseTime,
    };
  }
}
