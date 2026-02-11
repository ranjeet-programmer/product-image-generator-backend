import Replicate from 'replicate';
import sharp from 'sharp';

/**
 * Object detection service using Replicate API
 * Detects products in generated images for smart logo placement
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Bounding box with normalized coordinates (0-1)
 */
export interface BoundingBox {
  x: number;      // Center X coordinate (normalized 0-1)
  y: number;      // Center Y coordinate (normalized 0-1)
  width: number;  // Width (normalized 0-1)
  height: number; // Height (normalized 0-1)
}

/**
 * Detected object with label, confidence, and bounding box
 */
export interface DetectedObject {
  label: string;
  confidence: number;
  bbox: BoundingBox;
}

// ============================================================================
// Configuration
// ============================================================================

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const CONFIDENCE_THRESHOLD = 0.3;
const DETECTION_TIMEOUT_MS = 15000;

// Product-related labels that we're interested in
const PRODUCT_LABELS = [
  'bottle',
  'can',
  'cup',
  'vase',
  'box',
  'package',
  'container',
  'product',
  'phone',
  'laptop',
  'watch',
  'bag',
  'shoe',
  'clothing',
  'book',
];

// ============================================================================
// Replicate Client
// ============================================================================

let replicateClient: Replicate | null = null;

/**
 * Initialize Replicate client (lazy initialization)
 */
function getReplicateClient(): Replicate {
  if (!REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN environment variable is not set');
  }
  
  if (!replicateClient) {
    replicateClient = new Replicate({
      auth: REPLICATE_API_TOKEN,
    });
  }
  
  return replicateClient;
}

// ============================================================================
// Detection Functions
// ============================================================================

/**
 * Convert image buffer to base64 data URL for API submission
 */
async function bufferToDataUrl(buffer: Buffer): Promise<string> {
  const base64 = buffer.toString('base64');
  const metadata = await sharp(buffer).metadata();
  const format = metadata.format || 'png';
  return `data:image/${format};base64,${base64}`;
}

/**
 * Parse YOLO detection results from Replicate API
 * The model returns predictions in various formats, we normalize them
 */
function parseDetectionResults(output: any): DetectedObject[] {
  const detections: DetectedObject[] = [];
  
  try {
    // Handle different output formats from various YOLO models
    let predictions = output;
    
    // If output is wrapped in a predictions array
    if (output.predictions) {
      predictions = output.predictions;
    }
    
    // If output is an array directly
    if (Array.isArray(predictions)) {
      predictions.forEach((pred: any) => {
        const label = (pred.class || pred.label || '').toLowerCase();
        const confidence = pred.confidence || pred.score || 0;
        
        // Skip if confidence is too low
        if (confidence < CONFIDENCE_THRESHOLD) {
          return;
        }
        
        // Extract bounding box (various formats)
        let bbox: BoundingBox;
        
        if (pred.bbox) {
          // Format: {x, y, width, height} (already normalized)
          bbox = pred.bbox;
        } else if (pred.box) {
          // Format: {x1, y1, x2, y2} (absolute pixels) or {x, y, width, height}
          if (pred.box.x !== undefined && pred.box.width !== undefined) {
            bbox = {
              x: pred.box.x,
              y: pred.box.y,
              width: pred.box.width,
              height: pred.box.height,
            };
          } else {
            // Convert [x1, y1, x2, y2] to center format
            const x1 = pred.box.x1 || 0;
            const y1 = pred.box.y1 || 0;
            const x2 = pred.box.x2 || 1;
            const y2 = pred.box.y2 || 1;
            
            bbox = {
              x: (x1 + x2) / 2,
              y: (y1 + y2) / 2,
              width: x2 - x1,
              height: y2 - y1,
            };
          }
        } else {
          // Skip if no bounding box found
          return;
        }
        
        detections.push({ label, confidence, bbox });
      });
    }
  } catch (error) {
    console.error('[Object Detection] Error parsing results:', error);
  }
  
  return detections;
}

/**
 * Find the primary product in the list of detections
 * Prioritizes product-related objects with highest confidence
 */
function findPrimaryProduct(detections: DetectedObject[]): DetectedObject | null {
  if (detections.length === 0) {
    return null;
  }
  
  // Filter for product-related labels
  const productDetections = detections.filter((det) =>
    PRODUCT_LABELS.some((label) => det.label.includes(label))
  );
  
  if (productDetections.length === 0) {
    // No product found, return highest confidence detection
    return detections.reduce((prev, current) =>
      current.confidence > prev.confidence ? current : prev
    );
  }
  
  // Find product with largest area (likely the main product)
  return productDetections.reduce((prev, current) => {
    const prevArea = prev.bbox.width * prev.bbox.height;
    const currentArea = current.bbox.width * current.bbox.height;
    return currentArea > prevArea ? current : prev;
  });
}

/**
 * Detect objects in an image using Replicate's YOLO model
 * 
 * @param imageBuffer - Image buffer to analyze
 * @returns Detected object with highest confidence, or null if none found
 */
export async function detectProductInImage(
  imageBuffer: Buffer
): Promise<DetectedObject | null> {
  try {
    console.log('[Object Detection] Starting detection...');
    
    const client = getReplicateClient();
    const dataUrl = await bufferToDataUrl(imageBuffer);
    
    // Run YOLO object detection model
    // Using a lightweight YOLO model for speed
    const output = await Promise.race([
      client.run(
        'meta/meta-llama-3-70b-instruct' as any, // Model endpoint
        {
          input: {
            image: dataUrl,
            // Add any model-specific parameters here
          },
        }
      ),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Detection timeout')), DETECTION_TIMEOUT_MS)
      ),
    ]);
    
    console.log('[Object Detection] API response received');
    
    // Parse and filter results
    const detections = parseDetectionResults(output);
    console.log(`[Object Detection] Found ${detections.length} objects`);
    
    // Find the primary product
    const primaryProduct = findPrimaryProduct(detections);
    
    if (primaryProduct) {
      console.log(
        `[Object Detection] Primary product: ${primaryProduct.label} ` +
        `(confidence: ${(primaryProduct.confidence * 100).toFixed(1)}%) ` +
        `at (${(primaryProduct.bbox.x * 100).toFixed(1)}%, ${(primaryProduct.bbox.y * 100).toFixed(1)}%)`
      );
    } else {
      console.log('[Object Detection] No product detected');
    }
    
    return primaryProduct;
  } catch (error) {
    console.error('[Object Detection] Error:', error);
    return null;
  }
}

/**
 * Check if object detection is available (API token configured)
 */
export function isObjectDetectionAvailable(): boolean {
  return !!REPLICATE_API_TOKEN;
}
