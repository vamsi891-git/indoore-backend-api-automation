// Mapper/paymentcontract.mapper.ts
export interface PaymentContractResponse {
  success: boolean;
  data: PaymentContractData;
}
export interface PaymentContractData {
  items: PaymentContractItem[];
}
export interface PaymentContractItem {
  id: number;
  name: string;
  code: string | null;
}
export class PaymentContractMapper {
  static mapData(data: PaymentContractData): PaymentContractData {
    return {
      items: data.items ?? [],
    };
  }
}
