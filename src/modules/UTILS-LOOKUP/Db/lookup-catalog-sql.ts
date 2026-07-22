/**
 * Read-only SQL mirroring backend UtilsRepository catalog queries.
 * Keep in sync with Indoore utils.repository list* methods.
 */

export const CONNECTION_STATUS_COUNT_SQL = `
  SELECT COUNT(*)::int AS count
  FROM public."M_Connection_Status" cs
  WHERE cs."IsActive" IS TRUE
`;

export const CONNECTION_STATUS_ROW_BY_ID_SQL = `
  SELECT
    cs."ConnectionStatus_TblRefID"::int AS id,
    NULLIF(TRIM(cs."ConnectionStatus_Name"), '') AS name,
    CASE
      WHEN cs."shortName" IS NOT NULL AND TRIM(cs."shortName") <> ''
      THEN TRIM(cs."shortName")
      ELSE NULL
    END AS "shortName"
  FROM public."M_Connection_Status" cs
  WHERE cs."ConnectionStatus_TblRefID" = $1::int
    AND cs."IsActive" IS TRUE
  LIMIT 1
`;

export const CONSUMER_CATEGORY_COUNT_SQL = `
  SELECT COUNT(*)::int AS count
  FROM public."M_Category" c
  WHERE c.isactive = 1
`;

export const CONSUMER_CATEGORY_ROW_BY_ID_SQL = `
  SELECT
    c."Category_TblRefID"::int AS id,
    COALESCE(TRIM(c."ShortName"), '') AS "shortName",
    COALESCE(TRIM(c."CategoryName"), '') AS name
  FROM public."M_Category" c
  WHERE c."Category_TblRefID" = $1::int
    AND c.isactive = 1
  LIMIT 1
`;

export const PAYMENT_CONTRACT_COUNT_SQL = `
  SELECT COUNT(*)::int AS count
  FROM public."M_PaymentType_Contract" pc
  WHERE pc."IsActiveStatus" IS TRUE
`;

export const PAYMENT_CONTRACT_ROW_BY_ID_SQL = `
  SELECT
    pc."PaymentContract_TblRefID"::int AS id,
    COALESCE(TRIM(pc."PaymentContract_Name"), '') AS name,
    CASE
      WHEN TRIM(COALESCE(pc."PaymentContract_Code", '')) <> ''
      THEN TRIM(pc."PaymentContract_Code")
      ELSE NULL
    END AS code
  FROM public."M_PaymentType_Contract" pc
  WHERE pc."PaymentContract_TblRefID" = $1::int
    AND pc."IsActiveStatus" IS TRUE
  LIMIT 1
`;

export const DEVICE_MANUFACTURER_COUNT_SQL = `
  SELECT COUNT(*)::int AS count
  FROM (
    SELECT DISTINCT ON (m."DeviceManufacturer_TblRefID")
      m."DeviceManufacturer_TblRefID"
    FROM public."M_Device_Manufacturer" m
    WHERE m."IsActiveStatus" IS TRUE
    ORDER BY m."DeviceManufacturer_TblRefID" ASC, TRIM(m."Manufacturer_Name") ASC
  ) x
`;

export const DEVICE_MANUFACTURER_ROW_BY_ID_SQL = `
  SELECT
    m."DeviceManufacturer_TblRefID"::int AS id,
    COALESCE(TRIM(m."Manufacturer_Name"), '') AS name,
    CASE
      WHEN m."Manufacturer_Code" IS NOT NULL AND TRIM(m."Manufacturer_Code") <> ''
      THEN TRIM(m."Manufacturer_Code")
      ELSE NULL
    END AS code
  FROM public."M_Device_Manufacturer" m
  WHERE m."DeviceManufacturer_TblRefID" = $1::int
    AND m."IsActiveStatus" IS TRUE
  ORDER BY TRIM(m."Manufacturer_Name") ASC
  LIMIT 1
`;

export const EVENT_COUNT_SQL = `
  SELECT COUNT(*)::int AS count
  FROM public."M_Event" ev
  WHERE ev."IsActive" IS TRUE
`;

