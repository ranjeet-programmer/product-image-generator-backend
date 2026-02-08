import { ProductCategory, ImageStyle, CameraAngle, OptimizedPrompt } from '../types';

// Style modifiers for different image styles
const STYLE_MODIFIERS: Record<ImageStyle, string> = {
  studio: 'studio lighting, softbox lighting, neutral background, sharp focus, professional studio setup',
  lifestyle: 'natural lighting, lifestyle setting, in-use context, realistic environment, candid feel',
  white_background: 'pure white background, e-commerce style, centered composition, clean and crisp',
  minimal: 'minimalist composition, clean lines, subtle shadows, simple elegant background',
  luxury: 'dramatic lighting, premium feel, high-end aesthetic, rich textures, sophisticated mood',
  flat_lay: 'top-down view, flat lay composition, organized arrangement, overhead shot',
};

// Camera angle modifiers
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

// Category-specific enhancements
const CATEGORY_ENHANCEMENTS: Record<ProductCategory, string> = {
  shoes: 'footwear photography, showing texture and detail, proper shoe positioning',
  clothing: 'fashion photography, fabric texture visible, proper draping',
  electronics: 'tech product photography, sleek and modern, showing device details',
  accessories: 'accessory photography, elegant presentation, detail-focused',
  furniture: 'interior photography, showing scale and proportion, lifestyle context',
  food: 'food photography, appetizing presentation, fresh and vibrant colors',
  beauty: 'beauty product photography, clean aesthetic, luxurious feel',
  sports: 'sports equipment photography, dynamic feel, action-oriented',
  other: 'professional product photography',
};

// Quality modifiers that are always added
const QUALITY_MODIFIERS = [
  '8K resolution',
  'high detail',
  'commercial photography',
  'professional lighting',
  'sharp focus',
  'photorealistic',
];

// Negative prompt to avoid common issues
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

/**
 * Optimizes a product description into an AI-ready prompt
 */
export function optimizePrompt(
  description: string,
  category: ProductCategory = 'other',
  style: ImageStyle = 'studio',
  angle: CameraAngle = 'front',
  color?: string
): OptimizedPrompt {
  // 1. Normalize newlines (handle escaped \n from JSON)
  const normalizedDesc = description.replace(/\\n/g, '\n');

  // 2. Split into lines and filter out technical specifications
  const lines = normalizedDesc
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const cleanLines = lines.filter(line => {
    // Filter out lines that look like material lists, print methods, or technical specs
    // Lines with '%' usually denote material composition
    // Lines with ';' often list variants
    // Lines starting with 'Print Method'
    if (line.includes('%') || line.includes(';') || line.startsWith('Print Method:')) return false;
    return true;
  });

  // 3. Take valuable content (first 2 paragraphs/lines max to avoid token limit and confusion)
  // Remove parenthetical content (often contains specific color lists like 'Antique Cherry Red')
  let relevantText = cleanLines
    .slice(0, 2)
    .join(' ')
    .replace(/\([^)]*\)/g, '')  // Remove (...)
    .replace(/\s+/g, ' ')       // Normalize spaces
    .trim();

  // 4. Construct the prompt
  // If color is specified, we want to strongly enforce it by placing it early
  const colorPrefix = color ? `${color} ` : '';
  
  // Use the category to ground the image content
  const categoryNoun = category === 'other' ? 'product' : category;

  // Pattern: "Professional product photography of [Color] [Description]"
  const basePrompt = `Professional product photography of ${colorPrefix}${relevantText}, ${categoryNoun}`.trim();

  // Get style modifier
  const styleModifier = STYLE_MODIFIERS[style];

  // Get angle modifier
  const angleModifier = ANGLE_MODIFIERS[angle];

  // Get category enhancement
  const categoryEnhancement = CATEGORY_ENHANCEMENTS[category];

  // Combine all parts
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
