import type { BillingItem } from "../schemas/billing.schemas";

/** Live API uses meterTimestamp for billing period; legacy contract used billingDate. */
export function resolveBillingDate(item: BillingItem): string | undefined {
    return item.billingDate ?? item.meterTimestamp;
}

/** Coerce live decimal strings ("1.8420") to number|null for business-rule validators. */
export function coerceBillingNumeric(
    value: string | number | null | undefined,
): number | null {
    if (value == null) {
        return null;
    }
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : null;
    }
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeBillingItem(row: BillingItem): BillingItem {
    const billingDate = resolveBillingDate(row);
    const sanctionedLoadKw = coerceBillingNumeric(row.sanctionedLoadKw as string | number | null);
    const mdKw = coerceBillingNumeric(row.mdKw as string | number | null);
    const mdKva = coerceBillingNumeric(row.mdKva as string | number | null);

    return {
        ...row,
        ...(billingDate && billingDate !== row.billingDate
            ? { billingDate }
            : {}),
        sanctionedLoadKw,
        mdKw,
        mdKva,
    };
}

export function sumBillingTiers(
    item: BillingItem,
    prefix: "kwhT" | "kvahT",
    maxTier = 8,
): number {
    let total = 0;
    for (let tier = 1; tier <= maxTier; tier++) {
        const value = item[`${prefix}${tier}` as keyof BillingItem];
        if (typeof value === "number") {
            total += value;
        }
    }
    return total;
}
