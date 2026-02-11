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

// ============================================================================
// Logo Overlay Configuration
// ============================================================================

export const LOGO = {
  // Size constraints (percentage of image width)
  MIN_SIZE: 5,
  MAX_SIZE: 50,
  DEFAULT_SIZE: 20,
  
  // Opacity constraints (0-100)
  MIN_OPACITY: 0,
  MAX_OPACITY: 100,
  DEFAULT_OPACITY: 80,
  
  // Rotation constraints (degrees)
  MIN_ROTATION: -360,
  MAX_ROTATION: 360,
  
  // Position padding from edges (pixels)
  EDGE_PADDING: 20,
  
  // Supported image formats
  SUPPORTED_FORMATS: ['png', 'jpg', 'jpeg', 'svg'] as const,
  
  // Max file size for uploads (2MB)
  MAX_FILE_SIZE: 2 * 1024 * 1024,
  
  // Text watermark defaults
  TEXT_DEFAULT_FONT: 'Arial',
  TEXT_DEFAULT_COLOR: '#FFFFFF',
  TEXT_DEFAULT_FONT_SIZE: 48,
  TEXT_STROKE_WIDTH: 2,
  TEXT_STROKE_COLOR: '#000000',
} as const;

// ============================================================================
// Object Detection Configuration
// ============================================================================

export const OBJECT_DETECTION = {
  // Minimum confidence threshold for detections (0-1)
  CONFIDENCE_THRESHOLD: 0.3,
  
  // API timeout in milliseconds
  TIMEOUT_MS: 15000,
  
  // Replicate model for object detection
  MODEL: 'meta/meta-llama-3-70b-instruct',
  
  // Product-related labels to prioritize
  PRODUCT_LABELS: [
    'bottle', 'can', 'cup', 'vase', 'box', 'package',
    'container', 'product', 'phone', 'laptop', 'watch',
    'bag', 'shoe', 'clothing', 'book',
  ] as const,
} as const;

