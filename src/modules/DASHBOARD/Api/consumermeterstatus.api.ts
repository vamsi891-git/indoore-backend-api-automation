import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { ConsumerMeterStatusResponse } from "../Mapper/consumermeterstatus.mapper";

export type ConsumerMeterStatusApiResult =
    ApiCallResult<ConsumerMeterStatusResponse>;

export class ConsumerMeterStatusApi extends TimedApiClient {
    getConsumerMeterStatus(): Promise<ConsumerMeterStatusApiResult> {
        return this.getJson<ConsumerMeterStatusResponse>(
            "/indore/dashboard/consumer/meter-status",
            { timeout: MASTER_DATA_REQUEST_TIMEOUT_MS },
        );
    }
}
