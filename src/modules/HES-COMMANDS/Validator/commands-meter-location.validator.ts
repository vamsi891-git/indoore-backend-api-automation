import { expect } from "@playwright/test";
import { MeterLocationRequestBody } from "../Data/commands-meter-location.data";
import {
  MappedMeterLocationData,
  MeterLocationData,
  MeterLocationResponse,
} from "../Mapper/commands-meter-location.mapper";

const NODE_ID_PATTERN = /^[0-9a-f]{2}(-[0-9a-f]{2}){7}$/i;

function extractSoapTagValue(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}>([^<]+)</${tag}>`));
  return match?.[1]?.trim() ?? null;
}

export class CommandsMeterLocationValidator {
  validateResponse(body: MeterLocationResponse): void {
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
  }

  validateErrorResponse(body: MeterLocationResponse): void {
    expect(body.success).toBe(false);
    expect(body.error?.code).toBeTruthy();
    expect(body.error?.message).toBeTruthy();
  }

  /** API echoes HES node MAC in data.nodeId (request.nodeId). */
  validateNodeIdEcho(
    location: MeterLocationData,
    request: MeterLocationRequestBody,
  ): void {
    expect(location.nodeId).toBe(request.nodeId.trim());
  }

  validateNodeIdFormat(location: MeterLocationData): void {
    expect(location.nodeId.length).toBeGreaterThan(0);
    expect(NODE_ID_PATTERN.test(location.nodeId)).toBe(true);
  }

  validateCoordinates(location: MeterLocationData): void {
    expect(Number.isFinite(location.latitude)).toBe(true);
    expect(Number.isFinite(location.longitude)).toBe(true);
    expect(location.latitude).toBeGreaterThanOrEqual(-90);
    expect(location.latitude).toBeLessThanOrEqual(90);
    expect(location.longitude).toBeGreaterThanOrEqual(-180);
    expect(location.longitude).toBeLessThanOrEqual(180);
  }

  validateHesResponsePresent(location: MeterLocationData): void {
    expect(location.hesResponse.length).toBeGreaterThan(0);
  }

  validateHesSoapEnvelope(location: MeterLocationData): void {
    expect(location.hesResponse).toContain("soap:Envelope");
    expect(location.hesResponse).toContain("soap:Body");
    expect(location.hesResponse).toContain("setLocationResponse");
  }

  validateHesSoapNodeId(location: MeterLocationData): void {
    expect(location.hesResponse).toContain(`<nodeId>${location.nodeId}</nodeId>`);
  }

  validateHesSoapCoordinates(location: MeterLocationData): void {
    const soapLatitude = extractSoapTagValue(location.hesResponse, "latitude");
    const soapLongitude = extractSoapTagValue(location.hesResponse, "longitude");

    expect(soapLatitude).toBeTruthy();
    expect(soapLongitude).toBeTruthy();
    expect(Number(soapLatitude)).toBe(location.latitude);
    expect(Number(soapLongitude)).toBe(location.longitude);
  }

  validateHesSoapMetadata(location: MeterLocationData): void {
    expect(location.hesResponse).toContain("<nodeType>");
    expect(location.hesResponse).toContain("<status>");
    expect(location.hesResponse).toContain("<createTime>");
    expect(location.hesResponse).toContain("<updateTime>");
  }

  validateHesResponseAlignment(location: MeterLocationData): void {
    this.validateHesResponsePresent(location);
    this.validateHesSoapEnvelope(location);
    this.validateHesSoapNodeId(location);
    this.validateHesSoapCoordinates(location);
    this.validateHesSoapMetadata(location);
  }

  validateFullContract(
    mapped: MappedMeterLocationData,
    request: MeterLocationRequestBody,
  ): void {
    const { location } = mapped;
    this.validateNodeIdEcho(location, request);
    this.validateNodeIdFormat(location);
    this.validateCoordinates(location);
    this.validateHesResponseAlignment(location);
  }
}
