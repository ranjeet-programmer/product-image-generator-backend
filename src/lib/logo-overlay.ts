import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { LogoSettings, LogoPosition } from '../types';
import { LOGO } from './constants';

/**
 * Coordinates for logo positioning
 */
interface Position {
  left: number;
  top: number;
}

/**
 * Calculates the position coordinates for logo placement
 * 
 * @param imageWidth - Width of the base image
 * @param imageHeight - Height of the base image
 * @param logoWidth - Width of the logo
 * @param logoHeight - Height of the logo
 * @param position - Desired position
 * @param offsetX - Optional horizontal offset in pixels
 * @param offsetY - Optional vertical offset in pixels
 * @returns Position coordinates {left, top}
 */
function calculatePosition(
  imageWidth: number,
  imageHeight: number,
  logoWidth: number,
  logoHeight: number,
  position: LogoPosition,
  offsetX: number = 0,
  offsetY: number = 0
): Position {
  const padding = LOGO.EDGE_PADDING;
  let left = 0;
  let top = 0;

  switch (position) {
    case 'center':
      left = (imageWidth - logoWidth) / 2;
      top = (imageHeight - logoHeight) / 2;
      break;
    
    case 'top-left':
      left = padding;
      top = padding;
      break;
    
    case 'top-center':
      left = (imageWidth - logoWidth) / 2;
      top = padding;
      break;
    
    case 'top-right':
      left = imageWidth - logoWidth - padding;
      top = padding;
      break;
    
    case 'middle-left':
      left = padding;
      top = (imageHeight - logoHeight) / 2;
      break;
    
    case 'middle-right':
      left = imageWidth - logoWidth - padding;
      top = (imageHeight - logoHeight) / 2;
      break;
    
    case 'bottom-left':
      left = padding;
      top = imageHeight - logoHeight - padding;
      break;
    
    case 'bottom-center':
      left = (imageWidth - logoWidth) / 2;
      top = imageHeight - logoHeight - padding;
      break;
    
    case 'bottom-right':
      left = imageWidth - logoWidth - padding;
      top = imageHeight - logoHeight - padding;
      break;
  }

  return {
    left: Math.round(left + offsetX),
    top: Math.round(top + offsetY),
  };
}

/**
 * Resizes a logo to the specified percentage of image width
 * 
 * @param logoBuffer - Logo image buffer
 * @param imageWidth - Base image width
 * @param sizePercent - Size as percentage of image width (5-50)
 * @returns Resized logo buffer and dimensions
 */
async function resizeLogo(
  logoBuffer: Buffer,
  imageWidth: number,
  sizePercent: number
): Promise<{ buffer: Buffer; width: number; height: number }> {
  // Calculate target width
  const targetWidth = Math.round((imageWidth * sizePercent) / 100);
  
  // Resize maintaining aspect ratio
  const resized = sharp(logoBuffer).resize(targetWidth, null, {
    fit: 'inside',
    withoutEnlargement: false,
  });
  
  const metadata = await resized.metadata();
  const buffer = await resized.toBuffer();
  
  return {
    buffer,
    width: metadata.width || targetWidth,
    height: metadata.height || targetWidth,
  };
}

/**
 * Applies opacity and rotation to a logo
 * 
 * @param logoBuffer - Logo image buffer
 * @param opacity - Opacity percentage (0-100)
 * @param rotation - Rotation in degrees (optional)
 * @returns Processed logo buffer
 */
async function processLogoEffects(
  logoBuffer: Buffer,
  opacity: number,
  rotation?: number
): Promise<Buffer> {
  let pipeline = sharp(logoBuffer);
  
  // Apply rotation if specified
  if (rotation && rotation !== 0) {
    pipeline = pipeline.rotate(rotation, {
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });
  }
  
  // Apply opacity
  if (opacity < 100) {
    const opacityValue = opacity / 100;
    pipeline = pipeline.composite([{
      input: Buffer.from([255, 255, 255, Math.round(opacityValue * 255)]),
      raw: {
        width: 1,
        height: 1,
        channels: 4,
      },
      tile: true,
      blend: 'dest-in',
    }]);
  }
  
  return pipeline.png().toBuffer();
}

/**
 * Creates a text watermark as a PNG buffer
 * 
 * @param text - Text content
 * @param imageWidth - Base image width for sizing
 * @param sizePercent - Size percentage
 * @param color - Text color
 * @param fontFamily - Font family
 * @returns Text watermark buffer
 */
async function createTextWatermark(
  text: string,
  imageWidth: number,
  sizePercent: number,
  color: string = LOGO.TEXT_DEFAULT_COLOR,
  fontFamily: string = LOGO.TEXT_DEFAULT_FONT
): Promise<Buffer> {
  // Calculate font size based on image width and size percent
  const fontSize = Math.round((imageWidth * sizePercent) / 100 * 0.5);
  
  // Create SVG with text
  const svg = `
    <svg width="${imageWidth}" height="${fontSize * 2}">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=${fontFamily.replace(' ', '+')}');
      </style>
      <text
        x="50%"
        y="50%"
        text-anchor="middle"
        dominant-baseline="middle"
        font-family="${fontFamily}, Arial, sans-serif"
        font-size="${fontSize}"
        font-weight="bold"
        fill="${color}"
        stroke="${LOGO.TEXT_STROKE_COLOR}"
        stroke-width="${LOGO.TEXT_STROKE_WIDTH}">
        ${text}
      </text>
    </svg>
  `;
  
  // Convert SVG to PNG
  return sharp(Buffer.from(svg))
    .png()
    .toBuffer();
}

