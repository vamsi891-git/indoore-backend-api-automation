/** Mirrors backend DTR repository helpers (gauge, triangle, statistics fallbacks). */

export const EM_DASH = "—";

export function istCalendarYear(): number {
    const y = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
    });
    const n = parseInt(y, 10);
    return Number.isFinite(n) ? n : new Date().getFullYear();
}

export function istCalendarMonth(): number {
    const m = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        month: "numeric",
    });
    const n = parseInt(m, 10);
    return Number.isFinite(n) ? n : new Date().getMonth() + 1;
}

/** Mirrors backend `gaugePercent()`. */
export function gaugePercent(
    value: number | null,
    capacity: number | null,
): number {
    const v = value != null && Number.isFinite(value) ? Math.max(0, value) : 0;
    if (capacity == null || !Number.isFinite(capacity) || capacity <= 0) {
        return 0;
    }
    return Math.min(100, Math.round((100 * v) / capacity));
}

/** Mirrors backend `roundGauge()`. */
export function roundGauge(n: number | null | undefined): number {
    if (n == null || !Number.isFinite(n)) return 0;
    return Math.round(n * 100) / 100;
}

function normalizePowerFactor(pf: number | null): number | null {
    if (pf == null || !Number.isFinite(pf)) return null;
    const abs = Math.abs(pf);
    return abs <= 1 ? abs : null;
}

/** Mirrors backend `deriveReactivePower()`. */
export function deriveReactivePower(
    activePower: number | null,
    apparentPower: number | null,
    powerFactor: number | null = null,
): number | null {
    const pf = normalizePowerFactor(powerFactor);
    if (apparentPower != null && pf != null) {
        const q = Math.abs(apparentPower) * Math.sqrt(Math.max(0, 1 - pf * pf));
        return Math.round(q * 100) / 100;
    }
    if (activePower == null || apparentPower == null) return null;
    if (apparentPower < activePower) return null;
    const reactive = Math.sqrt(
        apparentPower * apparentPower - activePower * activePower,
    );
    return Math.round(reactive * 100) / 100;
}

/** Mirrors backend `normalizeEnergyDelta()`. */
export function normalizeEnergyDelta(delta: number | null): number | null {
    if (delta == null || !Number.isFinite(delta) || delta < 0) return null;
    return Math.round(delta * 100) / 100;
}

/** Mirrors backend `derivePowerFactorFromEnergy()`. */
export function derivePowerFactorFromEnergy(
    activeEnergyKwh: number | null,
    apparentEnergyKvah: number | null,
): number | null {
    if (
        activeEnergyKwh == null ||
        apparentEnergyKvah == null ||
        apparentEnergyKvah <= 0
    ) {
        return null;
    }
    const pf = Math.abs(activeEnergyKwh) / Math.abs(apparentEnergyKvah);
    return pf <= 1 ? Math.round(pf * 100) / 100 : null;
}

/** Mirrors backend `deriveReactiveEnergyKvarh()`. */
export function deriveReactiveEnergyKvarh(
    activeEnergyKWh: number | null,
    apparentEnergyKVAh: number | null,
): number | null {
    if (activeEnergyKWh == null || apparentEnergyKVAh == null) return null;
    if (
        activeEnergyKWh <= 0 ||
        apparentEnergyKVAh <= 0 ||
        apparentEnergyKVAh < activeEnergyKWh
    ) {
        return null;
    }
    const reactive = Math.sqrt(
        apparentEnergyKVAh * apparentEnergyKVAh -
            activeEnergyKWh * activeEnergyKWh,
    );
    return Math.round(reactive * 100) / 100;
}

/**
 * Mirrors backend `formatPowerOnMinutesForCard` outcome:
 * empty/invalid reads → `00:00:00`, never em dash on the card.
 */
export function normalizePowerOnCardValue(value: string): string {
    if (!value || value === EM_DASH) return "00:00:00";
    return /^\d{2}:\d{2}:\d{2}$/.test(value) ? value : "00:00:00";
}

/**
 * Normalizes statistic card values to match `buildStatisticCards` fallbacks
 * when the API returns em-dash placeholders on timeout/degraded paths.
 */
export function normalizeStatisticCardValue(
    title: string,
    value: string,
): string {
    if (value !== EM_DASH) return value;

    switch (title) {
        case "Power On":
        case "Power Off":
            return "00:00:00";
        case "Total KW":
        case "Total KWh":
        case "Total KVAh":
            return "0.00";
        case "Total KVA":
            return "0";
        case "Unbalanced LT Feeders":
            return "0";
        case "Status":
            return "Under Load";
        default:
            return value;
    }
}

export function normalizeStatisticSubtitle(
    title: string,
    subtitle: string | null,
): string | null {
    if (subtitle !== EM_DASH) return subtitle;
    if (title === "Status") return "0";
    return subtitle;
}
