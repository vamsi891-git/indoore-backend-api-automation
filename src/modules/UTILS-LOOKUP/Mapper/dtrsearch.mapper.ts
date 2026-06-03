export interface DtrSearchResponse {
    success: boolean;
    data: DtrSearchData;
  }
  
  export interface DtrSearchData {
    item: DtrItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
  
  export interface DtrItem {
    slNo: number;
  
    circle: string | null;
    division: string | null;
    zone: string | null;
    subStation: string | null;
    feeder: string | null;
  
    code: string;
    dtrCode: string;
    dtrName: string;
    dtr: string;
  
    meterSerialNumber: string | null;
    mf: string | null;
  
    latitude: string | null;
    longitude: string | null;
  
    serviceDate: string | null;
  }
  
  export class DtrSearchMapper {
    static mapData(data: any): DtrSearchData {
      return {
        item: data.items ?? [],
        total: data.total ?? 0,
        page: data.page ?? 1,
        limit: data.limit ?? 20,
        totalPages: data.totalPages ?? 0,
      };
    }
  }