import type { ParsedDtrLoadRatingOptionsResponse } from "../schemas/dtrloadratingoptions.schemas";
import { DtrLoadRatingOptionsResponseSchema } from "../schemas/dtrloadratingoptions.schemas";

export interface DtrLoadRatingOptionsResponse {
  success: boolean;
  data: DtrLoadRatingOptionsPayload;
}

export interface DtrLoadRatingOptionsPayload {
  items: Array<{ id: number; value: string }>;
}

export class DtrLoadRatingOptionsMapper {
  static parse(body: unknown): ParsedDtrLoadRatingOptionsResponse {
    return DtrLoadRatingOptionsResponseSchema.parse(body);
  }

  static map(
    parsed: ParsedDtrLoadRatingOptionsResponse["data"],
  ): DtrLoadRatingOptionsPayload {
    return {
      items: parsed.items ?? [],
    };
  }
}
