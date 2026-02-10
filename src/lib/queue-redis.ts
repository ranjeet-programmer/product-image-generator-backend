import { Queue, Worker, QueueEvents, Job } from 'bullmq';
import IORedis from 'ioredis';
import { GenerateRequest, GeneratedImage } from '../types';
import { generateImages, parseResolution } from './ai-provider';
import { saveImagesLocally } from './image-storage';
import { optimizePrompt } from './prompt-optimizer';
import { QUEUE, IMAGE_LIMITS } from './constants';

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
 * 5. Return saved image metadata and prompt
 */
export const worker = new Worker<JobData, WorkerResult>(
  QUEUE.NAME,
  async (job: Job<JobData>) => {
    const jobId = job.id || 'unknown';
    const descPreview = job.data.description.substring(0, 50);
    
    console.log(`[Worker] Starting job ${jobId}: "${descPreview}..."`);

    const { description, category, style, angle, color, settings } = job.data;
    
    // Apply defaults for optional parameters
    const safeCategory = category || 'other';
    const safeStyle = style || 'studio';
    const safeAngle = angle || 'front';
    const numImages = settings?.numImages || IMAGE_LIMITS.DEFAULT_IMAGES;
    const resolution = settings?.resolution || IMAGE_LIMITS.DEFAULT_RESOLUTION;

    console.log(`[Worker] Job ${jobId} settings: ${numImages} images at ${resolution} [${safeCategory}/${safeStyle}/${safeAngle}]`);

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
    const savedImages = await saveImagesLocally(imageBuffers);

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

