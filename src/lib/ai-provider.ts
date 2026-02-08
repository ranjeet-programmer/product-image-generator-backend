import https from 'https';

// HuggingFace model for image generation (free inference API)
const HF_MODEL = 'stabilityai/stable-diffusion-xl-base-1.0';
const HF_API_URL = `https://router.huggingface.co/hf-inference/models/${HF_MODEL}`;

interface GenerateImageOptions {
  prompt: string;
  negativePrompt: string;
  numImages: number;
  width: number;
  height: number;
}

/**
 * Call HuggingFace Inference API
 */
async function callHuggingFace(prompt: string, negativePrompt: string): Promise<Buffer> {
  const token = process.env.HUGGINGFACE_API_TOKEN;
  
  if (!token) {
    throw new Error('HUGGINGFACE_API_TOKEN environment variable is not set. Get a free token at https://huggingface.co/settings/tokens');
  }

  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      inputs: prompt,
      parameters: {
        negative_prompt: negativePrompt,
        guidance_scale: 7.5,
        num_inference_steps: 30,
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

    const req = https.request(HF_API_URL, options, (res) => {
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
          const waitTime = response.estimated_time || 20;
          reject(new Error(`Model is loading. Please wait ${Math.ceil(waitTime)} seconds and try again.`));
        } else {
          // Error
          let errorMessage = `HuggingFace API error: ${res.statusCode}`;
          try {
            const response = JSON.parse(data.toString());
            errorMessage = response.error || errorMessage;
          } catch {
            // Ignore JSON parse error
          }
          reject(new Error(errorMessage));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

/**
 * Generate images using HuggingFace's free inference API
 */
export async function generateImages(options: GenerateImageOptions): Promise<Buffer[]> {
  const { prompt, negativePrompt, numImages } = options;

  console.log(`Generating ${numImages} image(s) with HuggingFace...`);

  const imageBuffers: Buffer[] = [];

  // Generate images one at a time (HuggingFace free API doesn't support batch)
  for (let i = 0; i < numImages; i++) {
    console.log(`Generating image ${i + 1}/${numImages}...`);
    
    try {
      const imageBuffer = await callHuggingFace(prompt, negativePrompt);
      imageBuffers.push(imageBuffer);
    } catch (error) {
      console.error(`Failed to generate image ${i + 1}:`, error);
      // Continue with other images if one fails
      if (i === 0) {
        // If the first image fails, throw the error
        throw error;
      }
    }
  }

  return imageBuffers;
}

/**
 * Parse resolution string to width and height
 */
export function parseResolution(resolution: string): { width: number; height: number } {
  const [width, height] = resolution.split('x').map(Number);
  return { width: width || 1024, height: height || 1024 };
}
