import { ProductCategory, ImageStyle, CameraAngle, OptimizedPrompt } from '../types';
import { PROMPT } from './constants';

// ============================================================================
// Style Modifiers
// ============================================================================

/**
 * Style modifiers for different image styles
 * Defines the aesthetic and lighting approach for each style
 */
const STYLE_MODIFIERS: Record<ImageStyle, string> = {
  studio: 'studio lighting, softbox lighting, neutral background, sharp focus, professional studio setup',
  lifestyle: 'natural lighting, lifestyle setting, in-use context, realistic environment, candid feel',
  nature: 'natural outdoor setting, soft natural light, organic environment, fresh and vibrant',
  urban: 'urban environment, city backdrop, modern architecture, contemporary setting',
  minimalist: 'minimalist composition, clean lines, subtle shadows, simple elegant background',
  vintage: 'vintage aesthetic, retro styling, warm tones, nostalgic feel, classic photography',
};

// ============================================================================
// Camera Angle Modifiers
// ============================================================================

/**
 * Camera angle modifiers for different perspectives
 * Defines the viewing angle and composition for each shot type
 */
const ANGLE_MODIFIERS: Record<CameraAngle, string> = {
  front: 'front view, facing camera, straight on shot',
  side: 'side view, profile shot, lateral angle',
  back: 'back view, rear angle, showing back side',
  top: 'top-down view, bird\'s eye view, overhead shot, looking down',
  bottom: 'bottom-up view, low angle shot, looking up',
  '45_degree': '45-degree angle, three-quarter view, dynamic angle',
  close_up: 'close-up shot, macro detail, zoomed in on details',
  wide: 'wide angle shot, environmental context, showing surroundings',
  eye_level: 'eye-level shot, straight on, natural perspective',
};

// ============================================================================
// Category-Specific Enhancements
// ============================================================================

/**
 * Category-specific enhancements for different product types
 * Tailored descriptions to improve generation quality for each category
 */
const CATEGORY_ENHANCEMENTS: Record<ProductCategory, string> = {
  clothing: 'fashion photography, fabric texture visible, proper draping, apparel detail',
  footwear: 'footwear photography, showing texture and detail, proper shoe positioning',
  electronics: 'tech product photography, sleek and modern, showing device details, clean presentation',
  furniture: 'interior photography, showing scale and proportion, lifestyle context, home decor',
  beauty: 'beauty product photography, clean aesthetic, luxurious feel, cosmetic presentation',
  jewelry: 'jewelry photography, elegant presentation, detail-focused, precious metal and gems',
  'home-decor': 'home decor photography, interior styling, aesthetic presentation, decorative item',
  toy: 'toy photography, playful presentation, vibrant colors, engaging composition',
  other: 'professional product photography, commercial quality',
};

// ============================================================================
// Quality & Negative Prompts
// ============================================================================

/**
 * Quality modifiers that are always added to ensure high-quality output
 */
const QUALITY_MODIFIERS = [
  '8K resolution',
  'high detail',
  'commercial photography',
  'professional lighting',
  'sharp focus',
  'photorealistic',
];

/**
 * Negative prompt to avoid common undesirable elements
 */
const NEGATIVE_PROMPT = [
  'blurry',
  'distorted',
  'low quality',
  'watermark',
  'text',
  'logo',
  'deformed',
  'ugly',
  'bad anatomy',
  'disfigured',
  'poorly drawn',
  'mutation',
  'mutated',
  'extra limbs',
  'duplicate',
  'morbid',
  'out of frame',
  'cropped',
  'pixelated',
  'grainy',
  'noise',
].join(', ');

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Normalizes newlines in the description text
 * Handles escaped newlines from JSON input
 * 
 * @param description - Raw description text
 * @returns Normalized description with proper newlines
 */
function normalizeNewlines(description: string): string {
  return description.replace(/\\n/g, '\n');
}

/**
 * Filters out technical specification lines
 * Removes material percentages, variant lists, and print methods
 * 
 * @param lines - Array of description lines
 * @returns Filtered lines with only relevant content
 */
function filterTechnicalSpecs(lines: string[]): string[] {
  return lines.filter(line => {
    // Filter out lines with material composition (%), variants (;), or print methods
    if (line.includes('%') || line.includes(';') || line.startsWith('Print Method:')) {
      return false;
    }
    return true;
  });
}

/**
 * Removes parenthetical content from text
 * Often contains specific color lists or technical details
 * 
 * @param text - Input text
 * @returns Text with parenthetical content removed
 */
function removeParentheticals(text: string): string {
  return text.replace(/\([^)]*\)/g, '');
}

/**
 * Cleans and prepares the description text
 * Applies normalization, filtering, and cleaning operations
 * 
 * @param description - Raw product description
 * @returns Cleaned and relevant description text
 */
function cleanDescription(description: string): string {
  // Normalize newlines
  const normalized = normalizeNewlines(description);
  
  // Split into lines and filter
  const lines = normalized
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);
  
  // Filter out technical specifications
  const cleanLines = filterTechnicalSpecs(lines);
  
  // Take first N lines, remove parenthetical content, normalize spaces
  const relevantText = cleanLines
    .slice(0, PROMPT.MAX_DESCRIPTION_LINES)
    .join(PROMPT.DESCRIPTION_SEPARATOR)
    .replace(/\s+/g, ' ')
    .trim();
  
  return removeParentheticals(relevantText);
}

/**
 * Builds the base prompt from cleaned description and color
 * 
 * @param cleanedDescription - Cleaned product description
 * @param category - Product category
 * @param color - Optional color specification
 * @returns Base prompt string
 */
function buildBasePrompt(
  cleanedDescription: string,
  category: ProductCategory,
  color?: string
): string {
  const colorPrefix = color ? `${color} ` : '';
  const categoryNoun = category === 'other' ? 'product' : category;
  
  return `Professional product photography of ${colorPrefix}${cleanedDescription}, ${categoryNoun}`.trim();
}

// ============================================================================
// Main Export
// ============================================================================

/**
 * Optimizes a product description into an AI-ready prompt
 * 
 * Processes the description, applies category-specific enhancements,
 * style modifiers, and camera angle specifications to create a
 * comprehensive prompt for image generation.
 * 
 * @param description - Raw product description
 * @param category - Product category (defaults to 'other')
 * @param style - Image style (defaults to 'studio')
 * @param angle - Camera angle (defaults to 'front')
 * @param color - Optional specific color for the product
 * @returns Optimized prompt and negative prompt
 */
export function optimizePrompt(
  description: string,
  category: ProductCategory = 'other',
  style: ImageStyle = 'studio',
  angle: CameraAngle = 'front',
  color?: string
): OptimizedPrompt {
  // Clean and prepare the description
  const cleanedDescription = cleanDescription(description);
  
  // Build the base prompt
  const basePrompt = buildBasePrompt(cleanedDescription, category, color);
  
  // Get modifiers for selected options
  const styleModifier = STYLE_MODIFIERS[style];
  const angleModifier = ANGLE_MODIFIERS[angle];
  const categoryEnhancement = CATEGORY_ENHANCEMENTS[category];
  
  // Combine all parts into final prompt
  const promptParts = [
    basePrompt,
    angleModifier,
    styleModifier,
    categoryEnhancement,
    ...QUALITY_MODIFIERS,
  ];
  
  const optimizedPrompt = promptParts.join(', ');
  
  return {
    prompt: optimizedPrompt,
    negativePrompt: NEGATIVE_PROMPT,
  };
}

