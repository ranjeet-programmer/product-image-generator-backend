import { Router, Request, Response } from 'express';
import { GenerateRequest, GenerateResponse } from '../types';
import { imageQueue, queueEvents } from '../lib/queue-redis';
import { v4 as uuidv4 } from 'uuid';

const router = Router();


/**
 * POST /api/generate
 * Generate product images from description
 */
router.post('/', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const body: GenerateRequest = req.body;

    // Validate required fields
    if (!body.description || typeof body.description !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Description is required and must be a string',
        images: [],
        prompt: '',
        negativePrompt: '',
        processingTime: 0,
      } as GenerateResponse);
    }

    if (body.description.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Description must be at least 3 characters long',
        images: [],
        prompt: '',
        negativePrompt: '',
        processingTime: 0,
      } as GenerateResponse);
    }

    // Extract settings with defaults
    const category = body.category || 'other';
    const style = body.style || 'studio';
    const angle = body.angle || 'front';
    const color = body.color; // Optional color specification
    const numImages = body.settings?.numImages || 1;
    const resolution = body.settings?.resolution || '1024x1024';

    // Validate numImages
    if (numImages < 1 || numImages > 4) {
      return res.status(400).json({
        success: false,
        error: 'Number of images must be between 1 and 4',
        images: [],
        prompt: '',
        negativePrompt: '',
        processingTime: 0,
      } as GenerateResponse);
    }

    console.log(`Generating ${numImages} image(s) for: "${body.description.split('\n')[0]}"${color ? ` in ${color}` : ''}`);

    // Add job to Redis Queue
    const job = await imageQueue.add('generate', {
      ...body,
      requestId: uuidv4(),
    });

    console.log(`Job added to Redis Queue: ${job.id}. Waiting for completion...`);

    // Wait for the worker to finish this specific job
    // This keeps the API synchronous as requested
    const savedImages = await job.waitUntilFinished(queueEvents);

    const processingTime = Date.now() - startTime;
    console.log(`Job ${job.id} finished in ${processingTime}ms`);

    // Return success response
    return res.json({
      success: true,
      images: savedImages,
      prompt: "Processed by Worker", 
      negativePrompt: "Processed by Worker", 
      processingTime,
    } as GenerateResponse);

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Generation error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return res.status(500).json({
      success: false,
      error: errorMessage,
      images: [],
      prompt: '',
      negativePrompt: '',
      processingTime,
    } as GenerateResponse);
  }
});

export default router;
