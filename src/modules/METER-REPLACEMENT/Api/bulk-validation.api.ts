import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { postMeterReplacementJsonWithRetry } from "../utils/Meter replacement request.helper";
import type { BulkUploadFileInput } from "../Data/bulk-validation.data";
import { BulkValidateMeterReplacementResponse } from "../Mapper/bulk-validation.mapper";

export type BulkValidateMeterReplacementApiResult =
  ApiCallResult<BulkValidateMeterReplacementResponse>;

export class BulkValidateMeterReplacementApi extends TimedApiClient {
  async bulkValidate(
    upload: BulkUploadFileInput,
  ): Promise<BulkValidateMeterReplacementApiResult> {
    const { rawResponse, responseBody, responseTime } =
      await postMeterReplacementJsonWithRetry<BulkValidateMeterReplacementResponse>(
        this.authenticatedApi,
        "/indore/meter-replacement/bulk/validate",
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