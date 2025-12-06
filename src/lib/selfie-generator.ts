/**
 * Selfie generator service using Gemini 3 Pro Image (Nano Banana Pro).
 * Composites user photos into Street View backgrounds to create AI-generated souvenirs.
 *
 * @module selfie-generator
 */

import { GoogleGenAI, Modality } from "@google/genai";

/**
 * Configuration options for the SelfieGenerator.
 */
export type SelfieGeneratorConfig = {
  /** Gemini API key */
  apiKey: string;
};

/**
 * Available styles for selfie generation.
 */
export type SelfieStyle = "polaroid" | "vintage" | "professional" | "fun" | "natural";

/**
 * Output resolution options for selfie generation.
 * Nano Banana Pro supports 1K, 2K, and 4K output.
 */
export type SelfieResolution = "1k" | "2k" | "4k";

/**
 * Options for generating a selfie composite.
 */
export type SelfieOptions = {
  /** User's photo as base64 encoded string (without data URL prefix) */
  userPhotoBase64: string;
  /** Street View background as base64 encoded string (without data URL prefix) */
  backgroundBase64: string;
  /** Style modifier for the generated image */
  style?: SelfieStyle;
  /** MIME type of the user photo (default: "image/jpeg") */
  userPhotoMimeType?: string;
  /** MIME type of the background (default: "image/jpeg") */
  backgroundMimeType?: string;
  /** Output resolution (default: "2k") */
  resolution?: SelfieResolution;
};

/**
 * Result of a selfie generation attempt.
 */
export type SelfieResult = {
  /** Whether the generation was successful */
  success: boolean;
  /** Generated image as base64 string (without data URL prefix) */
  imageBase64?: string;
  /** MIME type of the generated image */
  mimeType?: string;
  /** Error message if generation failed */
  error?: string;
};

/**
 * Style-specific prompt instructions for selfie generation.
 */
const STYLE_INSTRUCTIONS: Record<SelfieStyle, string> = {
  polaroid: `
STYLE: Polaroid Photo
- Add a white polaroid-style frame around the image
- Apply a slight warm, nostalgic color cast
- Add subtle vignetting at the corners
- Include slight film grain for authenticity
- The frame should have slight texture like real polaroid paper`,

  vintage: `
STYLE: Vintage Photography
- Apply a warm, sepia-toned color grade
- Add subtle film grain and occasional light leaks
- Reduce contrast slightly for a faded, nostalgic look
- Add gentle vignetting around the edges
- Colors should feel muted and dreamlike`,

  professional: `
STYLE: Professional Portrait
- Maintain clean, crisp image quality
- Apply subtle professional color grading with proper white balance
- Ensure perfect edge integration with no visible compositing artifacts
- Output at maximum quality with sharp details
- The person should look naturally placed, as if professionally photographed on location`,

  fun: `
STYLE: Fun Travel Photo
- Bright, vibrant colors with slightly enhanced saturation
- Clean, Instagram-worthy aesthetic
- High contrast for visual impact
- Perfect for social media sharing
- The mood should feel exciting and adventurous`,

  natural: `
STYLE: Natural Photograph
- Match the photographic style of the background exactly
- No additional filters, frames, or effects
- Seamless integration that looks like an original unedited photo
- Lighting, color temperature, and grain should match the scene perfectly
- The result should be indistinguishable from a real photo taken at the location`
};

/**
 * Base prompt for all selfie generation requests.
 * Defines the core requirements for photo compositing.
 */
const BASE_PROMPT = `You are an expert photo compositor. Your task is to seamlessly insert the person from the first image into the scene shown in the second image.

CRITICAL REQUIREMENTS:

1. PRESERVE IDENTITY: The person's face, features, expression, and overall appearance must remain exactly as shown in the original photo. Do not alter, distort, beautify, or "improve" their appearance in any way. This is the most important requirement.

2. MATCH LIGHTING: Carefully analyze the lighting in the background scene:
   - Determine if it's sunny, overcast, golden hour, indoor, etc.
   - Apply matching lighting to the person including:
     - Correct shadow direction and intensity
     - Appropriate highlights and reflections
     - Matching color temperature (warm/cool)
   - Ambient occlusion where the person meets the ground

3. CORRECT SCALE AND PERSPECTIVE: 
   - Position the person as if standing approximately 2-3 meters from the camera
   - Match the perspective of the scene (vanishing points, horizon line)
   - Ensure proportions are realistic relative to visible objects in the scene
   - Feet should appear to touch the ground naturally

4. NATURAL INTEGRATION:
   - The person should appear naturally within the scene
   - Add appropriate environmental effects (atmospheric haze if distant, etc.)
   - Blend edges seamlessly without visible cutout artifacts
   - Consider depth of field to match the background

5. OUTPUT QUALITY:
   - Generate a high-quality, artifact-free image
   - Resolution should be suitable for printing or high-quality digital display
   - No visible compression artifacts, banding, or noise patterns`;

