import { APIRequestContext,  APIResponse } from "@playwright/test";
import { EventLogCardsResponse } from "../Mapper/eventlogcards.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
export interface EventLogCardsApiResult {
    rawResponse: APIResponse;
    responseBody: EventLogCardsResponse;
    responseTime: number;
}
export class EventLogCardsApi {
    constructor(private readonly authenticatedApi: APIRequestContext) { }
    async getEventLogCards(consumerNumber: string): Promise<EventLogCardsApiResult> {
        const start = Date.now();
        const response =await getWithAutoRefresh(this.authenticatedApi,`/indore/consumers/${consumerNumber}/event-log/cards`);
        return {
            rawResponse: response,
            responseBody: await response.json(),
            responseTime: Date.now() - start
        };
    }
}