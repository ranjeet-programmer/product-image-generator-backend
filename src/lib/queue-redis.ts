import { Queue, Worker, QueueEvents, Job } from 'bullmq';
import IORedis from 'ioredis';
import { GenerateRequest, GeneratedImage } from '../types';
import { generateImages, parseResolution } from './ai-provider';
import { saveImagesLocally } from './image-storage';
import { optimizePrompt } from './prompt-optimizer';

// Redis connection - Use environment variable or default to localhost
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  tls: redisUrl.startsWith('rediss://') ? {} : undefined,
});

const QUEUE_NAME = 'image-generation';

// 1. The Queue (Producer)
export const imageQueue = new Queue(QUEUE_NAME, { connection });

// 2. Queue Events (For waiting for completion)
export const queueEvents = new QueueEvents(QUEUE_NAME, { connection });

// Define the job data structure
interface JobData extends GenerateRequest {
  requestId: string;
}

// 3. The Worker (Consumer)
// This processes jobs from Redis
export const worker = new Worker<JobData, GeneratedImage[]>(
  QUEUE_NAME,
  async (job: Job<JobData>) => {
    console.log(`[Worker] Starting job ${job.id} for: ${job.data.description.substring(0, 20)}...`);

    const { description, category, style, angle, color, settings } = job.data;
    
    // Defaults matching the route logic
    const safeCategory = category || 'other';
    const safeStyle = style || 'studio';
    const safeAngle = angle || 'front';
    const numImages = settings?.numImages || 1;
    const resolution = settings?.resolution || '1024x1024';

    // 1. Optimize Prompt
    const { prompt, negativePrompt } = optimizePrompt(
      description, 
      safeCategory, 
      safeStyle, 
      safeAngle, 
      color
    );

    // 2. Parse Resolution
    const { width, height } = parseResolution(resolution);

    // 3. Generate
    console.log(`[Worker] Calling AI for Job ${job.id}...`);
    const imageBuffers = await generateImages({
      prompt,
      negativePrompt,
      numImages,
      width,
      height,
    });

    // 4. Save
    console.log(`[Worker] Saving ${imageBuffers.length} images for Job ${job.id}...`);
    const savedImages = await saveImagesLocally(imageBuffers);

    // Pass metadata back as result if needed, or just images
    return savedImages;
  },
  { 
    connection,
    concurrency: 1, // Strict limit of 1 concurrent job to respect Free Tier API
    limiter: {
      max: 5,       // Max 5 jobs
      duration: 60000 // Per 60 seconds (Rate limiting)
    }
  }
);

worker.on('completed', (job: any) => {
  console.log(`[Worker] Job ${job.id} completed!`);
});

worker.on('failed', (job: any, err: any) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err);
});
