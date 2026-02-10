import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { GeneratedImage } from '../types';
import { STORAGE } from './constants';

/**
 * Full path to the generated images directory
 */
const GENERATED_DIR = path.join(process.cwd(), STORAGE.GENERATED_DIR);

/**
 * Ensures the generated images directory exists
 * Creates the directory with all necessary parent directories if it doesn't exist
 */
export function ensureGeneratedDir(): void {
  if (!fs.existsSync(GENERATED_DIR)) {
    fs.mkdirSync(GENERATED_DIR, { recursive: true });
    console.log(`[Storage] Created directory: ${GENERATED_DIR}`);
  }
}

/**
 * Generates a unique filename for an image
 * Format: img_{timestamp}_{batchId}_{index}.png
 * 
 * @param timestamp - Unix timestamp
 * @param batchId - Unique batch identifier
 * @param index - Image index in batch
 * @returns Generated filename
 */
function generateFilename(timestamp: number, batchId: string, index: number): string {
  return `img_${timestamp}_${batchId}_${index}${STORAGE.FILE_EXTENSION}`;
}

/**
 * Saves image buffers to the local filesystem
 * 
 * Each image is saved with a unique filename and its metadata is returned.
 * If an image fails to save, it's logged but doesn't stop the process.
 * 
 * @param imageBuffers - Array of image buffers to save
 * @returns Array of saved image metadata (URL and filename)
 */
export async function saveImagesLocally(imageBuffers: Buffer[]): Promise<GeneratedImage[]> {
  ensureGeneratedDir();

  const timestamp = Date.now();
  const batchId = uuidv4().slice(0, STORAGE.FILENAME_BATCH_ID_LENGTH);

  console.log(`[Storage] Saving ${imageBuffers.length} image(s) with batch ID: ${batchId}`);

  const savedImages: GeneratedImage[] = [];

  for (let i = 0; i < imageBuffers.length; i++) {
    const buffer = imageBuffers[i];
    const filename = generateFilename(timestamp, batchId, i);
    const filePath = path.join(GENERATED_DIR, filename);

    try {
      fs.writeFileSync(filePath, buffer);
      savedImages.push({
        url: `${STORAGE.URL_PREFIX}/${filename}`,
        filename,
      });
      console.log(`[Storage] Saved image ${i + 1}/${imageBuffers.length}: ${filename}`);
    } catch (error) {
      console.error(`[Storage] Failed to save image ${i + 1}:`, error);
      // Continue with other images even if one fails
    }
  }

  console.log(`[Storage] Successfully saved ${savedImages.length}/${imageBuffers.length} images`);
  return savedImages;
}

/**
 * Gets the full file system path to a generated image
 * 
 * @param filename - Image filename
 * @returns Absolute file path
 */
export function getImagePath(filename: string): string {
  return path.join(GENERATED_DIR, filename);
}

/**
 * Deletes a generated image from the filesystem
 * 
 * @param filename - Image filename to delete
 * @returns true if deleted successfully, false otherwise
 */
export function deleteImage(filename: string): boolean {
  try {
    const filePath = getImagePath(filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[Storage] Deleted image: ${filename}`);
      return true;
    }
    console.warn(`[Storage] Image not found for deletion: ${filename}`);
    return false;
  } catch (error) {
    console.error(`[Storage] Failed to delete image ${filename}:`, error);
    return false;
  }
}

/**
 * Lists all generated PNG images in the storage directory
 * 
 * @returns Array of image filenames
 */
export function listGeneratedImages(): string[] {
  ensureGeneratedDir();
  const files = fs.readdirSync(GENERATED_DIR)
    .filter((file) => file.endsWith(STORAGE.FILE_EXTENSION));
  
  console.log(`[Storage] Found ${files.length} generated images`);
  return files;
}

