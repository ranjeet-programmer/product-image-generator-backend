import https from 'https';
import { API, AI_PARAMS } from './constants';

/**
 * Custom error class for HuggingFace API errors
 */
class HuggingFaceError extends Error {
  statusCode?: number;
  estimatedTime?: number;

  constructor(message: string, statusCode?: number, estimatedTime?: number) {
    super(message);
    this.name = 'HuggingFaceError';
    this.statusCode = statusCode;
    this.estimatedTime = estimatedTime;
  }
}

/**
 * HuggingFace API configuration
 */
const HF_CONFIG = {
  MODEL: API.HUGGINGFACE_MODEL,
  API_URL: `https://router.huggingface.co/hf-inference/models/${API.HUGGINGFACE_MODEL}`,
} as const;

/**
 * Options for generating images
 */
interface GenerateImageOptions {
  /** The positive prompt describing what to generate */
  prompt: string;
  /** The negative prompt describing what to avoid */
  negativePrompt: string;
  /** Number of images to generate */
  numImages: number;
  /** Image width in pixels */
  width: number;
  /** Image height in pixels */
  height: number;
}

/**
 * Calls the HuggingFace Inference API to generate a single image
 * 
 * @param prompt - Positive prompt for image generation
 * @param negativePrompt - Negative prompt to avoid unwanted elements
 * @returns Promise resolving to image buffer
 * @throws {HuggingFaceError} If API call fails or model is loading
 */
async function callHuggingFace(prompt: string, negativePrompt: string): Promise<Buffer> {
  const token = process.env.HUGGINGFACE_API_TOKEN;
  
  if (!token) {
    throw new HuggingFaceError(
      'HUGGINGFACE_API_TOKEN environment variable is not set. ' +
      'Get a free token at https://huggingface.co/settings/tokens'
    );
  }

  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      inputs: prompt,
      parameters: {
        negative_prompt: negativePrompt,
        guidance_scale: AI_PARAMS.GUIDANCE_SCALE,
        num_inference_steps: AI_PARAMS.INFERENCE_STEPS,
      },
    });

    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(HF_CONFIG.API_URL, options, (res) => {
      const chunks: Buffer[] = [];

      res.on('data', (chunk) => chunks.push(chunk));

      res.on('end', () => {
        const data = Buffer.concat(chunks);

        if (res.statusCode === 200) {
          // Success - data is the image binary
          resolve(data);
        } else if (res.statusCode === 503) {
          // Model is loading
          const response = JSON.parse(data.toString());
          const waitTime = response.estimated_time || AI_PARAMS.MODEL_LOADING_RETRY_DELAY_MS / 1000;
          reject(new HuggingFaceError(
            `Model is loading. Please wait ${Math.ceil(waitTime)} seconds and try again.`,
            503,
            waitTime
          ));
        } else {
          // Error
          let errorMessage = `HuggingFace API error: ${res.statusCode}`;
          try {
            const response = JSON.parse(data.toString());
            errorMessage = response.error || errorMessage;
          } catch {
            // Ignore JSON parse error
          }
          reject(new HuggingFaceError(errorMessage, res.statusCode));
        }
      });
    });

    req.on('error', (err) => reject(new HuggingFaceError(err.message)));
    req.write(payload);
    req.end();
  });
}

/**
 * Generates multiple images using HuggingFace's inference API
 * 
 * Images are generated sequentially to respect API rate limits.
 * If the first image fails, the entire operation fails.
 * If subsequent images fail, they are skipped and generation continues.
 * 
 * @param options - Image generation options
 * @returns Promise resolving to array of image buffers
 * @throws {HuggingFaceError} If the first image generation fails
 */
export async function generateImages(options: GenerateImageOptions): Promise<Buffer[]> {
  const { prompt, negativePrompt, numImages } = options;

  console.log(`[AI Provider] Generating ${numImages} image(s) with model: ${HF_CONFIG.MODEL}`);

  const imageBuffers: Buffer[] = [];

  // Generate images sequentially (HuggingFace free API doesn't support batch)
  for (let i = 0; i < numImages; i++) {
    console.log(`[AI Provider] Generating image ${i + 1}/${numImages}...`);
    
    try {
      const imageBuffer = await callHuggingFace(prompt, negativePrompt);
      imageBuffers.push(imageBuffer);
      console.log(`[AI Provider] Image ${i + 1}/${numImages} generated successfully`);
    } catch (error) {
      console.error(`[AI Provider] Failed to generate image ${i + 1}:`, error);
      
      // If the first image fails, throw the error to fail the entire job
      if (i === 0) {
        throw error;
      }
      
      // For subsequent images, continue with remaining images
      console.warn(`[AI Provider] Skipping image ${i + 1}, continuing with remaining images`);
    }
  }

  console.log(`[AI Provider] Successfully generated ${imageBuffers.length}/${numImages} images`);
  return imageBuffers;
}

/**
 * Parses a resolution string into width and height
 * 
 * @param resolution - Resolution string in format "WIDTHxHEIGHT" (e.g., "1024x1024")
 * @returns Object with width and height properties
 */
export function parseResolution(resolution: string): { width: number; height: number } {
  const [width, height] = resolution.split('x').map(Number);
  return { width: width || 1024, height: height || 1024 };
}

