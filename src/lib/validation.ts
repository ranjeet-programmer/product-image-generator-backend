import { GenerateRequest } from '../types';
import { IMAGE_LIMITS, VALIDATION } from './constants';

/**
 * Validation error class for request validation failures
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validates the description field
 * 
 * @param description - Product description to validate
 * @throws {ValidationError} If description is invalid
 */
export function validateDescription(description: unknown): asserts description is string {
  if (!description || typeof description !== 'string') {
    throw new ValidationError('Description is required and must be a string');
  }

  const trimmed = description.trim();
  if (trimmed.length < VALIDATION.MIN_DESCRIPTION_LENGTH) {
    throw new ValidationError(
      `Description must be at least ${VALIDATION.MIN_DESCRIPTION_LENGTH} characters long`
    );
  }

  if (trimmed.length > VALIDATION.MAX_DESCRIPTION_LENGTH) {
    throw new ValidationError(
      `Description must not exceed ${VALIDATION.MAX_DESCRIPTION_LENGTH} characters`
    );
  }
}

/**
 * Validates the number of images to generate
 * 
 * @param numImages - Number of images to generate
 * @throws {ValidationError} If numImages is out of valid range
 */
export function validateNumImages(numImages: number): void {
  if (numImages < IMAGE_LIMITS.MIN_IMAGES || numImages > IMAGE_LIMITS.MAX_IMAGES) {
    throw new ValidationError(
      `Number of images must be between ${IMAGE_LIMITS.MIN_IMAGES} and ${IMAGE_LIMITS.MAX_IMAGES}`
    );
  }
}

/**
 * Validates the resolution format
 * 
 * @param resolution - Resolution string (e.g., "1024x1024")
 * @throws {ValidationError} If resolution is invalid
 */
export function validateResolution(resolution: string): void {
  const validResolutions = IMAGE_LIMITS.SUPPORTED_RESOLUTIONS as readonly string[];
  if (!validResolutions.includes(resolution)) {
    throw new ValidationError(
      `Resolution must be one of: ${validResolutions.join(', ')}`
    );
  }
}

/**
 * Sanitizes and validates a complete generation request
 * 
 * @param body - Request body to validate
 * @returns Validated and sanitized request object
 * @throws {ValidationError} If any validation fails
 */
export function validateGenerateRequest(body: unknown): GenerateRequest {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Request body must be a valid JSON object');
  }

  const req = body as Partial<GenerateRequest>;

  // Validate required fields
  validateDescription(req.description);

  // Validate settings if provided
  if (req.settings) {
    const { numImages, resolution } = req.settings;
    
    if (numImages !== undefined) {
      validateNumImages(numImages);
    }
    
    if (resolution !== undefined) {
      validateResolution(resolution);
    }
  }

  return req as GenerateRequest;
}

/**
 * Sanitizes string input by trimming and removing extra whitespace
 * 
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}

/**
 * Gets a safe preview of the description for logging
 * 
 * @param description - Full description
 * @param maxLength - Maximum length of preview
 * @returns Truncated description with ellipsis if needed
 */
export function getDescriptionPreview(description: string, maxLength: number = 50): string {
  const sanitized = sanitizeString(description);
  if (sanitized.length <= maxLength) {
    return sanitized;
  }
  return sanitized.substring(0, maxLength) + '...';
}
