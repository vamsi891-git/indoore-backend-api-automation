import {
  APIRequestContext,
  APIResponse
} from "@playwright/test";

import {
  EventReportResponse
} from "../Mapper/eventreport.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
export interface EventReportApiResult {

  rawResponse: APIResponse;

  responseBody: EventReportResponse;

  responseTime: number;
}

export class EventReportApi {

  constructor(
    private readonly authenticatedApi:
    APIRequestContext
  ) {}

  async getEventReport(
    params: Record<
      string,
      string | number | boolean
    >
  ): Promise<EventReportApiResult> {

    const start =
      Date.now();

    const response =
      await getWithAutoRefresh(this.authenticatedApi,

        "/indore/reports/event-report",

        {
          params
        }
      );

    const responseTime =
      Date.now() - start;

    if (!response.ok()) {

      throw new Error(`

        Status:
        ${response.status()}

        Body:
        ${await response.text()}
      `);
    }

    return {

      rawResponse:
        response,

      responseBody:
        await response.json(),

      responseTime
    };
  }
}