/**
 * Applies an image logo to the base image
 * 
 * @param baseImageBuffer - Base image buffer
 * @param logoSettings - Logo configuration
 * @param logoPath - Path to logo file
 * @returns Final composited image buffer
 */
async function applyImageLogo(
  baseImageBuffer: Buffer,
  logoSettings: LogoSettings,
  logoPath: string
): Promise<Buffer> {
  console.log(`[Logo Overlay] Applying image logo from: ${logoPath}`);
  
  // Load base image metadata
  const baseImage = sharp(baseImageBuffer);
  const baseMetadata = await baseImage.metadata();
  
  if (!baseMetadata.width || !baseMetadata.height) {
    throw new Error('Could not determine base image dimensions');
  }
  
  // Load and process logo
  const logoBuffer = fs.readFileSync(logoPath);
  const { buffer: resizedLogo, width: logoWidth, height: logoHeight } = await resizeLogo(
    logoBuffer,
    baseMetadata.width,
    logoSettings.size
  );
  
  // Apply effects (opacity and rotation)
  const processedLogo = await processLogoEffects(
    resizedLogo,
    logoSettings.opacity,
    logoSettings.rotation
  );
  
  // Get final logo dimensions after rotation
  const logoMetadata = await sharp(processedLogo).metadata();
  const finalLogoWidth = logoMetadata.width || logoWidth;
  const finalLogoHeight = logoMetadata.height || logoHeight;
  
  // Calculate position
  const position = calculatePosition(
    baseMetadata.width,
    baseMetadata.height,
    finalLogoWidth,
    finalLogoHeight,
    logoSettings.position,
    logoSettings.offsetX,
    logoSettings.offsetY
  );
  
  console.log(
    `[Logo Overlay] Position: ${logoSettings.position} at (${position.left}, ${position.top}), ` +
    `Size: ${logoSettings.size}%, Opacity: ${logoSettings.opacity}%`
  );
  
  // Composite logo onto base image
  return baseImage
    .composite([{
      input: processedLogo,
      left: position.left,
      top: position.top,
      blend: 'over',
    }])
    .png()
    .toBuffer();
}

/**
 * Applies a text watermark to the base image
 * 
 * @param baseImageBuffer - Base image buffer
 * @param logoSettings - Logo configuration
 * @returns Final composited image buffer
 */
async function applyTextWatermark(
  baseImageBuffer: Buffer,
  logoSettings: LogoSettings
): Promise<Buffer> {
  if (!logoSettings.content) {
    throw new Error('Text content is required for text watermark');
  }
  
  console.log(`[Logo Overlay] Applying text watermark: "${logoSettings.content}"`);
  
  // Load base image metadata
  const baseImage = sharp(baseImageBuffer);
  const baseMetadata = await baseImage.metadata();
  
  if (!baseMetadata.width || !baseMetadata.height) {
    throw new Error('Could not determine base image dimensions');
  }
  
  // Create text watermark
  const textBuffer = await createTextWatermark(
    logoSettings.content,
    baseMetadata.width,
    logoSettings.size,
    logoSettings.textColor,
    logoSettings.fontFamily
  );
  
  // Apply effects
  const processedText = await processLogoEffects(
    textBuffer,
    logoSettings.opacity,
    logoSettings.rotation
  );
  
  // Get text dimensions
  const textMetadata = await sharp(processedText).metadata();
  const textWidth = textMetadata.width || 0;
  const textHeight = textMetadata.height || 0;
  
  // Calculate position
  const position = calculatePosition(
    baseMetadata.width,
    baseMetadata.height,
    textWidth,
    textHeight,
    logoSettings.position,
    logoSettings.offsetX,
    logoSettings.offsetY
  );
  
  console.log(
    `[Logo Overlay] Position: ${logoSettings.position} at (${position.left}, ${position.top}), ` +
    `Size: ${logoSettings.size}%, Opacity: ${logoSettings.opacity}%`
  );
  
  // Composite text onto base image
  return baseImage
    .composite([{
      input: processedText,
      left: position.left,
      top: position.top,
      blend: 'over',
    }])
    .png()
    .toBuffer();
}

/**
 * Main function to apply logo overlay to an image
 * 
 * Routes to appropriate handler based on logo type
 * 
 * @param baseImageBuffer - Base image buffer
 * @param logoSettings - Logo configuration
 * @param logoPath - Path to logo file (required for image logos)
 * @returns Final composited image buffer
 * @throws Error if logo settings are invalid or logo file not found
 */
export async function applyLogo(
  baseImageBuffer: Buffer,
  logoSettings: LogoSettings,
  logoPath?: string
): Promise<Buffer> {
  // Validate logo settings
  if (logoSettings.type === 'none') {
    console.log('[Logo Overlay] No logo to apply');
    return baseImageBuffer;
  }
  
  // Route to appropriate handler
  if (logoSettings.type === 'image') {
    if (!logoPath || !fs.existsSync(logoPath)) {
      throw new Error('Logo file path is required and must exist for image logos');
    }
    return applyImageLogo(baseImageBuffer, logoSettings, logoPath);
  } else if (logoSettings.type === 'text') {
    return applyTextWatermark(baseImageBuffer, logoSettings);
  }
  
  throw new Error(`Unsupported logo type: ${logoSettings.type}`);
}

/**
 * Validates logo file format
 * 
 * @param filename - Logo filename
 * @returns true if format is supported
 */
export function isValidLogoFormat(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase().slice(1);
  return LOGO.SUPPORTED_FORMATS.includes(ext as any);
}
