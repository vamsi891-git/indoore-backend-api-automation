export interface ConsumerValidationQuery {
  page?: number;
  limit?: number;
  fromDate?: string;
  toDate?: string;
}

export interface ConsumerValidationColumn {
  key: string;
  header: string;
}

export interface ConsumerValidationRow {
  id: string;
  consumerId: string;
  consumerName: string;
  ivrsNumber: string;
  accountId: string;
  meterSerialNumber: string;
  meterPhase: string;
  category: string;
  validationName: string;
  validationRule: string;
  validationStatus: string;
  validationDate: string;
}

export interface ConsumerValidationPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ConsumerValidationRawData {
  columns?: ConsumerValidationColumn[];
  rows?: ConsumerValidationRow[];
  pagination?: Partial<ConsumerValidationPagination>;
}

export interface ConsumerValidationResponse {
  success: boolean;
  data?: ConsumerValidationRawData;
  error?: { code?: string; message?: string };
}

export interface ConsumerValidationData {
  columns: ConsumerValidationColumn[];
  rows: ConsumerValidationRow[];
  pagination: ConsumerValidationPagination;
}

export class ConsumerValidationMapper {
  static mapData(data: ConsumerValidationRawData | undefined): ConsumerValidationData {
    const pagination = data?.pagination ?? {};
    return {
      columns: data?.columns ?? [],
      rows: data?.rows ?? [],
      pagination: {
        page: Number(pagination.page ?? 1),
        limit: Number(pagination.limit ?? 20),
        total: Number(pagination.total ?? 0),
        totalPages: Number(pagination.totalPages ?? 0),
      },
    };
  }
}
