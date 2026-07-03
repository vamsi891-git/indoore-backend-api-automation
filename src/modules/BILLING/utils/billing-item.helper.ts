import type { BillingItem } from "../schemas/billing.schemas";

/** Live API uses meterTimestamp for billing period; legacy contract used billingDate. */
export function resolveBillingDate(item: BillingItem): string | undefined {
    return item.billingDate ?? item.meterTimestamp;
}

export function normalizeBillingItem(row: BillingItem): BillingItem {
    const billingDate = resolveBillingDate(row);
    if (billingDate && billingDate !== row.billingDate) {
        return { ...row, billingDate };
    }
    return row;
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
