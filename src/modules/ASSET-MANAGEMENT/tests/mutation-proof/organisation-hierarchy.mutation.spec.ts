import { test, expect } from "@playwright/test";
import { OrganisationHierarchyValidator } from "../../Validator/organizationhierarchy.validator";
import { OrganisationHierarchySuccessResponseSchema } from "../../schemas/asset-management.schemas";
import { captureThrownMessage } from "./fixtures/capture-throw";
import { sampleOrganisationHierarchySuccess } from "./fixtures/asset-sample.fixture";
import type { OrganisationNode } from "../../Mapper/organizationhierarchy.mapper";

test.describe("Mutation proof — Organisation hierarchy", () => {
  test(
    "MUT-AM-OH-001 — schema fails when officeCode is removed",
    {
      tag: [
        "@mutation-proof",
        "@asset-management",
        "@organisation-hierarchy",
      ],
    },
    async () => {
      const mutated = structuredClone(sampleOrganisationHierarchySuccess);
      delete (mutated.data.hierarchy[0] as Record<string, unknown>).officeCode;
      const result =
        OrganisationHierarchySuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(/officeCode/i);
      }
    },
  );

  test(
    "MUT-AM-OH-002 — schema rejects unexpected node field (.strict())",
    {
      tag: [
        "@mutation-proof",
        "@asset-management",
        "@organisation-hierarchy",
      ],
    },
    async () => {
      const mutated = structuredClone(sampleOrganisationHierarchySuccess);
      (mutated.data.hierarchy[0] as Record<string, unknown>).debugFlag = true;
      const result =
        OrganisationHierarchySuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(
          /debugFlag|unrecognized_keys/i,
        );
      }
    },
  );

  test(
    "MUT-AM-OH-003 — validateExpectedLevels fails when Zone is missing",
    {
      tag: [
        "@mutation-proof",
        "@asset-management",
        "@organisation-hierarchy",
      ],
    },
    async () => {
      const nodes: OrganisationNode[] = structuredClone(
        sampleOrganisationHierarchySuccess.data.hierarchy,
      );
      // Strip Zone leaf under Division
      const division =
        nodes[0].children[0].children[0].children[0];
      division.children = [];
      const message = captureThrownMessage(() =>
        new OrganisationHierarchyValidator().validateExpectedLevels(nodes),
      );
      expect(message).not.toEqual("");
      expect(message).toMatch(/Zone|expected|toContain|Received/i);
    },
  );

  test(
    "MUT-AM-OH-004 — schema rejects empty officeName",
    {
      tag: [
        "@mutation-proof",
        "@asset-management",
        "@organisation-hierarchy",
      ],
    },
    async () => {
      const mutated = structuredClone(sampleOrganisationHierarchySuccess);
      mutated.data.hierarchy[0].officeName = "";
      const result =
        OrganisationHierarchySuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(/officeName/i);
      }
    },
  );

  test(
    "MUT-AM-OH-005 — schema rejects children = null",
    {
      tag: [
        "@mutation-proof",
        "@asset-management",
        "@organisation-hierarchy",
      ],
    },
    async () => {
      const mutated = structuredClone(sampleOrganisationHierarchySuccess);
      (mutated.data.hierarchy[0] as Record<string, unknown>).children = null;
      const result =
        OrganisationHierarchySuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(/children/i);
      }
    },
  );

  test(
    "MUT-AM-OH-006 — schema rejects non-positive organisationLookupId",
    {
      tag: [
        "@mutation-proof",
        "@asset-management",
        "@organisation-hierarchy",
      ],
    },
    async () => {
      const mutated = structuredClone(sampleOrganisationHierarchySuccess);
      mutated.data.hierarchy[0].organisationLookupId = -5;
      const result =
        OrganisationHierarchySuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(
          /organisationLookupId/i,
        );
      }
    },
  );
});
