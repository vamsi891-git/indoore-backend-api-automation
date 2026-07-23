/**
 * Read-only SQL for DASHBOARD DB cross-validation.
 * Network/meter universe counts (JWT-scoped API ≤ unscoped DB).
 * Gated by DASHBOARD_DB_SQL_READY=true.
 */

export const DASHBOARD_ACTIVE_DTR_COUNT_SQL = `
  SELECT COUNT(*)::int AS count
  FROM public."L_Network_Lookup" n
  INNER JOIN public."M_Network_Hierarchy" mnh
    ON mnh."NetworkHierarchy_TblRefID" = n."NetworkHierarchy_TblRefID"
  WHERE mnh."NetworkHierarchy_Name" ILIKE '%DTR%'
    AND n."IsActiveStatus" = TRUE
`;

export const DASHBOARD_ACTIVE_FEEDER_COUNT_SQL = `
  SELECT COUNT(*)::int AS count
  FROM public."L_Network_Lookup" n
  INNER JOIN public."M_Network_Hierarchy" mnh
    ON mnh."NetworkHierarchy_TblRefID" = n."NetworkHierarchy_TblRefID"
  WHERE mnh."NetworkHierarchy_Name" = 'Feeder'
    AND n."IsActiveStatus" = TRUE
`;

export const DASHBOARD_ACTIVE_SUBSTATION_COUNT_SQL = `
  SELECT COUNT(*)::int AS count
  FROM public."L_Network_Lookup" n
  INNER JOIN public."M_Network_Hierarchy" mnh
    ON mnh."NetworkHierarchy_TblRefID" = n."NetworkHierarchy_TblRefID"
  WHERE mnh."NetworkHierarchy_Name" = 'Sub Station'
    AND n."IsActiveStatus" = TRUE
`;

export const DASHBOARD_ACTIVE_METER_COUNT_SQL = `
  SELECT COUNT(*)::int AS count
  FROM public."L_Meter_Lookup" lml
  WHERE lml."IsActiveStatus" = TRUE
`;

export const DASHBOARD_SQL_TODO =
  "Consumption / communication / power-status series SQL deferred until backend repository paste";
