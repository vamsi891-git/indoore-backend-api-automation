export interface MeterSampleRegisterValue {
  registerObisCode: string;
  formattedRegisterObisCode: string;
  formattedValue: string;
  attributeId: number;
  unit: number;
  scalar: number;
  registerValue: string;
  description: string | null;
}

export interface MeterSampleRow {
  meterSampleId: number;
  sequenceNumber: number;
  deviceId: string;
  nodeId: string;
  profileObisCode: string;
  formattedProfileObisCode: string;
  registerValues: MeterSampleRegisterValue[];
  sampleTime: string;
  createTime: string;
}

export interface MeterSamplesResponse {
  success: boolean;
  data?: MeterSampleRow[];
  error?: { code?: string; message?: string };
}

export interface MappedMeterSamplesData {
  samples: MeterSampleRow[];
}

export class CommandsMeterSamplesMapper {
  static mapResponse(body: MeterSamplesResponse): MappedMeterSamplesData {
    if (!body.success || !body.data) {
      throw new Error("Cannot map unsuccessful meter-samples response");
    }

    return {
      samples: body.data.map((sample) => ({
        meterSampleId: sample.meterSampleId,
        sequenceNumber: sample.sequenceNumber,
        deviceId: sample.deviceId.trim(),
        nodeId: sample.nodeId.trim(),
        profileObisCode: sample.profileObisCode.trim(),
        formattedProfileObisCode: sample.formattedProfileObisCode.trim(),
        registerValues: sample.registerValues.map((register) => ({
          registerObisCode: register.registerObisCode.trim(),
          formattedRegisterObisCode: register.formattedRegisterObisCode.trim(),
          formattedValue: register.formattedValue?.trim() ?? "",
          attributeId: register.attributeId,
          unit: register.unit,
          scalar: register.scalar,
          registerValue: register.registerValue.trim(),
          description: register.description?.trim() ?? null,
        })),
        sampleTime: sample.sampleTime.trim(),
        createTime: sample.createTime.trim(),
      })),
    };
  }
}
