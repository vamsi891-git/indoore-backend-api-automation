export interface BillingPeriodResponse {
    success: boolean;
    data: any;
}
export class BillingPeriodMapper {
    static map(response: BillingPeriodResponse) {
        const data = response.data;
        return {
            monthlyConsumption:data.monthlyConsumption,
            dailyConsumption:data.dailyConsumption,
            totalOutstanding:data.totalOutstanding,
            billStatus:data.billStatus
        };
    }
}