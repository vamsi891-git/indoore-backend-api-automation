import { expect } from "@playwright/test";
import { OrganisationHierarchyData, OrganisationNode} from "../Mapper/organizationhierarchy.mapper";
export class OrganisationHierarchyValidator {
    validateItemsExist(data: OrganisationHierarchyData) {
        expect(data.hierarchy.length).toBeGreaterThan(0);
    }
    validateHierarchyFields(nodes:OrganisationNode[]) {
        nodes.forEach(node => {
            expect(node.organisationLookupId).toBeGreaterThan(0);
            expect(node.officeName).toBeTruthy();
            expect(node.officeName.trim()).not.toEqual("");
            if (node.officeCode?.trim()) {
                expect(node.officeCode.trim()).not.toEqual("");
            }
            else {
                console.log("Empty officeCode:",JSON.stringify({
                        organisationLookupId:
                            node.organisationLookupId,
                        officeName:
                            node.officeName,
                        hierarchyLevel:
                            node.hierarchyLevel
                    },
                        null,
                        2
                    )
                )

            }

            node.dtrs?.forEach(dtr => {
                expect(dtr.networkLookupId).toBeGreaterThan(0);
                expect(dtr.dtrName).toBeTruthy();
                expect(dtr.consumerCount).toBeGreaterThanOrEqual(0);
                if (dtr.dtrMeter) {
                    expect(dtr.dtrMeter.meterLookupId).toBeGreaterThan(0);
                }
            });
            if (node.children?.length) {
                this.validateHierarchyFields(node.children)
            }
        })
    }
    validateDuplicateIds(nodes:OrganisationNode[]) {
        const ids: number[] = [];
        const extract = (items:OrganisationNode[]
        ) => {
            items.forEach(x => {
                ids.push(x.organisationLookupId);
                extract(x.children);
            })
        }
        extract(nodes);
        const duplicates =ids.filter((id, index) =>ids.indexOf(id) !== index);
        if (duplicates.length) {
            console.log("Duplicate Organisation IDs:",duplicates)
        }
        expect(duplicates.length).toBe(0)
    }
    validateExpectedLevels(nodes:OrganisationNode[]) {
        const expected = ["Discom", "Region","Circle","Division","Zone" ];
        const found: string[] = [];
        const extract = (items:OrganisationNode[]) => {
            items.forEach(x => {
                found.push(x.hierarchyLevel);
                extract(x.children);
            })
        }
        extract(nodes);
        expected.forEach(level => {
            expect(found).toContain(level)
        })
    }
}