export const EVENT_ROW_BY_ID_SQL = `
  SELECT
    ev."Event_TblRefID"::int AS id,
    ev."EventCode"::int AS code,
    COALESCE(TRIM(ev."Event_Name"), '') AS name,
    COALESCE(TRIM(ev."Event_Description"), '') AS description,
    CASE
      WHEN ev."Event_Reference_Table" IS NOT NULL AND TRIM(ev."Event_Reference_Table") <> ''
      THEN TRIM(ev."Event_Reference_Table")
      ELSE NULL
    END AS "eventReferenceTable"
  FROM public."M_Event" ev
  WHERE ev."Event_TblRefID" = $1::int
    AND ev."IsActive" IS TRUE
  LIMIT 1
`;

export const EVENT_CLASSIFICATION_COUNT_SQL = `
  SELECT COUNT(*)::int AS count
  FROM public."M_EventClassification" ec
  WHERE COALESCE(ec."IsActiveStatus", true) IS TRUE
`;

export const EVENT_CLASSIFICATION_ROW_BY_ID_SQL = `
  SELECT
    ec."EventClassification_TblRefID"::int AS "EventClassificationTblRefId",
    COALESCE(TRIM(ec."EventClassification_Name"), '') AS "EventClassification_Name"
  FROM public."M_EventClassification" ec
  WHERE ec."EventClassification_TblRefID" = $1::int
    AND COALESCE(ec."IsActiveStatus", true) IS TRUE
  LIMIT 1
`;

export const EVENT_PRIORITY_COUNT_SQL = `
  SELECT COUNT(*)::int AS count
  FROM (
    SELECT DISTINCT ev."prioritytblrefID"::int AS priority_tbl_ref_id
    FROM public."M_Event" ev
    WHERE ev."IsActive" IS TRUE
      AND ev."prioritytblrefID" IS NOT NULL
  ) x
`;

export const EVENT_PRIORITY_EXISTS_SQL = `
  SELECT EXISTS (
    SELECT 1
    FROM public."M_Event" ev
    WHERE ev."IsActive" IS TRUE
      AND ev."prioritytblrefID"::int = $1::int
  ) AS present
`;

export const METER_PHASE_COUNT_SQL = `
  SELECT COUNT(*)::int AS count
  FROM public."M_ServicePoint_MeterPhase" mp
  WHERE mp."IsActive" IS TRUE OR mp."IsActiveStatus" IS TRUE
`;

export const METER_PHASE_ROW_BY_ID_SQL = `
  SELECT
    mp."ServicePointMeterPhase_TblRefID"::int AS id,
    TRIM(mp."MeterPhase_Name") AS name
  FROM public."M_ServicePoint_MeterPhase" mp
  WHERE mp."ServicePointMeterPhase_TblRefID" = $1::int
    AND (mp."IsActive" IS TRUE OR mp."IsActiveStatus" IS TRUE)
  LIMIT 1
`;

export const ORG_HIERARCHY_COUNT_SQL = `
  SELECT COUNT(*)::int AS count
  FROM public."M_Organisation_Hierarchy" oh
  WHERE oh."IsActiveStatus" IS TRUE
`;

export const ORG_HIERARCHY_ROW_BY_ID_SQL = `
  SELECT
    oh."OrganisationHierarchy_TblRefID"::int AS id,
    TRIM(oh."OrganisationHierarchy_Code") AS code,
    TRIM(oh."OrganisationHierarchy_Name") AS name
  FROM public."M_Organisation_Hierarchy" oh
  WHERE oh."OrganisationHierarchy_TblRefID" = $1::int
    AND oh."IsActiveStatus" IS TRUE
  LIMIT 1
`;

export const NETWORK_HIERARCHY_COUNT_SQL = `
  SELECT COUNT(*)::int AS count
  FROM public."M_Network_Hierarchy" nh
  WHERE nh."IsActiveStatus" IS TRUE
`;

export const NETWORK_HIERARCHY_ROW_BY_ID_SQL = `
  SELECT
    nh."NetworkHierarchy_TblRefID"::int AS id,
    TRIM(nh."NetworkHierarchy_Code") AS code,
    TRIM(nh."NetworkHierarchy_Name") AS name
  FROM public."M_Network_Hierarchy" nh
  WHERE nh."NetworkHierarchy_TblRefID" = $1::int
    AND nh."IsActiveStatus" IS TRUE
  LIMIT 1
`;
