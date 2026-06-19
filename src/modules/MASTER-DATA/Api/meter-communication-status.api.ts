import { APIRequestContext, APIResponse } from "@playwright/test";
import {
  MeterCommunicationStatusQuery,
  MeterCommunicationStatusResponse,
} from "../Mapper/meter-communication-status.mapper";

export interface MeterCommunicationStatusApiResult {
  rawResponse: APIResponse;
  responseBody: MeterCommunicationStatusResponse;
  responseTime: number;
}

export class MeterCommunicationStatusApi {
  constructor(private readonly request: APIRequestContext) {}

  async getMeterCommunicationStatus(
    query: MeterCommunicationStatusQuery = { page: 1, limit: 20 },
  ): Promise<MeterCommunicationStatusApiResult> {
    const start = Date.now();
    const params: Record<string, string | number> = {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    };
    if (query.organisationLookupId != null) {
      params.organisationLookupId = query.organisationLookupId;
    }
    if (query.networkLookupId != null) {
      params.networkLookupId = query.networkLookupId;
    }
    if (query.q?.trim()) {
      params.q = query.q.trim();
    }
    if (query.communicationStatus) {
      params.communicationStatus = query.communicationStatus;
    }

    const rawResponse = await this.request.get(
      "/indore/master-data/meter-communication-status",
      { params },
    );
    const responseBody =
      (await rawResponse.json()) as MeterCommunicationStatusResponse;

    return {
      rawResponse,
      responseBody,
      responseTime: Date.now() - start,
    };
  }
}
