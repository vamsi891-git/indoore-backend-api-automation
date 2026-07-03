import {
    AssetDtrLookupId,
    DtrDetailPaginationQueries,
} from "./asset-management.common.data";

export const DtrDetailTestData = {
    ...DtrDetailPaginationQueries.default,
    dtrId: AssetDtrLookupId,
};