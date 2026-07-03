export interface ValidateDtrMeterQuery {
  meterSerialNumber: string;
}

export type ValidateDtrMeterScenario =
  | "valid_unmapped"
  | "already_on_dtrs"
  | "inactive"
  | "already_assigned"
  | "not_found";

export interface MeterDetails {
  meterPhaseTblRefId:number | null;
  simNo:string | null;
  imsiNo:string | null;
  mobileNo:string | null;
  ipAddress:string | null;
  modemSerialNumber:string | null;
  modemImei:string | null;
  meterInitialReading:string | null;
  meterInitialReadingDate:string | null;
  meterInitialReadingTime:string | null;
  mainSubMeterTblRefId:number | null;
  servicePointId:number | null;
  dateOfService:string | null;
  connectedToDcu:boolean | null;
  isNetMeter:boolean | null;

}
export interface ValidateDtrMeterData {
  valid:boolean;
  meterExists?:boolean;
  reason?:string;

  meterLookupId?:number;
  meterSerialNumber?:string;
  organisationLookupId?:number;
  networkLookupId?:number;
  phase?:string;

  meterDetais?:MeterDetails;
}

export interface ValidateDtrMeterResponse {
  success:boolean;
  data:ValidateDtrMeterData;
}

export class ValidateDtrMeterMapper {
  static map(response: ValidateDtrMeterResponse): ValidateDtrMeterResponse {
    return response;
  }
}
