import { expect } from "@playwright/test";
import { test } from "../../../fixtures/observability.fixture";
import { compareApiToDb } from "../../../core/db/db-compare.engine";
import { isDbConfigured } from "../../../core/db/postgres.client";
import { UTILS_LOOKUP_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { applyAllureTestCaseId } from "../../../core/utils/allure-test-case.helper";
import { getLookupResponseData } from "../utils/lookup-spec.harness";
import { ConnectionStatusApi } from "../Api/connectionstatus.api";
import { ConsumerCategoryApi } from "../Api/consumercategory.api";
import { PaymentContractApi } from "../Api/paymentcontract.api";
import { DeviceManufacturerApi } from "../Api/devicemanufacturer.api";
import { EventApi } from "../Api/eventapi";
import { EventClassificationApi } from "../Api/eventclassification.api";
import { EventPriorityApi } from "../Api/eventpriority.api";
import { MeterPhaseApi } from "../Api/meterphase.api";
import { OrganisationApi } from "../Api/organizationhierarchy.api";
import { NetworkApi } from "../Api/networkhierarchy.api";
import { ConnectionStatusMapper } from "../Mapper/connectionstatus.mapper";
import { ConsumerCategoryMapper } from "../Mapper/consumercategory.mapper";
import { PaymentContractMapper } from "../Mapper/paymentcontract.mapper";
import { DeviceManufacturerMapper } from "../Mapper/devicemanufacturer.mapper";
import { EventMapper } from "../Mapper/event.mapper";
import { EventClassificationMapper } from "../Mapper/eventclassification.mapper";
import { EventPriorityMapper } from "../Mapper/eventpriority.mapper";
import { MeterPhaseMapper } from "../Mapper/meterphase.mapper";
import { OrganisationMapper } from "../Mapper/organizationhierarchy.mapper";
import { NetworkMapper } from "../Mapper/networkhierarchy.mapper";
import {
  countConnectionStatuses,
  countConsumerCategories,
  countDeviceManufacturers,
  countEventClassifications,
  countEventPriorities,
  countEvents,
  countMeterPhases,
  countNetworkHierarchies,
  countOrganisationHierarchies,
  countPaymentContracts,
  eventPriorityExists,
  getConnectionStatusById,
  getConsumerCategoryById,
  getDeviceManufacturerById,
  getEventById,
  getEventClassificationById,
  getMeterPhaseById,
  getNetworkHierarchyById,
  getOrganisationHierarchyById,
  getPaymentContractById,
  isUtilsLookupDbSqlReady,
  resolveUtilsLookupDbSampleSize,
  sampleIds,
} from "../Db/lookup-catalog.db";

/**
 * DB cross-validation for UTILS-LOOKUP catalogs / hierarchies.
 * SQL mirrors backend UtilsRepository list* queries.
 *
 * Enable after confirming schema:
 *   UTILS_LOOKUP_DB_SQL_READY=true
 *
 * Scoped searches (consumers / networks / organisations) are deferred —
 * they require JWT data-scope SQL that is not portable as static COUNT.
 */
test.describe("UTILS-LOOKUP — Catalog DB cross-validation", () => {
  test.describe.configure({ retries: 1, mode: "serial" });
  test.setTimeout(UTILS_LOOKUP_TEST_TIMEOUT_MS);

  test.beforeEach(() => {
    test.skip(!isDbConfigured(), "DB credentials not configured");
    test.skip(
      !isUtilsLookupDbSqlReady(),
      "Set UTILS_LOOKUP_DB_SQL_READY=true after confirming Db/lookup-catalog-sql.ts against live schema",
    );
  });

  test(
    "IND-UL-DB-001 — Connection statuses COUNT + sample rows match DB",
    { tag: ["@utils-lookup", "@connection-status", "@db"] },
    async ({ authenticatedApi, db, obs }) => {
      await applyAllureTestCaseId("IND-UL-DB-001");
      const { responseBody } = await new ConnectionStatusApi(
        authenticatedApi,
      ).getConnectionStatuses();
      const mapped = ConnectionStatusMapper.mapData(
        getLookupResponseData(responseBody),
      );
      const dbCount = await countConnectionStatuses(db);
      compareApiToDb(
        [{ label: "items.length", apiValue: mapped.items.length, dbValue: dbCount }],
        "DB vs API — connection statuses count",
        { ...obs, table: 'public."M_Connection_Status"', mode: "exact" },
      );

      for (const id of sampleIds(
        mapped.items.map((item) => item.id),
        resolveUtilsLookupDbSampleSize(),
      )) {
        const apiRow = mapped.items.find((item) => item.id === id)!;
        const dbRow = await getConnectionStatusById(db, id);
        expect(dbRow, `DB missing connection status id=${id}`).toBeTruthy();
        compareApiToDb(
          [
            { label: "id", apiValue: apiRow.id, dbValue: dbRow!.id },
            { label: "name", apiValue: apiRow.name, dbValue: dbRow!.name },
            {
              label: "shortName",
              apiValue: apiRow.shortName,
              dbValue: dbRow!.shortName,
              optional: true,
            },
          ],
          `DB vs API — connection status id=${id}`,
          { ...obs, table: 'public."M_Connection_Status"', mode: "exact" },
        );
      }
    },
  );

  test(
    "IND-UL-DB-002 — Consumer categories COUNT + sample rows match DB",
    { tag: ["@utils-lookup", "@consumer-category", "@db"] },
    async ({ authenticatedApi, db, obs }) => {
      await applyAllureTestCaseId("IND-UL-DB-002");
      const { responseBody } = await new ConsumerCategoryApi(
        authenticatedApi,
      ).getConsumerCategories();
      const mapped = ConsumerCategoryMapper.mapData(
        getLookupResponseData(responseBody),
      );
      const dbCount = await countConsumerCategories(db);
      compareApiToDb(
        [{ label: "items.length", apiValue: mapped.items.length, dbValue: dbCount }],
        "DB vs API — consumer categories count",
        { ...obs, table: 'public."M_Category"', mode: "exact" },
      );

      for (const id of sampleIds(
        mapped.items.map((item) => item.id),
        resolveUtilsLookupDbSampleSize(),
      )) {
        const apiRow = mapped.items.find((item) => item.id === id)!;
        const dbRow = await getConsumerCategoryById(db, id);
        expect(dbRow, `DB missing category id=${id}`).toBeTruthy();
        compareApiToDb(
          [
            { label: "id", apiValue: apiRow.id, dbValue: dbRow!.id },
            { label: "name", apiValue: apiRow.name, dbValue: dbRow!.name },
            {
              label: "shortName",
              apiValue: apiRow.shortName,
              dbValue: dbRow!.shortName,
            },
          ],
          `DB vs API — category id=${id}`,
          { ...obs, table: 'public."M_Category"', mode: "exact" },
        );
      }
    },
  );

  test(
    "IND-UL-DB-003 — Payment contracts COUNT + sample rows match DB",
    { tag: ["@utils-lookup", "@payment-contract", "@db"] },
    async ({ authenticatedApi, db, obs }) => {
      await applyAllureTestCaseId("IND-UL-DB-003");
      const { responseBody } = await new PaymentContractApi(
        authenticatedApi,
      ).getPaymentContracts();
      const mapped = PaymentContractMapper.mapData(
        getLookupResponseData(responseBody),
      );
      const dbCount = await countPaymentContracts(db);
      compareApiToDb(
        [{ label: "items.length", apiValue: mapped.items.length, dbValue: dbCount }],
        "DB vs API — payment contracts count",
        { ...obs, table: 'public."M_PaymentType_Contract"', mode: "exact" },
      );

      for (const id of sampleIds(
        mapped.items.map((item) => item.id),
        resolveUtilsLookupDbSampleSize(),
      )) {
        const apiRow = mapped.items.find((item) => item.id === id)!;
        const dbRow = await getPaymentContractById(db, id);
        expect(dbRow, `DB missing payment contract id=${id}`).toBeTruthy();
        compareApiToDb(
          [
            { label: "id", apiValue: apiRow.id, dbValue: dbRow!.id },
            { label: "name", apiValue: apiRow.name, dbValue: dbRow!.name },
            {
              label: "code",
              apiValue: apiRow.code,
              dbValue: dbRow!.code,
              optional: true,
            },
          ],
          `DB vs API — payment contract id=${id}`,
          { ...obs, table: 'public."M_PaymentType_Contract"', mode: "exact" },
        );
      }
    },
  );

  test(
    "IND-UL-DB-004 — Device manufacturers COUNT + sample rows match DB",
    { tag: ["@utils-lookup", "@device-manufacturer", "@db"] },
    async ({ authenticatedApi, db, obs }) => {
      await applyAllureTestCaseId("IND-UL-DB-004");
      const { responseBody } = await new DeviceManufacturerApi(
        authenticatedApi,
      ).getDeviceManufacturers();
      const mapped = DeviceManufacturerMapper.mapData(
        getLookupResponseData(responseBody),
      );
      const dbCount = await countDeviceManufacturers(db);
      compareApiToDb(
        [{ label: "items.length", apiValue: mapped.items.length, dbValue: dbCount }],
        "DB vs API — device manufacturers count",
        { ...obs, table: 'public."M_Device_Manufacturer"', mode: "exact" },
      );

      for (const id of sampleIds(
        mapped.items.map((item) => item.id),
        resolveUtilsLookupDbSampleSize(),
      )) {
        const apiRow = mapped.items.find((item) => item.id === id)!;
        const dbRow = await getDeviceManufacturerById(db, id);
        expect(dbRow, `DB missing manufacturer id=${id}`).toBeTruthy();
        compareApiToDb(
          [
            { label: "id", apiValue: apiRow.id, dbValue: dbRow!.id },
            { label: "name", apiValue: apiRow.name, dbValue: dbRow!.name },
            {
              label: "code",
              apiValue: apiRow.code,
              dbValue: dbRow!.code,
              optional: true,
            },
          ],
          `DB vs API — manufacturer id=${id}`,
          { ...obs, table: 'public."M_Device_Manufacturer"', mode: "exact" },
        );
      }
    },
  );

  test(
    "IND-UL-DB-005 — Events COUNT + sample rows match DB",
    { tag: ["@utils-lookup", "@events", "@db"] },
    async ({ authenticatedApi, db, obs }) => {
      await applyAllureTestCaseId("IND-UL-DB-005");
      const { responseBody } = await new EventApi(authenticatedApi).getEvents();
      const mapped = EventMapper.mapData(getLookupResponseData(responseBody));
      const dbCount = await countEvents(db);
      compareApiToDb(
        [{ label: "items.length", apiValue: mapped.items.length, dbValue: dbCount }],
        "DB vs API — events count",
        { ...obs, table: 'public."M_Event"', mode: "exact" },
      );

      for (const id of sampleIds(
        mapped.items.map((item) => item.id),
        resolveUtilsLookupDbSampleSize(),
      )) {
        const apiRow = mapped.items.find((item) => item.id === id)!;
        const dbRow = await getEventById(db, id);
        expect(dbRow, `DB missing event id=${id}`).toBeTruthy();
        compareApiToDb(
          [
            { label: "id", apiValue: apiRow.id, dbValue: dbRow!.id },
            { label: "name", apiValue: apiRow.name, dbValue: dbRow!.name },
            {
              label: "description",
              apiValue: apiRow.description,
              dbValue: dbRow!.description,
            },
            {
              label: "code",
              apiValue: apiRow.code,
              dbValue: dbRow!.code,
              optional: true,
            },
            {
              label: "eventReferenceTable",
              apiValue: apiRow.eventReferenceTable,
              dbValue: dbRow!.eventReferenceTable,
              optional: true,
            },
          ],
          `DB vs API — event id=${id}`,
          { ...obs, table: 'public."M_Event"', mode: "exact" },
        );
      }
    },
  );

  test(
    "IND-UL-DB-006 — Event classifications COUNT + sample rows match DB",
    { tag: ["@utils-lookup", "@event-classification", "@db"] },
    async ({ authenticatedApi, db, obs }) => {
      await applyAllureTestCaseId("IND-UL-DB-006");
      const { responseBody } = await new EventClassificationApi(
        authenticatedApi,
      ).getEventClassifications();
      const mapped = EventClassificationMapper.mapData(
        getLookupResponseData(responseBody),
      );
      const dbCount = await countEventClassifications(db);
      compareApiToDb(
        [{ label: "items.length", apiValue: mapped.items.length, dbValue: dbCount }],
        "DB vs API — event classifications count",
        { ...obs, table: 'public."M_EventClassification"', mode: "exact" },
      );

      for (const id of sampleIds(
        mapped.items.map((item) => item.EventClassificationTblRefId),
        resolveUtilsLookupDbSampleSize(),
      )) {
        const apiRow = mapped.items.find(
          (item) => item.EventClassificationTblRefId === id,
        )!;
        const dbRow = await getEventClassificationById(db, id);
        expect(dbRow, `DB missing event classification id=${id}`).toBeTruthy();
        compareApiToDb(
          [
            {
              label: "EventClassificationTblRefId",
              apiValue: apiRow.EventClassificationTblRefId,
              dbValue: dbRow!.EventClassificationTblRefId,
            },
            {
              label: "EventClassification_Name",
              apiValue: apiRow.EventClassification_Name,
              dbValue: dbRow!.EventClassification_Name,
            },
          ],
          `DB vs API — event classification id=${id}`,
          { ...obs, table: 'public."M_EventClassification"', mode: "exact" },
        );
      }
    },
  );

  test(
    "IND-UL-DB-007 — Event priorities COUNT + each priority exists in DB",
    { tag: ["@utils-lookup", "@event-priority", "@db"] },
    async ({ authenticatedApi, db, obs }) => {
      await applyAllureTestCaseId("IND-UL-DB-007");
      const { responseBody } = await new EventPriorityApi(
        authenticatedApi,
      ).getEventPriorities();
      const mapped = EventPriorityMapper.mapData(
        getLookupResponseData(responseBody),
      );
      const dbCount = await countEventPriorities(db);
      compareApiToDb(
        [{ label: "items.length", apiValue: mapped.items.length, dbValue: dbCount }],
        "DB vs API — event priorities count",
        { ...obs, table: 'public."M_Event".prioritytblrefID', mode: "exact" },
      );

      for (const id of sampleIds(
        mapped.items.map((item) => item.priorityTblRefId),
        resolveUtilsLookupDbSampleSize(),
      )) {
        const present = await eventPriorityExists(db, id);
        compareApiToDb(
          [{ label: "priorityTblRefId exists", apiValue: true, dbValue: present }],
          `DB vs API — event priority id=${id}`,
          { ...obs, table: 'public."M_Event"', mode: "exact" },
        );
      }
    },
  );

  test(
    "IND-UL-DB-008 — Meter phases COUNT + sample rows match DB",
    { tag: ["@utils-lookup", "@meter-phase", "@db"] },
    async ({ authenticatedApi, db, obs }) => {
      await applyAllureTestCaseId("IND-UL-DB-008");
      const { responseBody } = await new MeterPhaseApi(
        authenticatedApi,
      ).getMeterPhases();
      const mapped = MeterPhaseMapper.mapData(
        getLookupResponseData(responseBody),
      );
      const dbCount = await countMeterPhases(db);
      compareApiToDb(
        [{ label: "items.length", apiValue: mapped.items.length, dbValue: dbCount }],
        "DB vs API — meter phases count",
        { ...obs, table: 'public."M_ServicePoint_MeterPhase"', mode: "exact" },
      );

      for (const id of sampleIds(
        mapped.items.map((item) => item.id),
        resolveUtilsLookupDbSampleSize(),
      )) {
        const apiRow = mapped.items.find((item) => item.id === id)!;
        const dbRow = await getMeterPhaseById(db, id);
        expect(dbRow, `DB missing meter phase id=${id}`).toBeTruthy();
        compareApiToDb(
          [
            { label: "id", apiValue: apiRow.id, dbValue: dbRow!.id },
            { label: "name", apiValue: apiRow.name, dbValue: dbRow!.name },
          ],
          `DB vs API — meter phase id=${id}`,
          { ...obs, table: 'public."M_ServicePoint_MeterPhase"', mode: "exact" },
        );
      }
    },
  );

  test(
    "IND-UL-DB-009 — Organisation hierarchy COUNT + sample rows match DB",
    { tag: ["@utils-lookup", "@organisation-hierarchy", "@db"] },
    async ({ authenticatedApi, db, obs }) => {
      await applyAllureTestCaseId("IND-UL-DB-009");
      const { responseBody } = await new OrganisationApi(
        authenticatedApi,
      ).getOrganisationHierarchy();
      const mapped = OrganisationMapper.mapData(
        getLookupResponseData(responseBody),
      );
      const dbCount = await countOrganisationHierarchies(db);
      compareApiToDb(
        [{ label: "items.length", apiValue: mapped.items.length, dbValue: dbCount }],
        "DB vs API — organisation hierarchy count",
        { ...obs, table: 'public."M_Organisation_Hierarchy"', mode: "exact" },
      );

      for (const id of sampleIds(
        mapped.items.map((item) => item.id),
        resolveUtilsLookupDbSampleSize(),
      )) {
        const apiRow = mapped.items.find((item) => item.id === id)!;
        const dbRow = await getOrganisationHierarchyById(db, id);
        expect(dbRow, `DB missing org hierarchy id=${id}`).toBeTruthy();
        compareApiToDb(
          [
            { label: "id", apiValue: apiRow.id, dbValue: dbRow!.id },
            { label: "code", apiValue: apiRow.code, dbValue: dbRow!.code },
            { label: "name", apiValue: apiRow.name, dbValue: dbRow!.name },
          ],
          `DB vs API — org hierarchy id=${id}`,
          { ...obs, table: 'public."M_Organisation_Hierarchy"', mode: "exact" },
        );
      }
    },
  );

  test(
    "IND-UL-DB-010 — Network hierarchy COUNT + sample rows match DB",
    { tag: ["@utils-lookup", "@network-hierarchy", "@db"] },
    async ({ authenticatedApi, db, obs }) => {
      await applyAllureTestCaseId("IND-UL-DB-010");
      const { responseBody } = await new NetworkApi(
        authenticatedApi,
      ).getNetworkHierarchy();
      const mapped = NetworkMapper.mapData(
        getLookupResponseData(responseBody),
      );
      const dbCount = await countNetworkHierarchies(db);
      compareApiToDb(
        [{ label: "items.length", apiValue: mapped.items.length, dbValue: dbCount }],
        "DB vs API — network hierarchy count",
        { ...obs, table: 'public."M_Network_Hierarchy"', mode: "exact" },
      );

      for (const id of sampleIds(
        mapped.items.map((item) => item.id),
        resolveUtilsLookupDbSampleSize(),
      )) {
        const apiRow = mapped.items.find((item) => item.id === id)!;
        const dbRow = await getNetworkHierarchyById(db, id);
        expect(dbRow, `DB missing network hierarchy id=${id}`).toBeTruthy();
        compareApiToDb(
          [
            { label: "id", apiValue: apiRow.id, dbValue: dbRow!.id },
            { label: "code", apiValue: apiRow.code, dbValue: dbRow!.code },
            { label: "name", apiValue: apiRow.name, dbValue: dbRow!.name },
          ],
          `DB vs API — network hierarchy id=${id}`,
          { ...obs, table: 'public."M_Network_Hierarchy"', mode: "exact" },
        );
      }
    },
  );
});
