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

function isFeederLevel(level: string | undefined): boolean {
  return /feeder/i.test(level ?? "");
}

/** Smallest useful `rootId` GET: a Feeder that already has catalog DTRs. */
export function findFirstFeederWithDtrs(
  nodes: NetworkNode[],
): NetworkNode | undefined {
  for (const node of nodes) {
    if (isFeederLevel(node.hierarchyLevel) && (node.dtrs?.length ?? 0) > 0) {
      return node;
    }
    const nested = findFirstFeederWithDtrs(node.children ?? []);
    if (nested) {
      return nested;
    }
  }
  return undefined;
}

export function findFirstFeederWithEmptyDtrs(
  nodes: NetworkNode[],
): NetworkNode | undefined {
  for (const node of nodes) {
    if (isFeederLevel(node.hierarchyLevel) && (node.dtrs?.length ?? 0) === 0) {
      return node;
    }
    const nested = findFirstFeederWithEmptyDtrs(node.children ?? []);
    if (nested) {
      return nested;
    }
  }
  return undefined;
}

export function findFirstEmptyNetworkCode(
  nodes: NetworkNode[],
): NetworkNode | undefined {
  for (const node of nodes) {
    if (!node.networkCode?.trim()) {
      return node;
    }
    const nested = findFirstEmptyNetworkCode(node.children ?? []);
    if (nested) {
      return nested;
    }
  }
  return undefined;
}

export function findFirstOrganisationRootId(
  nodes: OrganisationNode[],
): number | undefined {
  return nodes[0]?.organisationLookupId;
}

function isZoneLevel(level: string | undefined): boolean {
  return /zone/i.test(level ?? "");
}

/** Prefer a Zone that already has catalog DTRs for a smaller `rootId` GET. */
export function findFirstOfficeWithDtrs(
  nodes: OrganisationNode[],
): OrganisationNode | undefined {
  let fallback: OrganisationNode | undefined;
  const walk = (items: OrganisationNode[]): OrganisationNode | undefined => {
    for (const node of items) {
      if ((node.dtrs?.length ?? 0) > 0) {
        if (isZoneLevel(node.hierarchyLevel)) {
          return node;
        }
        fallback ??= node;
      }
      const nested = walk(node.children ?? []);
      if (nested) {
        return nested;
      }
    }
    return undefined;
  };
  return walk(nodes) ?? fallback;
}

export function findFirstOfficeWithEmptyDtrs(
  nodes: OrganisationNode[],
): OrganisationNode | undefined {
  for (const node of nodes) {
    if ((node.dtrs?.length ?? 0) === 0) {
      return node;
    }
    const nested = findFirstOfficeWithEmptyDtrs(node.children ?? []);
    if (nested) {
      return nested;
    }
  }
  return undefined;
}

export function findFirstEmptyOfficeCode(
  nodes: OrganisationNode[],
): OrganisationNode | undefined {
  for (const node of nodes) {
    if (!node.officeCode?.trim()) {
      return node;
    }
    const nested = findFirstEmptyOfficeCode(node.children ?? []);
    if (nested) {
      return nested;
    }
  }
  return undefined;
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
