export interface ConsumerSearchItem {
  consumerId: number;
  consumerName: string;
}

export interface ConsumerSearchResponse {
  success: boolean;
  data: ConsumerSearchItem[];
}

export class ConsumerSearchMapper {
  static map(response: ConsumerSearchResponse): {
    success: boolean;
    data: ConsumerSearchItem[];
    totalRecords: number;
  } {
    const consumers = response.data ?? [];
    return {
      success: response.success,
      data: consumers.map((consumer) => ({
        consumerId: Number(consumer.consumerId),
        consumerName: consumer.consumerName?.trim() ?? "",
      })),
      totalRecords: consumers.length,
    };
  }
}
