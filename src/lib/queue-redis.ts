import { Queue, Worker, QueueEvents, Job } from 'bullmq';
import IORedis from 'ioredis';
import { GenerateRequest, GeneratedImage } from '../types';
import { generateImages, parseResolution } from './ai-provider';
import { saveImagesLocally, getImagePath, getLogoPath } from './image-storage';
import { optimizePrompt } from './prompt-optimizer';
import { applyLogo } from './logo-overlay';
import { QUEUE, IMAGE_LIMITS } from './constants';
import fs from 'fs';

/**
 * Redis connection configuration
 * Uses environment variable or defaults to localhost
 */
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  tls: redisUrl.startsWith('rediss://') ? {} : undefined,
});

/**
 * Job data structure extending the base request with tracking ID
 */
interface JobData extends GenerateRequest {
  requestId: string;
}

/**
 * Worker result structure containing images and prompt
 */
interface WorkerResult {
  images: GeneratedImage[];
  prompt: string;
}

/**
 * The Queue (Producer)
 * Handles adding image generation jobs to the queue
 */
export const imageQueue = new Queue(QUEUE.NAME, { connection });

/**
 * Queue Events handler
 * Used for waiting for job completion
 */
export const queueEvents = new QueueEvents(QUEUE.NAME, { connection });

/**
 * The Worker (Consumer)
 * Processes image generation jobs from the queue
 * 
 * Job processing flow:
 * 1. Extract and validate job parameters
 * 2. Optimize the prompt for AI generation
 * 3. Generate images using AI provider
 * 4. Save images to local storage
 * 5. Apply logo overlay if provided
 * 6. Return saved image metadata and prompt
 */
export const worker = new Worker<JobData, WorkerResult>(
  QUEUE.NAME,
  async (job: Job<JobData>) => {
    const jobId = job.id || 'unknown';
    const descPreview = job.data.description.substring(0, 50);
    
    console.log(`[Worker] Starting job ${jobId}: "${descPreview}..."`);

    const { description, category, style, angle, color, settings, logo } = job.data;
    
    // Apply defaults for optional parameters
    const safeCategory = category || 'other';
    const safeStyle = style || 'studio';
    const safeAngle = angle || 'front';
    const numImages = settings?.numImages || IMAGE_LIMITS.DEFAULT_IMAGES;
    const resolution = settings?.resolution || IMAGE_LIMITS.DEFAULT_RESOLUTION;

    console.log(`[Worker] Job ${jobId} settings: ${numImages} images at ${resolution} [${safeCategory}/${safeStyle}/${safeAngle}]`);
    if (logo && logo.type !== 'none') {
      console.log(`[Worker] Job ${jobId} logo: ${logo.type} at ${logo.position}`);
    }

    // Step 1: Optimize the prompt
    console.log(`[Worker] Job ${jobId}: Optimizing prompt...`);
    const { prompt, negativePrompt } = optimizePrompt(
      description, 
      safeCategory, 
      safeStyle, 
      safeAngle, 
      color
    );

    // Step 2: Parse resolution
    const { width, height } = parseResolution(resolution);

    // Step 3: Generate images using AI
    console.log(`[Worker] Job ${jobId}: Generating ${numImages} images...`);
    const imageBuffers = await generateImages({
      prompt,
      negativePrompt,
      numImages,
      width,
      height,
    });

    // Step 4: Save images locally
    console.log(`[Worker] Job ${jobId}: Saving ${imageBuffers.length} images...`);
    let savedImages = await saveImagesLocally(imageBuffers);

    // Step 5: Apply logo overlay if provided
    if (logo && logo.type !== 'none') {
      console.log(`[Worker] Job ${jobId}: Applying ${logo.type} logo...`);
      
      const finalImages: GeneratedImage[] = [];
      
      for (let i = 0; i < savedImages.length; i++) {
        const savedImage = savedImages[i];
        const imagePath = getImagePath(savedImage.filename);
        const imageBuffer = fs.readFileSync(imagePath);
        
        try {
          // Get logo path for image logos
          let logoPath: string | undefined;
          if (logo.type === 'image' && logo.content) {
            // Extract filename from URL or use as-is if it's already a filename
            const logoFilename = logo.content.startsWith('/') 
              ? logo.content.split('/').pop() || ''
              : logo.content;
            logoPath = getLogoPath(logoFilename);
          }
          
          // Apply logo
          const finalBuffer = await applyLogo(imageBuffer, logo, logoPath);
          
          // Save final composited image
          fs.writeFileSync(imagePath, finalBuffer);
          finalImages.push(savedImage);
          
          console.log(`[Worker] Job ${jobId}: Logo applied to image ${i + 1}/${savedImages.length}`);
        } catch (error) {
          console.error(`[Worker] Job ${jobId}: Failed to apply logo to image ${i + 1}:`, error);
          // Keep original image if logo application fails
          finalImages.push(savedImage);
        }
      }
      
      savedImages = finalImages;
    }

    console.log(`[Worker] Job ${jobId} completed: ${savedImages.length} images saved`);

    // Return both images and prompt for frontend display
    return {
      images: savedImages,
      prompt,
    };
  },
  { 
    connection,
    concurrency: QUEUE.CONCURRENCY,
    limiter: {
      max: QUEUE.RATE_LIMIT_MAX,
      duration: QUEUE.RATE_LIMIT_DURATION_MS,
    }
  }
);

// Worker event handlers
worker.on('completed', (job: any) => {
  console.log(`[Worker] ✓ Job ${job.id} completed successfully`);
});

worker.on('failed', (job: any, err: any) => {
  console.error(`[Worker] ✗ Job ${job?.id} failed:`, err.message);
});

worker.on('error', (err: any) => {
  console.error(`[Worker] Worker error:`, err);
});

console.log(`[Worker] Ready and listening for jobs on queue: "${QUEUE.NAME}"`);

