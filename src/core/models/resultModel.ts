export interface ValidationResult {

  name: string;

  status: "PASS" | "FAIL";

  message?: string;
}