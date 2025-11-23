import { ZodError } from "zod";

/**
 * Standard validation error response format
 */
export interface ValidationErrorResponse {
  error: "VALIDATION_ERROR";
  details: Record<string, string>;
}

/**
 * Formats Zod errors into standardized field-level error response
 */
export function formatZodErrors(error: ZodError): ValidationErrorResponse {
  const details: Record<string, string> = {};
  
  error.errors.forEach((err) => {
    const fieldPath = err.path.join(".");
    details[fieldPath] = err.message;
  });

  return {
    error: "VALIDATION_ERROR",
    details,
  };
}

/**
 * Creates a validation error response for a single field
 */
export function createFieldError(field: string, message: string): ValidationErrorResponse {
  return {
    error: "VALIDATION_ERROR",
    details: {
      [field]: message,
    },
  };
}

/**
 * Validates that endAt is at least 2 hours from now
 */
export function validateMinimumDuration(endDate: Date): { valid: boolean; message?: string } {
  const now = new Date();
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  
  if (endDate < twoHoursFromNow) {
    return {
      valid: false,
      message: "End date must be at least 2 hours from now to give customers time to see and claim your offer",
    };
  }
  
  return { valid: true };
}
