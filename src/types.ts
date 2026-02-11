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
  /** Logo overlay settings (optional) */
  logo?: LogoSettings;
}

/**
 * Logo type options
 */
export type LogoType = 'none' | 'image' | 'text';

/**
 * Logo position on the image
 * Supports 9 standard positions plus center
 */
export type LogoPosition =
  | 'center'
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

/**
 * Logo overlay settings
 */
export interface LogoSettings {
  /** Type of logo to apply */
  type: LogoType;
  /** Content: URL for image logo, text for text watermark */
  content?: string;
  /** Position on the image */
  position: LogoPosition;
  /** Size as percentage of image width (1-100) */
  size: number;
  /** Opacity percentage (0-100) */
  opacity: number;
  /** Rotation in degrees (optional) */
  rotation?: number;
  /** Horizontal offset in pixels (optional) */
  offsetX?: number;
  /** Vertical offset in pixels (optional) */
  offsetY?: number;
  /** Text color for text watermarks (optional, default: white) */
  textColor?: string;
  /** Font family for text watermarks (optional, default: Arial) */
  fontFamily?: string;
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

