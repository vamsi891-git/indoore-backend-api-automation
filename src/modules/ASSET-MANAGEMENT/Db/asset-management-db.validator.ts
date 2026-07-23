import {
  attachDataQualityReport,
  type DataQualityReport,
  type DataQualityWarning,
} from "../../../core/utils/data-quality-logger";
import type { DtrDetailData } from "../Mapper/dtrId.mapper";
import type { NetworkNode } from "../Mapper/networkhierarchy.mapper";
import type { OrganisationNode } from "../Mapper/organizationhierarchy.mapper";

function resolveEmptyFieldThresholdPct(): number {
  const raw = Number(process.env.ASSET_EMPTY_FIELD_THRESHOLD_PCT ?? "25");
  return Number.isFinite(raw) && raw >= 0 ? raw : 25;
}

function isBlank(value: string | null | undefined): boolean {
  return value == null || String(value).trim() === "";
}

/**
 * Soft (non-failing) data-quality checks for Asset Management responses.
 * Suspicious / missing fields are reported to Allure — they do not fail the suite.
 */
export function collectDtrDetailDataQualityFindings(
  data: DtrDetailData,
): DataQualityReport {
  const warnings: DataQualityWarning[] = [];
  let emptyConsumerName = 0;
  let emptyAddress = 0;
  let emptyAccountId = 0;
  let emptyRrNumber = 0;
  let emptyMeterSerial = 0;
  let consumersWithoutMeters = 0;
  let metersMissingCoords = 0;

  for (const consumer of data.consumers) {
    const rowId = String(consumer.consumerTblRefId);

    if (isBlank(consumer.consumerName)) {
      emptyConsumerName += 1;
      warnings.push({
        code: "EMPTY_CONSUMER_NAME",
        message: "consumerName is empty",
        rowId,
        field: "consumerName",
        actual: consumer.consumerName,
      });
    }
    if (isBlank(consumer.consumerAddress)) {
      emptyAddress += 1;
    }
    if (isBlank(consumer.accountId)) {
      emptyAccountId += 1;
    }
    if (isBlank(consumer.rrNumber)) {
      emptyRrNumber += 1;
    }
    if (!consumer.meters.length) {
      consumersWithoutMeters += 1;
      warnings.push({
        code: "CONSUMER_WITHOUT_METERS",
        message: "Consumer has an empty meters array",
        rowId,
        field: "meters",
        actual: 0,
        expected: "> 0",
      });
    }

    for (const meter of consumer.meters) {
      if (isBlank(meter.meterSerialNumber)) {
        emptyMeterSerial += 1;
      }
      if (meter.latitude == null || meter.longitude == null) {
        metersMissingCoords += 1;
      }
    }
  }

  if (data.consumers.length > 0 && data.dtrMeter == null) {
    warnings.push({
      code: "MISSING_DTR_METER",
      message: "DTR has consumers but dtrMeter is null",
      field: "dtrMeter",
      actual: null,
    });
  }

  const expectedPages =
    data.total === 0 ? 0 : Math.ceil(data.total / data.limit);
  if (data.totalPages !== expectedPages) {
    warnings.push({
      code: "PAGINATION_MATH",
      message: `totalPages (${data.totalPages}) ≠ ceil(total/limit) (${expectedPages})`,
      field: "totalPages",
      actual: data.totalPages,
      expected: expectedPages,
    });
  }

  const rowCount = data.consumers.length || 1;
  const thresholdPct = resolveEmptyFieldThresholdPct();
  const pct = (count: number) => (count / rowCount) * 100;

  const thresholdChecks: Array<{
    code: string;
    field: string;
    count: number;
  }> = [
    {
      code: "EMPTY_CONSUMER_NAME_THRESHOLD",
      field: "consumerName",
      count: emptyConsumerName,
    },
    {
      code: "EMPTY_ADDRESS_THRESHOLD",
      field: "consumerAddress",
      count: emptyAddress,
    },
    {
      code: "EMPTY_ACCOUNT_ID_THRESHOLD",
      field: "accountId",
      count: emptyAccountId,
    },
    {
      code: "EMPTY_RR_NUMBER_THRESHOLD",
      field: "rrNumber",
      count: emptyRrNumber,
    },
    {
      code: "EMPTY_METER_SERIAL_THRESHOLD",
      field: "meterSerialNumber",
      count: emptyMeterSerial,
    },
  ];

  for (const check of thresholdChecks) {
    if (pct(check.count) > thresholdPct) {
      warnings.push({
        code: check.code,
        message: `${pct(check.count).toFixed(1)}% of page rows have empty ${check.field} (threshold ${thresholdPct}%)`,
        field: check.field,
        actual: check.count,
        expected: `<= ${thresholdPct}%`,
      });
    }
  }

  return {
    warnings,
    counts: {
      consumers: data.consumers.length,
      emptyConsumerName,
      emptyAddress,
      emptyAccountId,
      emptyRrNumber,
      emptyMeterSerial,
      consumersWithoutMeters,
      metersMissingCoords,
      total: data.total,
      totalPages: data.totalPages,
    },
  };
}

