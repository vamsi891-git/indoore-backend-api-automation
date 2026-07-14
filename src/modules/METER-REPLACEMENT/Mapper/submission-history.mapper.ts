export type SubmissionStatus =
    | "PENDING"
    | "COMPLETED";

export interface SubmissionHistoryItem {
    id: number;
    consumerName: string;
    oldMeterSerial: string;
    newMeterSerial: string | null;
    replacementReason: string | null;
    status: SubmissionStatus;
    createdAt: string;
}

export interface SubmissionPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface SubmissionHistoryData {
    items: SubmissionHistoryItem[];
    pagination: SubmissionPagination;
}

export interface SubmissionHistoryResponse {
    success: boolean;
    data: SubmissionHistoryData;
}

export class SubmissionHistoryMapper {

    static map(response: SubmissionHistoryResponse,): SubmissionHistoryData & { success: boolean } {
        const data =response.data ??({} as SubmissionHistoryData);
        return {
            success: response.success,
            items: (data.items ?? []).map((item) => ({
                id: item.id,
                consumerName:item.consumerName?.trim() ?? "",
                oldMeterSerial:item.oldMeterSerial?.trim() ?? "",
                newMeterSerial:item.newMeterSerial?.trim() ?? null,
                replacementReason:item.replacementReason?.trim() ?? null,
                status:item.status ?? "PENDING",
                createdAt:item.createdAt?.trim() ?? "",
            })),
            pagination: {
                page:data.pagination?.page ?? 1,
                limit:data.pagination?.limit ?? 20,
                total:data.pagination?.total ?? 0,
                totalPages:data.pagination?.totalPages ?? 0,
            },
        };
    }
}