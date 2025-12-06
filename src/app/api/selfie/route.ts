/**
 * API Route: Selfie Generation
 * Server-side handler for generating AI selfie composites.
 * Uses Gemini 3 Pro Image (Nano Banana Pro) for image generation.
 *
 * This route keeps the API key secure on the server side.
 *
 * @module api/selfie/route
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Modality } from "@google/genai";

/**
 * Request body type for selfie generation.
 */
type SelfieRequestBody = {
  /** User's photo as base64 (without data URL prefix) */
  userPhotoBase64: string;
  /** Street View background as base64 (without data URL prefix) */
  backgroundBase64: string;
  /** Style for the generated image */
  style?: "natural" | "polaroid" | "vintage" | "professional" | "fun";
  /** MIME type of the user photo */
  userPhotoMimeType?: string;
  /** MIME type of the background */
  backgroundMimeType?: string;
};

/**
 * Response type for selfie generation.
 */
type SelfieResponse = {
  success: boolean;
  imageBase64?: string;
  mimeType?: string;
  error?: string;
};

/**
 * Style-specific prompt instructions.
 */
const STYLE_INSTRUCTIONS: Record<string, string> = {
  natural: `
STYLE: Natural Photograph
- Match the photographic style of the background exactly
- No additional filters, frames, or effects
- Seamless integration that looks like an original unedited photo`,

  polaroid: `
STYLE: Polaroid Photo
- Add a white polaroid-style frame around the image
- Apply a slight warm, nostalgic color cast
- Add subtle vignetting at the corners`,

  vintage: `
STYLE: Vintage Photography
- Apply a warm, sepia-toned color grade
- Add subtle film grain and light leaks
- Reduce contrast slightly for a faded look`,

  professional: `
STYLE: Professional Portrait
- Maintain clean, crisp image quality
- Apply subtle professional color grading
- Ensure perfect edge integration`,

  fun: `
STYLE: Fun Travel Photo
- Bright, vibrant colors with enhanced saturation
- Clean, Instagram-worthy aesthetic
- Perfect for social media sharing`
};

/**
 * Base prompt for selfie generation.
 */
const BASE_PROMPT = `You are an expert photo compositor. Your task is to seamlessly insert the person from the first image into the scene shown in the second image.

CRITICAL REQUIREMENTS:
1. PRESERVE IDENTITY: The person's face, features, and expression must remain exactly as shown in the original photo. Do not alter or distort their appearance.
2. MATCH LIGHTING: Analyze the background scene lighting and apply matching lighting to the person.
3. CORRECT SCALE: Position the person as if standing approximately 2-3 meters from the camera.
4. NATURAL INTEGRATION: The person should appear naturally within the scene with proper shadows and environmental effects.
5. OUTPUT QUALITY: Generate a high-quality, artifact-free image.`;

/**
 * POST handler for selfie generation.
 *
 * @param request - The incoming request
 * @returns JSON response with generated image or error
 */
export async function POST(request: NextRequest): Promise<NextResponse<SelfieResponse>> {
  try {
    // Validate API key
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Gemini API key not configured on server"
        },
        { status: 500 }
      );
    }

    // Parse request body
    const body: SelfieRequestBody = await request.json();

    // Validate required fields
    if (!body.userPhotoBase64 || body.userPhotoBase64.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "User photo is required"
        },
        { status: 400 }
      );
    }

    if (!body.backgroundBase64 || body.backgroundBase64.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "Background image is required"
        },
        { status: 400 }
      );
    }

    // Validate image sizes (max 4MB each)
    const maxSizeBytes = 4 * 1024 * 1024;
    const userPhotoSize = (body.userPhotoBase64.length * 3) / 4;
    const backgroundSize = (body.backgroundBase64.length * 3) / 4;

    if (userPhotoSize > maxSizeBytes) {
      return NextResponse.json(
        {
          success: false,
          error: "User photo is too large. Maximum size is 4MB."
        },
        { status: 400 }
      );
    }

    if (backgroundSize > maxSizeBytes) {
      return NextResponse.json(
        {
          success: false,
          error: "Background image is too large. Maximum size is 4MB."
        },
        { status: 400 }
      );
    }

    // Build prompt with style
    const style = body.style || "natural";
    const styleInstruction = STYLE_INSTRUCTIONS[style] || STYLE_INSTRUCTIONS.natural;
    const prompt = `${BASE_PROMPT}\n${styleInstruction}\n\nThe first image contains the person to insert. The second image is the background scene. Create the composite image.`;

    // Initialize Gemini client
    const ai = new GoogleGenAI({ apiKey });

    // Generate the composite image
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: body.userPhotoMimeType || "image/jpeg",
                data: body.userPhotoBase64
              }
            },
            {
              inlineData: {
                mimeType: body.backgroundMimeType || "image/jpeg",
                data: body.backgroundBase64
              }
            }
          ]
        }
      ],
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT]
      }
    });

    // Extract image from response
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No response generated from model"
        },
        { status: 500 }
      );
    }

    const content = candidates[0].content;
    if (!content || !content.parts) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid response format from model"
        },
        { status: 500 }
      );
    }

    // Find the image part
    for (const part of content.parts) {
      if (part.inlineData) {
        return NextResponse.json({
          success: true,
          imageBase64: part.inlineData.data,
          mimeType: part.inlineData.mimeType
        });
      }
    }

    // No image in response
    return NextResponse.json(
      {
        success: false,
        error: "No image generated. The model may have declined to generate the image due to content policies."
      },
      { status: 500 }
    );
  } catch (error) {
    console.error("[API/Selfie] Error:", error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("SAFETY")) {
        return NextResponse.json(
          {
            success: false,
            error: "Image generation was blocked due to safety filters. Please try a different photo."
          },
          { status: 400 }
        );
      }

      if (error.message.includes("quota") || error.message.includes("rate")) {
        return NextResponse.json(
          {
            success: false,
            error: "Rate limit exceeded. Please wait a moment and try again."
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred"
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler - returns API information.
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    name: "Anywhere Selfie API",
    version: "1.0.0",
    endpoints: {
      POST: {
        description: "Generate an AI selfie composite",
        body: {
          userPhotoBase64: "string (required) - User photo as base64",
          backgroundBase64: "string (required) - Street View background as base64",
          style: "string (optional) - One of: natural, polaroid, vintage, professional, fun",
          userPhotoMimeType: "string (optional) - MIME type of user photo",
          backgroundMimeType: "string (optional) - MIME type of background"
        },
        response: {
          success: "boolean",
          imageBase64: "string (on success)",
          mimeType: "string (on success)",
          error: "string (on failure)"
        }
      }
    }
  });
}