export function collectNetworkHierarchyDataQualityFindings(
  nodes: NetworkNode[],
): DataQualityReport {
  const warnings: DataQualityWarning[] = [];
  let emptyNetworkCode = 0;
  let emptyNetworkName = 0;
  let dtrsWithZeroConsumers = 0;
  let nodeCount = 0;
  let dtrCount = 0;

  const walk = (items: NetworkNode[]) => {
    for (const node of items) {
      nodeCount += 1;
      if (isBlank(node.networkCode)) {
        emptyNetworkCode += 1;
        warnings.push({
          code: "EMPTY_NETWORK_CODE",
          message: "networkCode is empty",
          rowId: String(node.networkLookupId),
          field: "networkCode",
          actual: node.networkCode,
        });
      }
      if (isBlank(node.networkName)) {
        emptyNetworkName += 1;
        warnings.push({
          code: "EMPTY_NETWORK_NAME",
          message: "networkName is empty",
          rowId: String(node.networkLookupId),
          field: "networkName",
          actual: node.networkName,
        });
      }
      for (const dtr of node.dtrs) {
        dtrCount += 1;
        if (dtr.consumerCount === 0) {
          dtrsWithZeroConsumers += 1;
        }
        if (isBlank(dtr.dtrName)) {
          warnings.push({
            code: "EMPTY_DTR_NAME",
            message: "dtrName is empty on hierarchy DTR node",
            rowId: String(dtr.networkLookupId),
            field: "dtrName",
            actual: dtr.dtrName,
          });
        }
      }
      walk(node.children);
    }
  };
  walk(nodes);

  return {
    warnings,
    counts: {
      nodes: nodeCount,
      dtrs: dtrCount,
      emptyNetworkCode,
      emptyNetworkName,
      dtrsWithZeroConsumers,
    },
  };
}

export function collectOrganisationHierarchyDataQualityFindings(
  nodes: OrganisationNode[],
): DataQualityReport {
  const warnings: DataQualityWarning[] = [];
  let emptyOfficeCode = 0;
  let emptyOfficeName = 0;
  let nodeCount = 0;
  let dtrCount = 0;

  const walk = (items: OrganisationNode[]) => {
    for (const node of items) {
      nodeCount += 1;
      if (isBlank(node.officeCode)) {
        emptyOfficeCode += 1;
        warnings.push({
          code: "EMPTY_OFFICE_CODE",
          message: "officeCode is empty",
          rowId: String(node.organisationLookupId),
          field: "officeCode",
          actual: node.officeCode,
        });
      }
      if (isBlank(node.officeName)) {
        emptyOfficeName += 1;
        warnings.push({
          code: "EMPTY_OFFICE_NAME",
          message: "officeName is empty",
          rowId: String(node.organisationLookupId),
          field: "officeName",
          actual: node.officeName,
        });
      }
      dtrCount += node.dtrs?.length ?? 0;
      walk(node.children ?? []);
    }
  };
  walk(nodes);

  return {
    warnings,
    counts: {
      nodes: nodeCount,
      dtrs: dtrCount,
      emptyOfficeCode,
      emptyOfficeName,
    },
  };
}

export async function logDtrDetailDataQualityFindings(
  data: DtrDetailData,
): Promise<DataQualityReport> {
  const report = collectDtrDetailDataQualityFindings(data);
  await attachDataQualityReport(report, "DTR detail data quality soft checks");
  return report;
}

export async function logNetworkHierarchyDataQualityFindings(
  nodes: NetworkNode[],
): Promise<DataQualityReport> {
  const report = collectNetworkHierarchyDataQualityFindings(nodes);
  await attachDataQualityReport(
    report,
    "Network hierarchy data quality soft checks",
  );
  return report;
}

export async function logOrganisationHierarchyDataQualityFindings(
  nodes: OrganisationNode[],
): Promise<DataQualityReport> {
  const report = collectOrganisationHierarchyDataQualityFindings(nodes);
  await attachDataQualityReport(
    report,
    "Organisation hierarchy data quality soft checks",
  );
  return report;
}

/**
 * Hard validator for DB coverage — throws with detailed diagnostics.
 * Prefer compare helpers for field tables; this wraps business invariants.
 */
export class AssetManagementDbValidator {
  static assertApiTotalWithinDbUniverse(
    label: string,
    apiValue: number,
    dbValue: number,
  ): void {
    if (apiValue > dbValue) {
      throw new Error(
        [
          `${label}: API exceeds unscoped DB universe`,
          `  API=${apiValue}`,
          `  DB=${dbValue}`,
          "  Diagnostics: check JWT data-scope filters or stale hierarchy caches.",
        ].join("\n"),
      );
    }
  }

  static assertSpotConsumerPresent(
    dtrNetworkLookupId: number,
    consumerTblRefId: number,
    found: boolean,
  ): void {
    if (!found) {
      throw new Error(
        [
          "Spot-check consumer not found in DB",
          `  dtrNetworkLookupId=${dtrNetworkLookupId}`,
          `  consumerTblRefId=${consumerTblRefId}`,
        ].join("\n"),
      );
    }
  }
}
