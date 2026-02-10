/**
 * Backend Configuration Constants
 * 
 * Centralized configuration values, limits, and magic numbers
 * to improve code maintainability and readability.
 */

// ============================================================================
// Image Generation Limits
// ============================================================================

export const IMAGE_LIMITS = {
  MIN_IMAGES: 1,
  MAX_IMAGES: 4,
  DEFAULT_IMAGES: 1,
  DEFAULT_RESOLUTION: '1024x1024' as const,
  SUPPORTED_RESOLUTIONS: ['512x512', '768x768', '1024x1024'] as const,
} as const;

// ============================================================================
// Validation Constraints
// ============================================================================

export const VALIDATION = {
  MIN_DESCRIPTION_LENGTH: 3,
  MAX_DESCRIPTION_LENGTH: 1000,
  DESCRIPTION_PREVIEW_LENGTH: 50,
} as const;

// ============================================================================
// File Storage Configuration
// ============================================================================

export const STORAGE = {
  GENERATED_DIR: 'public/generated',
  FILE_EXTENSION: '.png',
  FILENAME_BATCH_ID_LENGTH: 8,
  URL_PREFIX: '/generated',
} as const;

// ============================================================================
// API Configuration
// ============================================================================

export const API = {
  TIMEOUT_MS: 300000, // 5 minutes for long-running generations
  HUGGINGFACE_MODEL: 'stabilityai/stable-diffusion-xl-base-1.0',
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 2000,
} as const;

// ============================================================================
// Queue Configuration
// ============================================================================

export const QUEUE = {
  NAME: 'image-generation',
  CONCURRENCY: 1, // Process one job at a time (free tier limitation)
  RATE_LIMIT_MAX: 5, // Max 5 jobs
  RATE_LIMIT_DURATION_MS: 60000, // Per 60 seconds
} as const;

// ============================================================================
// AI Generation Parameters
// ============================================================================

export const AI_PARAMS = {
  GUIDANCE_SCALE: 7.5,
  INFERENCE_STEPS: 30,
  MODEL_LOADING_RETRY_DELAY_MS: 20000, // 20 seconds
} as const;

// ============================================================================
// Prompt Optimization
// ============================================================================

export const PROMPT = {
  MAX_DESCRIPTION_LINES: 2,
  DESCRIPTION_SEPARATOR: ' ',
} as const;

// ============================================================================
// Logging & Debugging
// ============================================================================

export const LOG = {
  DESCRIPTION_PREVIEW_LENGTH: 20,
  ENABLE_VERBOSE: process.env.VERBOSE === 'true',
} as const;
