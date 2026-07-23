import type pg from "pg";
import type { APIRequestContext } from "@playwright/test";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { FeederProfileApi } from "../Api/feederprofile.api";
import { FeederElectricalParametersApi } from "../Api/feeder-electrical-parameters.api";
import { feederProfileData } from "../Data/feederprofile.data";
import { feederElectricalParametersData } from "../Data/feeder-electrical-parameters.data";
import { FeederProfileMapper } from "../Mapper/feederprofile.mapper";
import { FeederElectricalParametersMapper } from "../Mapper/feeder-electrical-parameters.mapper";
import {
  countChildDtrsUnderFeeder,
  getFeederByCode,
  getFeederMeterBySerial,
} from "../Db/feeder.db";
import {
  compareFeederMeterExists,
  compareFeederProfileToDb,
} from "../Db/feeder-db-compare";
import {
  FeederDbValidator,
  logFeederDataQualityFindings,
} from "../Db/feeder-db.validator";

function resolveFeederCode(fallback: string): string {
  return process.env.FEEDER_CODE?.trim() || fallback;
}

/**
 * Part 4 harness — feeder identity + electrical meter spot-checks.
 */
export async function runFeederDbCoverage(
  authenticatedApi: APIRequestContext,
  db: pg.Pool,
): Promise<void> {
  const validation = new ValidationEngine();
  const code = resolveFeederCode(feederProfileData.feederCode);

  const profileBody = await new FeederProfileApi(
    authenticatedApi,
  ).getFeederProfile(code);
  const profile = FeederProfileMapper.map(profileBody.responseBody);
  await logFeederDataQualityFindings(
    "profile",
    profile as unknown as Record<string, unknown>,
  );

  const dbFeeder = await getFeederByCode(db, code);
  validation.execute("Feeder profile vs L_Network_Lookup", () => {
    compareFeederProfileToDb({
      api: {
        feederCode: profile.feederCode,
        feederName: profile.feederName,
        status: profile.status,
      },
      dbRow: dbFeeder,
      lookupKey: code,
    });
  });

  if (dbFeeder) {
    const dtrCount = await countChildDtrsUnderFeeder(
      db,
      dbFeeder.networkLookupTblRefId,
    );
    validation.execute("Feeder child DTR universe is non-negative", () => {
      if (dtrCount < 0) {
        throw new Error(`child DTR count negative: ${dtrCount}`);
      }
      FeederDbValidator.assertApiLteDb("profile spot-check", 1, dtrCount + 1);
    });
  }

  const electricalBody = await new FeederElectricalParametersApi(
    authenticatedApi,
  ).getElectricalParameters(
    resolveFeederCode(feederElectricalParametersData.feederCode),
  );
  const electrical = FeederElectricalParametersMapper.map(
    electricalBody.responseBody,
  );
  await logFeederDataQualityFindings(
    "electrical",
    electricalBody.responseBody.data as unknown as Record<string, unknown>,
  );

  if (electrical.meterSerialNumber?.trim()) {
    const meterRow = await getFeederMeterBySerial(
      db,
      electrical.meterSerialNumber,
    );
    validation.execute("Electrical meter serial exists in L_Meter_Lookup", () => {
      compareFeederMeterExists({
        apiSerial: electrical.meterSerialNumber,
        dbRow: meterRow,
      });
    });
  }

  validation.printSummary("Feeder DB Coverage", 0);
}
