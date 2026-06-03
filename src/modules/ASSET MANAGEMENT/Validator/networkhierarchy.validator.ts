import { expect } from "@playwright/test";
import { NetworkHierarchyData, NetworkNode } from "../Mapper/networkhierarchy.mapper";
export class NetworkHierarchyValidator {

    validateItemsExist(data: NetworkHierarchyData) {
        expect(data.hierarchy.length).toBeGreaterThan(0);
    }
    validateHierarchyFields(
        nodes: NetworkNode[]
    ) {

        nodes.forEach(node => {

            expect(
                node.networkLookupId
            ).toBeGreaterThan(0);

            expect(
                node.networkName
            ).toBeTruthy();

            expect(
                node.networkName.trim()
            ).not.toEqual("");

            // validate only when non-empty
            if (
                node.networkCode?.trim()
            ) {

                expect(
                    node.networkCode.trim()
                ).not.toEqual("");

            } else {

                console.log(
                    "Empty networkCode node:",
                    JSON.stringify(
                        {
                            networkLookupId:
                                node.networkLookupId,

                            networkName:
                                node.networkName,

                            hierarchyLevel:
                                node.hierarchyLevel
                        },
                        null,
                        2
                    )
                );

            }

            node.dtrs.forEach(dtr => {

                expect(
                    dtr.networkLookupId
                ).toBeGreaterThan(0);

                expect(
                    dtr.dtrName
                ).toBeTruthy();

                expect(
                    dtr.consumerCount
                )
                    .toBeGreaterThanOrEqual(0);

                if (
                    dtr.dtrMeter
                ) {

                    expect(
                        dtr.dtrMeter
                            .meterLookupId
                    )
                        .toBeGreaterThan(0);

                }

            });

            if (
                node.children.length
            ) {
                this.validateHierarchyFields(
                    node.children
                );

            }

        });

    }

    validateDuplicateIds(
        nodes: NetworkNode[]
    ) {

        const ids: number[] = [];

        const extract = (
            items: NetworkNode[]
        ) => {

            items.forEach(x => {

                ids.push(
                    x.networkLookupId
                );

                x.dtrs.forEach(
                    d => ids.push(
                        d.networkLookupId
                    )
                );

                extract(
                    x.children
                );

            });

        };

        extract(nodes);

        const unique =
            new Set(ids);

        expect(
            ids.length
        )
            .toBe(
                unique.size
            );

    }

    validateExpectedLevels(
        nodes: NetworkNode[]
    ) {

        const levels = [
            "Sub Station",
            "Feeder"
        ];

        const found: string[] = [];

        const extract = (
            items: NetworkNode[]
        ) => {

            items.forEach(x => {

                found.push(
                    x.hierarchyLevel
                );

                extract(
                    x.children
                );

            });

        };

        extract(nodes);
        levels.forEach(level => {

            expect(found)
                .toContain(level);

        });

    }

}