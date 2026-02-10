import { Router, Request, Response } from 'express';
import { GenerateRequest, GenerateResponse, GenerationMetadata } from '../types';
import { imageQueue, queueEvents } from '../lib/queue-redis';
import { validateGenerateRequest, ValidationError, getDescriptionPreview } from '../lib/validation';
import { IMAGE_LIMITS } from '../lib/constants';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * Creates an error response with consistent structure
 * 
 * @param error - Error message
 * @param processingTime - Time taken before error occurred
 * @returns Formatted error response
 */
function createErrorResponse(error: string, processingTime: number = 0): GenerateResponse {
  return {
    success: false,
    images: [],
    metadata: {
      prompt: '',
      settings: {
        numImages: IMAGE_LIMITS.DEFAULT_IMAGES,
        resolution: IMAGE_LIMITS.DEFAULT_RESOLUTION,
      },
    },
    error,
  };
}

/**
 * Creates a success response with consistent structure
 * 
 * @param images - Generated images array
 * @param prompt - The optimized prompt used
 * @param numImages - Number of images generated
 * @param resolution - Resolution used
 * @returns Formatted success response
 */
function createSuccessResponse(
  images: any[],
  prompt: string,
  numImages: 1 | 2 | 3 | 4,
  resolution: '512x512' | '768x768' | '1024x1024'
): GenerateResponse {
  return {
    success: true,
    images,
    metadata: {
      prompt,
      settings: {
        numImages,
        resolution,
      },
    },
  };
}

/**
 * POST /api/generate
 * Generate product images from description
 * 
 * Validates the request, queues the image generation job,
 * and waits for completion before returning the results.
 * 
 * @route POST /api/generate
 * @body {GenerateRequest} request - Generation request parameters
 * @returns {GenerateResponse} Generated images and metadata
 */
router.post('/', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    // Validate and sanitize request
    const validatedRequest = validateGenerateRequest(req.body);

    // Extract settings with defaults
    const category = validatedRequest.category || 'other';
    const style = validatedRequest.style || 'studio';
    const angle = validatedRequest.angle || 'front';
    const color = validatedRequest.color;
    const numImages = validatedRequest.settings?.numImages || IMAGE_LIMITS.DEFAULT_IMAGES;
    const resolution = validatedRequest.settings?.resolution || IMAGE_LIMITS.DEFAULT_RESOLUTION;

    // Log generation request
    const descPreview = getDescriptionPreview(validatedRequest.description);
    console.log(
      `[Generate] Requesting ${numImages} image(s): "${descPreview}"` +
      `${color ? ` (${color})` : ''} [${category}/${style}/${angle}]`
    );

    // Add job to Redis Queue with unique ID
    const job = await imageQueue.add('generate', {
      ...validatedRequest,
      requestId: uuidv4(),
      category,
      style,
      angle,
      settings: { numImages, resolution },
    });

    console.log(`[Generate] Job ${job.id} queued. Waiting for completion...`);

    // Wait for the worker to finish this specific job (synchronous behavior)
    const result = await job.waitUntilFinished(queueEvents);

    const processingTime = Date.now() - startTime;
    console.log(`[Generate] Job ${job.id} completed in ${processingTime}ms`);

    // Extract data from worker result
    const { images, prompt } = result;

    // Return success response with metadata structure
    return res.json(createSuccessResponse(images, prompt, numImages, resolution));

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    // Handle validation errors
    if (error instanceof ValidationError) {
      console.warn(`[Generate] Validation error: ${error.message}`);
      return res.status(400).json(createErrorResponse(error.message, processingTime));
    }

    // Handle general errors
    console.error('[Generate] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return res.status(500).json(createErrorResponse(errorMessage, processingTime));
  }
});

export default router;

