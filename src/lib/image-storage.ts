import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { GeneratedImage } from '../types';

// Directory to store generated images
const GENERATED_DIR = path.join(process.cwd(), 'public', 'generated');

/**
 * Ensure the generated images directory exists
 */
export function ensureGeneratedDir(): void {
  if (!fs.existsSync(GENERATED_DIR)) {
    fs.mkdirSync(GENERATED_DIR, { recursive: true });
  }
}

/**
 * Save image buffers to local filesystem
 */
export async function saveImagesLocally(imageBuffers: Buffer[]): Promise<GeneratedImage[]> {
  ensureGeneratedDir();

  const timestamp = Date.now();
  const batchId = uuidv4().slice(0, 8);

  const savedImages: GeneratedImage[] = [];

  for (let i = 0; i < imageBuffers.length; i++) {
    const buffer = imageBuffers[i];
    const filename = `img_${timestamp}_${batchId}_${i}.png`;
    const filePath = path.join(GENERATED_DIR, filename);

    try {
      fs.writeFileSync(filePath, buffer);
      savedImages.push({
        url: `/generated/${filename}`,
        filename,
      });
      console.log(`Saved image: ${filename}`);
    } catch (error) {
      console.error(`Failed to save image ${i}:`, error);
      // Continue with other images even if one fails
    }
  }

  return savedImages;
}

/**
 * Get the full path to a generated image
 */
export function getImagePath(filename: string): string {
  return path.join(GENERATED_DIR, filename);
}

/**
 * Delete a generated image
 */
export function deleteImage(filename: string): boolean {
  try {
    const filePath = getImagePath(filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to delete image:', error);
    return false;
  }
}

/**
 * List all generated images
 */
export function listGeneratedImages(): string[] {
  ensureGeneratedDir();
  return fs.readdirSync(GENERATED_DIR).filter((file) => file.endsWith('.png'));
}