/**
 * SelfieGenerator creates AI-composited images using Gemini 3 Pro Image.
 * Takes a user's photo and a Street View background and generates a realistic
 * composite that appears as if the user was actually at the location.
 *
 * @example
 * ```typescript
 * const generator = new SelfieGenerator({
 *   apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY!
 * });
 *
 * const result = await generator.generateSelfie({
 *   userPhotoBase64: userPhoto,
 *   backgroundBase64: streetViewImage,
 *   style: "polaroid"
 * });
 *
 * if (result.success && result.imageBase64) {
 *   displayImage(`data:${result.mimeType};base64,${result.imageBase64}`);
 * }
 * ```
 */
export class SelfieGenerator {
  /** Google GenAI SDK instance */
  private ai: GoogleGenAI;

  /**
   * Creates a new SelfieGenerator instance.
   *
   * @param config - Configuration options
   * @throws {Error} If API key is not provided
   */
  constructor(config: SelfieGeneratorConfig) {
    if (!config.apiKey || config.apiKey.trim() === "") {
      throw new Error("Gemini API key is required for selfie generation");
    }

    this.ai = new GoogleGenAI({ apiKey: config.apiKey });
  }

  /**
   * Generates a selfie composite from a user photo and background image.
   * Uses Nano Banana Pro (gemini-3-pro-image-preview) as specified in the technical spec.
   *
   * @param options - Generation options including images, style, and resolution
   * @returns Promise resolving to the generation result
   */
  async generateSelfie(options: SelfieOptions): Promise<SelfieResult> {
    const {
      userPhotoBase64,
      backgroundBase64,
      style = "natural",
      userPhotoMimeType = "image/jpeg",
      backgroundMimeType = "image/jpeg",
      resolution = "2k"
    } = options;

    // Validate inputs
    if (!userPhotoBase64 || userPhotoBase64.trim() === "") {
      return {
        success: false,
        error: "User photo is required"
      };
    }

    if (!backgroundBase64 || backgroundBase64.trim() === "") {
      return {
        success: false,
        error: "Background image is required"
      };
    }

    // Build the complete prompt with resolution hint
    const prompt = this.buildPrompt(style, resolution);

    try {
      // Use Nano Banana Pro (gemini-3-pro-image-preview) as specified in the technical spec
      // This model supports:
      // - Text-to-image generation
      // - Image-to-image editing
      // - Multi-image composition (up to 14 reference images)
      // - Character consistency (up to 5 people)
      // - 1K, 2K, 4K resolution output
      // - Google Search grounding for factual accuracy
      const response = await this.ai.models.generateContent({
        model: "gemini-3-pro-image-preview",
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: userPhotoMimeType,
                  data: userPhotoBase64
                }
              },
              {
                inlineData: {
                  mimeType: backgroundMimeType,
                  data: backgroundBase64
                }
              }
            ]
          }
        ],
        config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT]
        }
      });

      // Extract the generated image from the response
      const candidates = response.candidates;
      if (!candidates || candidates.length === 0) {
        return {
          success: false,
          error: "No response generated"
        };
      }

      const content = candidates[0].content;
      if (!content || !content.parts) {
        return {
          success: false,
          error: "Invalid response format"
        };
      }

      // Find the image part in the response
      for (const part of content.parts) {
        if (part.inlineData) {
          return {
            success: true,
            imageBase64: part.inlineData.data,
            mimeType: part.inlineData.mimeType
          };
        }
      }

      // No image found in response
      return {
        success: false,
        error: "No image generated in response. The model may have declined to generate the image."
      };
    } catch (error) {
      console.error("[SelfieGenerator] Generation failed:", error);

      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes("SAFETY")) {
          return {
            success: false,
            error: "Image generation was blocked due to safety filters. Please try a different photo."
          };
        }

        if (error.message.includes("quota") || error.message.includes("rate")) {
          return {
            success: false,
            error: "Rate limit exceeded. Please wait a moment and try again."
          };
        }

        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: false,
        error: "Unknown error occurred during generation"
      };
    }
  }

  /**
   * Builds the complete generation prompt including style and resolution instructions.
   *
   * @param style - The desired image style
   * @param resolution - Output resolution (1k, 2k, or 4k)
   * @returns Complete prompt string
   */
  private buildPrompt(style: SelfieStyle, resolution: SelfieResolution = "2k"): string {
    const styleInstruction = STYLE_INSTRUCTIONS[style] || STYLE_INSTRUCTIONS.natural;

    // Map resolution to approximate pixel dimensions
    const resolutionMap: Record<SelfieResolution, string> = {
      "1k": "approximately 1024 pixels on the longer side",
      "2k": "approximately 2048 pixels on the longer side",
      "4k": "approximately 4096 pixels on the longer side"
    };

    const resolutionHint = resolutionMap[resolution];

    return `${BASE_PROMPT}

${styleInstruction}

OUTPUT RESOLUTION: Generate the image at ${resolutionHint} for high-quality output.

The first image contains the person to insert. The second image is the background scene.
Now, create the composite image following all requirements above.`;
  }

  /**
   * Fetches a Street View image from Google's Static API.
   *
   * @param lat - Latitude
   * @param lng - Longitude
   * @param heading - Camera heading (0-360)
   * @param pitch - Camera pitch (-90 to 90)
   * @param apiKey - Google Maps API key
   * @param options - Additional options
   * @returns Promise resolving to base64 image data
   * @throws {Error} If fetch fails
   */
  async fetchStreetViewImage(
    lat: number,
    lng: number,
    heading: number,
    pitch: number,
    apiKey: string,
    options: {
      width?: number;
      height?: number;
      fov?: number;
    } = {}
  ): Promise<string> {
    const { width = 1920, height = 1080, fov = 90 } = options;

    const url = new URL("https://maps.googleapis.com/maps/api/streetview");
    url.searchParams.set("size", `${width}x${height}`);
    url.searchParams.set("location", `${lat},${lng}`);
    url.searchParams.set("heading", heading.toString());
    url.searchParams.set("pitch", pitch.toString());
    url.searchParams.set("fov", fov.toString());
    url.searchParams.set("key", apiKey);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Failed to fetch Street View image: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    return this.blobToBase64(blob);
  }

  /**
   * Converts a Blob to a base64 string (without data URL prefix).
   *
   * @param blob - The blob to convert
   * @returns Promise resolving to base64 string
   */
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        // Remove the data URL prefix to get just the base64 data
        const base64 = dataUrl.split(",")[1];
        resolve(base64);
      };

      reader.onerror = () => {
        reject(new Error("Failed to convert blob to base64"));
      };

      reader.readAsDataURL(blob);
    });
  }

  /**
   * Converts a File or Blob to base64.
   * Utility method for handling user-uploaded photos.
   *
   * @param file - The file to convert
   * @returns Promise resolving to base64 string
   */
  static async fileToBase64(file: File | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(",")[1];
        resolve(base64);
      };

      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Validates that an image is suitable for selfie generation.
   *
   * @param base64 - Base64 image data
   * @param maxSizeMB - Maximum file size in megabytes (default: 4)
   * @returns Object with validation result and any error message
   */
  static validateImage(
    base64: string,
    maxSizeMB = 4
  ): {
    valid: boolean;
    error?: string;
  } {
    if (!base64 || base64.trim() === "") {
      return { valid: false, error: "Image data is empty" };
    }

    // Estimate size: base64 is ~4/3 the size of binary
    const estimatedSizeBytes = (base64.length * 3) / 4;
    const estimatedSizeMB = estimatedSizeBytes / (1024 * 1024);

    if (estimatedSizeMB > maxSizeMB) {
      return {
        valid: false,
        error: `Image is too large (${estimatedSizeMB.toFixed(1)}MB). Maximum size is ${maxSizeMB}MB.`
      };
    }

    return { valid: true };
  }
}
