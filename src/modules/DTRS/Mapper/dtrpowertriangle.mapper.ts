import { deriveReactivePower } from "../utils/dtr-backend.util";

export type DtrPowerTriangleScenario =
  | "dpt_by_code_primary"
  | "dpt_by_code_alt"
  | "dpt_ignore_unknown_query"
  | "contract_all_zero_degraded"
  | "contract_all_null_backend"
  | "contract_sp_instantaneous"
  | "contract_tp_instantaneous"
  | "contract_reactive_from_pf"
  | "contract_reactive_from_triangle"
  | "contract_meter_data_unavailable"
  | "dtr_not_found"
  | "empty_dtr_code";

export interface PowerTriangleData {
  activePowerKw: number | null;
  reactivePowerKvar: number | null;
  apparentPowerKva: number | null;
  powerFactor: number | null;
}

export interface DtrPowerTriangleResponse {
  success: boolean;
  data?: PowerTriangleData | null;
}

export interface DtrPowerTriangleErrorResponse {
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

export interface MappedDtrPowerTriangle {
  success: boolean;
  activePowerKw: number | null;
  reactivePowerKvar: number | null;
  apparentPowerKva: number | null;
  powerFactor: number | null;
}

const EMPTY_POWER_TRIANGLE: PowerTriangleData = {
  activePowerKw: null,
  reactivePowerKvar: null,
  apparentPowerKva: null,
  powerFactor: null,
};

function toNumber(v: unknown): number | null {
  if (v == null) return null;
  const n = parseFloat(String(v));
  return Number.isNaN(n) ? null : n;
}

export class DtrPowerTriangleMapper {
  static map(response: DtrPowerTriangleResponse): MappedDtrPowerTriangle {
    const data = response.data ?? EMPTY_POWER_TRIANGLE;

    const activePowerKw = toNumber(data.activePowerKw);
    const apparentPowerKva = toNumber(data.apparentPowerKva);
    const powerFactor = toNumber(data.powerFactor);
    const reactiveFromApi = toNumber(data.reactivePowerKvar);
    const reactivePowerKvar =
      reactiveFromApi ??
      deriveReactivePower(activePowerKw, apparentPowerKva, powerFactor);

    return {
      success: response.success,
      activePowerKw,
      reactivePowerKvar,
      apparentPowerKva,
      powerFactor,
    };
  }
}
