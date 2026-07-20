export type ConsumerProfileScenario =
  | "profile_found"
  | "profile_no_query"
  | "profile_by_ivrs"
  | "profile_by_meter"
  | "consumer_not_found"
  | "meter_not_found";

export interface ConsumerProfileErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: {
      formErrors?: string[];
      fieldErrors?: Record<string, string[]>;
    };
  };
}

export interface ConsumerConnectionDetails {
  division: string | null;
  zone: string | null;
  subStation: string | null;
  feeder: string | null;
  dtr: string | null;
  ivrsNo: string | null;
  sanctionedLoad: string | null;
  sanctionedLoadKw: number | null;
}

export interface ConsumerConnectionMeterDetails {
  mainSubMeter: string | null;
  meterSerialNumber: string | null;
  servicePointId: string | null;
  meterType: string | null;
  meterPhase: string | null;
}

export interface ConsumerLatestActivity {
  title: string;
  timestamp: string;
}

export interface ConsumerProfileData {
  consumerName: string;
  consumerEmail: string | null;
  consumerNumber: string | null;
  uniqueId: string | null;
  meterSerialNumber: string | null;
  permanentAddress: string | null;
  billingAddress: string | null;
  occupancyStatus?: string | null;
  connectionDetails: ConsumerConnectionDetails;
  connectionMeterDetails: ConsumerConnectionMeterDetails;
  latestActivities: ConsumerLatestActivity[];
}

export interface ConsumerProfileResponse {
  success: boolean;
  data?: ConsumerProfileData;
  error?: ConsumerProfileErrorResponse["error"];
}

export class ConsumerProfileMapper {
  static map(response: ConsumerProfileResponse): ConsumerProfileData & {
    success: boolean;
  } {
    const data = response.data ?? ({} as ConsumerProfileData);
    const connectionDetails =
      data.connectionDetails ?? ({} as ConsumerConnectionDetails);
    const connectionMeterDetails =
      data.connectionMeterDetails ?? ({} as ConsumerConnectionMeterDetails);

    return {
      success: response.success,
      consumerName: data.consumerName ?? "",
      consumerEmail: data.consumerEmail ?? null,
      consumerNumber: data.consumerNumber ?? null,
      uniqueId: data.uniqueId ?? null,
      meterSerialNumber: data.meterSerialNumber ?? null,
      permanentAddress: data.permanentAddress ?? null,
      billingAddress: data.billingAddress ?? null,
      connectionDetails: {
        division: connectionDetails.division ?? null,
        zone: connectionDetails.zone ?? null,
        subStation: connectionDetails.subStation ?? null,
        feeder: connectionDetails.feeder ?? null,
        dtr: connectionDetails.dtr ?? null,
        ivrsNo: connectionDetails.ivrsNo ?? null,
        sanctionedLoad: connectionDetails.sanctionedLoad ?? null,
        sanctionedLoadKw:
          connectionDetails.sanctionedLoadKw == null
            ? null
            : Number(connectionDetails.sanctionedLoadKw),
      },
      connectionMeterDetails: {
        mainSubMeter: connectionMeterDetails.mainSubMeter ?? null,
        meterSerialNumber: connectionMeterDetails.meterSerialNumber ?? null,
        servicePointId: connectionMeterDetails.servicePointId ?? null,
        meterType: connectionMeterDetails.meterType ?? null,
        meterPhase: connectionMeterDetails.meterPhase ?? null,
      },
      latestActivities: Array.isArray(data.latestActivities)
        ? data.latestActivities
        : [],
    };
  }
}
