import type { NetworkNode } from "../../ASSET MANAGEMENT/Mapper/networkhierarchy.mapper";

export function findFeederNetworkLookupId(
  nodes: NetworkNode[],
): number | undefined {
  for (const node of nodes) {
    const level = (node.hierarchyLevel ?? "").toUpperCase();
    if (level.includes("FEEDER")) {
      return node.networkLookupId;
    }

    const fromChildren = findFeederNetworkLookupId(node.children ?? []);
    if (fromChildren !== undefined) {
      return fromChildren;
    }
  }

  return undefined;
}
