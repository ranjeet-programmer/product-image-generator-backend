// Product categories for better prompt generation
export type ProductCategory =
  | 'shoes'
  | 'clothing'
  | 'electronics'
  | 'accessories'
  | 'furniture'
  | 'food'
  | 'beauty'
  | 'sports'
  | 'other';

// Image styles
export type ImageStyle =
  | 'studio'           // Clean studio photography
  | 'lifestyle'        // Product in use/context
  | 'white_background' // E-commerce style
  | 'minimal'          // Minimalist aesthetic
  | 'luxury'           // Premium/high-end look
  | 'flat_lay';        // Top-down view

// Camera angles for product photography
export type CameraAngle =
  | 'front'            // Front view
  | 'side'             // Side view (profile)
  | 'back'             // Back view
  | 'top'              // Top-down view (bird's eye)
  | 'bottom'           // Bottom-up view
  | '45_degree'        // 45-degree angle (3/4 view)
  | 'close_up'         // Close-up detail shot
  | 'wide'             // Wide angle showing context
  | 'eye_level';       // Eye-level straight on

// Generation settings
export interface GenerationSettings {
  numImages?: 1 | 2 | 3 | 4;
  resolution?: '512x512' | '768x768' | '1024x1024';
}

// API Request
export interface GenerateRequest {
  description: string;
  category?: ProductCategory;
  style?: ImageStyle;
  angle?: CameraAngle;
  color?: string;              // Specific color for the product
  settings?: GenerationSettings;
}

// Generated image info
export interface GeneratedImage {
  url: string;
  filename: string;
}

// API Response
export interface GenerateResponse {
  success: boolean;
  images: GeneratedImage[];
  prompt: string;
  negativePrompt: string;
  processingTime: number;
  error?: string;
}

// Optimized prompt result
export interface OptimizedPrompt {
  prompt: string;
  negativePrompt: string;
}
