import type { DtrNode, NetworkNode } from "../Mapper/networkhierarchy.mapper";
import type { OrganisationNode } from "../Mapper/organizationhierarchy.mapper";

export type HierarchyDtrSummary = {
  dtrs: DtrNode[];
  totalMeterCount: number;
};

export function summarizeNetworkDtrs(nodes: NetworkNode[]): HierarchyDtrSummary {
  const dtrs: DtrNode[] = [];
  const walk = (items: NetworkNode[]) => {
    items.forEach((node) => {
      dtrs.push(...(node.dtrs ?? []));
      walk(node.children ?? []);
    });
  };
  walk(nodes);
  return {
    dtrs,
    totalMeterCount: dtrs.reduce((sum, dtr) => sum + dtr.consumerCount, 0),
  };
}

export function summarizeOrganisationDtrs(
  nodes: OrganisationNode[],
): HierarchyDtrSummary {
  const dtrs: DtrNode[] = [];
  const walk = (items: OrganisationNode[]) => {
    items.forEach((node) => {
      dtrs.push(...(node.dtrs ?? []));
      walk(node.children ?? []);
    });
  };
  walk(nodes);
  return {
    dtrs,
    totalMeterCount: dtrs.reduce((sum, dtr) => sum + dtr.consumerCount, 0),
  };
}

export function findFirstDtrNetworkLookupId(
  nodes: NetworkNode[] | OrganisationNode[],
): number | undefined {
  return findDtrById(nodes)?.networkLookupId;
}

export function findDtrById(
  nodes: NetworkNode[] | OrganisationNode[],
  dtrId?: number,
): DtrNode | undefined {
  for (const node of nodes) {
    for (const dtr of node.dtrs ?? []) {
      if (dtrId == null || dtr.networkLookupId === dtrId) {
        return dtr;
      }
    }
    const child = findDtrById(node.children ?? [], dtrId);
    if (child) {
      return child;
    }
  }
  return undefined;
}

export function findDtrWithHighestConsumerCount(
  nodes: NetworkNode[] | OrganisationNode[],
): DtrNode | undefined {
  let best: DtrNode | undefined;
  const walk = (items: NetworkNode[] | OrganisationNode[]) => {
    items.forEach((node) => {
      for (const dtr of node.dtrs ?? []) {
        if (!best || dtr.consumerCount > best.consumerCount) {
          best = dtr;
        }
      }
      walk(node.children ?? []);
    });
  };
  walk(nodes);
  return best;
}

export function findFirstNetworkRootId(nodes: NetworkNode[]): number | undefined {
  return nodes[0]?.networkLookupId;
}

export function findFirstOrganisationRootId(
  nodes: OrganisationNode[],
): number | undefined {
  return nodes[0]?.organisationLookupId;
}

/** Prefer a child node with DTRs so rootId subtree is smaller than the full hierarchy. */
export function findScopedSubtreeNetworkRootId(
  nodes: NetworkNode[],
): number | undefined {
  let fallback: number | undefined;

  const walk = (items: NetworkNode[]): number | undefined => {
    for (const node of items) {
      if ((node.children?.length ?? 0) === 0) {
        continue;
      }

      if (!fallback) {
        fallback = node.networkLookupId;
      }

      const childHasDtrs = node.children.some(
        (child) => (child.dtrs?.length ?? 0) > 0 || (child.children?.length ?? 0) > 0,
      );
      if ((node.dtrs?.length ?? 0) > 0 || childHasDtrs) {
        return node.networkLookupId;
      }

      const nested = walk(node.children);
      if (nested != null) {
        return nested;
      }
    }
    return undefined;
  };

  return walk(nodes) ?? fallback ?? nodes[0]?.networkLookupId;
}

export function findScopedSubtreeOrganisationRootId(
  nodes: OrganisationNode[],
): number | undefined {
  let fallback: number | undefined;

  const walk = (items: OrganisationNode[]): number | undefined => {
    for (const node of items) {
      if ((node.children?.length ?? 0) === 0) {
        continue;
      }

      if (!fallback) {
        fallback = node.organisationLookupId;
      }

      const childHasDtrs = node.children.some(
        (child) => (child.dtrs?.length ?? 0) > 0 || (child.children?.length ?? 0) > 0,
      );
      if ((node.dtrs?.length ?? 0) > 0 || childHasDtrs) {
        return node.organisationLookupId;
      }

      const nested = walk(node.children);
      if (nested != null) {
        return nested;
      }
    }
    return undefined;
  };

  return walk(nodes) ?? fallback ?? nodes[0]?.organisationLookupId;
}

export function collectNetworkHierarchyLevels(nodes: NetworkNode[]): string[] {
  const levels: string[] = [];
  const walk = (items: NetworkNode[]) => {
    items.forEach((node) => {
      levels.push(node.hierarchyLevel);
      if (node.children.length) {
        walk(node.children);
      }
    });
  };
  walk(nodes);
  return levels;
}

export function collectOrganisationHierarchyLevels(
  nodes: OrganisationNode[],
): string[] {
  const levels: string[] = [];
  const walk = (items: OrganisationNode[]) => {
    items.forEach((node) => {
      levels.push(node.hierarchyLevel);
      if (node.children?.length) {
        walk(node.children);
      }
    });
  };
  walk(nodes);
  return levels;
}
