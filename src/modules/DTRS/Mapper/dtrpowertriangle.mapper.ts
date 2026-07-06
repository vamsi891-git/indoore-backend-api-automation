import { deriveReactiveEnergyKvarh } from "../utils/dtr-backend.util";

export interface PowerTriangleData {
    activeEnergyKWh: number | null;
    reactiveEnergyKvarh: number | null;
    apparentEnergyKVAh: number | null;
    powerFactor: number | null;
}
export interface DtrPowerTriangleResponse {
    success: boolean;
    data?: PowerTriangleData | null;
}

const EMPTY_POWER_TRIANGLE: PowerTriangleData = {
    activeEnergyKWh: null,
    reactiveEnergyKvarh: null,
    apparentEnergyKVAh: null,
    powerFactor: null,
};

function toNumber(v: unknown): number | null {
    if (v == null) return null;
    const n = parseFloat(String(v));
    return Number.isNaN(n) ? null : n;
}

export class DtrPowerTriangleMapper {
    static map(response: DtrPowerTriangleResponse): PowerTriangleData {
        const data = response.data ?? EMPTY_POWER_TRIANGLE;

        const activeEnergyKWh = toNumber(data.activeEnergyKWh);
        const apparentEnergyKVAh = toNumber(data.apparentEnergyKVAh);
        const powerFactor = toNumber(data.powerFactor);
        const reactiveFromApi = toNumber(data.reactiveEnergyKvarh);
        const reactiveEnergyKvarh =
            reactiveFromApi ??
            deriveReactiveEnergyKvarh(activeEnergyKWh, apparentEnergyKVAh);

        return {
            activeEnergyKWh,
            reactiveEnergyKvarh,
            apparentEnergyKVAh,
            powerFactor,
        };
    }
}
