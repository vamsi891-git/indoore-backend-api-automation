export interface PhaseData {
    voltage: number | null;
    voltageUnit: string;
    current: number | null;
    currentUnit: string;
}

export interface FeederElectricalParametersResponse {
    success: boolean;
    data: {
        lastCommunication: string | null;
        meterSerialNumber: string | null;

        "R-Phase": PhaseData;
        "Y-Phase": PhaseData;
        "B-Phase": PhaseData;
    };
}

export class FeederElectricalParametersMapper {

    static map(
        response: FeederElectricalParametersResponse
    ) {

        return {
            lastCommunication:
                response.data.lastCommunication,

            meterSerialNumber:
                response.data.meterSerialNumber,

            rPhase:
                response.data["R-Phase"],

            yPhase:
                response.data["Y-Phase"],

            bPhase:
                response.data["B-Phase"]
        };
    }
}