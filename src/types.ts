/**
 * Product categories supported by the image generator
 * Aligned with frontend configuration
 */
export type ProductCategory =
  | 'clothing'
  | 'footwear'
  | 'electronics'
  | 'furniture'
  | 'beauty'
  | 'jewelry'
  | 'home-decor'
  | 'toy'
  | 'other';

/**
 * Image styles for product photography
 * Aligned with frontend configuration
 */
export type ImageStyle =
  | 'studio'      // Clean studio photography
  | 'lifestyle'   // Product in use/context
  | 'nature'      // Natural outdoor setting
  | 'urban'       // Urban/city environment
  | 'minimalist'  // Minimalist aesthetic
  | 'vintage';    // Vintage/retro style

/**
 * Camera angles for product photography
 * Aligned with frontend configuration
 */
export type CameraAngle =
  | 'front'       // Front view
  | 'side'        // Side view (profile)
  | 'back'        // Back view
  | 'top'         // Top-down view (bird's eye)
  | 'bottom'      // Bottom-up view
  | '45_degree'   // 45-degree angle (3/4 view)
  | 'close_up'    // Close-up detail shot
  | 'wide'        // Wide angle showing context
  | 'eye_level';  // Eye-level straight on

/**
 * Generation settings configuration
 */
export interface GenerationSettings {
  /** Number of images to generate (1-4) */
  numImages?: 1 | 2 | 3 | 4;
  /** Image resolution */
  resolution?: '512x512' | '768x768' | '1024x1024';
}

/**
 * API Request payload for image generation
 */
export interface GenerateRequest {
  /** Product description */
  description: string;
  /** Product category (optional, defaults to 'other') */
  category?: ProductCategory;
  /** Image style (optional, defaults to 'studio') */
  style?: ImageStyle;
  /** Camera angle (optional, defaults to 'front') */
  angle?: CameraAngle;
  /** Specific color for the product (optional) */
  color?: string;
  /** Generation settings (optional) */
  settings?: GenerationSettings;
}

/**
 * Generated image metadata
 */
export interface GeneratedImage {
  /** Relative URL path to the generated image */
  url: string;
  /** Filename of the generated image */
  filename: string;
}

/**
 * Metadata about the generation process
 * Aligned with frontend expectations
 */
export interface GenerationMetadata {
  /** The optimized prompt used for generation */
  prompt: string;
  /** Settings used for generation */
  settings: GenerationSettings;
}

/**
 * API Response payload for image generation
 * Aligned with frontend expectations
 */
export interface GenerateResponse {
  /** Whether the generation was successful */
  success: boolean;
  /** Array of generated images */
  images: GeneratedImage[];
  /** Generation metadata */
  metadata: GenerationMetadata;
  /** Error message if generation failed */
  error?: string;
}

/**
 * Optimized prompt result from prompt optimizer
 */
export interface OptimizedPrompt {
  /** The optimized positive prompt */
  prompt: string;
  /** The negative prompt to avoid unwanted elements */
  negativePrompt: string;
}

