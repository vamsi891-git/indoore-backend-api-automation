export interface PowerTriangleData {
    activeEnergyKWh: number | null;
    reactiveEnergyKvarh: number | null;
    apparentEnergyKVAh: number | null;
    powerFactor: number | null;
}
export interface DtrPowerTriangleResponse {
    success: boolean;
    data: PowerTriangleData;
}
export class DtrPowerTriangleMapper {
    static map(response: DtrPowerTriangleResponse) {
        return {
            activeEnergyKWh:response.data.activeEnergyKWh,
            reactiveEnergyKvarh:response.data.reactiveEnergyKvarh,
            apparentEnergyKVAh:response.data.apparentEnergyKVAh,
            powerFactor:response.data.powerFactor
        };
    }
}