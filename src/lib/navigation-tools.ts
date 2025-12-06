/**
 * Navigation tool definitions for the Gemini AI agent.
 * These function declarations are passed to the Gemini Live API to enable
 * the AI to control Street View navigation through structured function calls.
 *
 * @module navigation-tools
 */

import type { FunctionDeclaration } from "@google/genai";

/**
 * Type definition for pan_camera function arguments.
 * Smoothly rotates the Street View camera to a new heading and pitch.
 */
export type PanCameraArgs = {
  /** Target heading in degrees (0-360). 0=North, 90=East, 180=South, 270=West */
  heading_degrees: number;
  /** Target pitch in degrees (-90 to 90). 0=horizon, positive=up, negative=down */
  pitch_degrees: number;
};

/**
 * Type definition for move_forward function arguments.
 * Advances along the current street by a specified number of panorama steps.
 */
export type MoveForwardArgs = {
  /** Number of panorama positions to advance (1-5). Each step is roughly 10-20 meters */
  steps: number;
};

/**
 * Type definition for teleport function arguments.
 * Instantly travels to a named location anywhere in the world.
 */
export type TeleportArgs = {
  /** Natural language location name (e.g., "Eiffel Tower", "Times Square New York") */
  location_name: string;
};

/**
 * Type definition for look_at function arguments.
 * Centers the view on a described object or feature.
 */
export type LookAtArgs = {
  /** Description of what to look at (e.g., "the church steeple", "the red car on the left") */
  object_description: string;
};

/**
 * Type definition for get_location_info function arguments.
 * Triggers Google Search grounding to retrieve facts about the current location.
 */
export type GetLocationInfoArgs = Record<string, never>;

/**
 * Type definition for take_selfie function arguments.
 * Generates an AI composite image inserting the user into the current scene.
 */
export type TakeSelfieArgs = {
  /** Optional style for the image (e.g., "polaroid", "vintage", "professional", "fun") */
  style?: string;
};

/**
 * Union type of all possible navigation function arguments.
 */
export type NavigationFunctionArgs =
  | PanCameraArgs
  | MoveForwardArgs
  | TeleportArgs
  | LookAtArgs
  | GetLocationInfoArgs
  | TakeSelfieArgs;

/**
 * Names of all available navigation functions.
 */
export type NavigationFunctionName =
  | "pan_camera"
  | "move_forward"
  | "teleport"
  | "look_at"
  | "get_location_info"
  | "take_selfie";

/**
 * Function declaration for pan_camera.
 * Allows the AI to smoothly rotate the Street View camera.
 */
const panCameraDeclaration: FunctionDeclaration = {
  name: "pan_camera",
  description:
    "Smoothly rotate the Street View camera to a new heading and pitch. Use this when the user asks to 'turn', 'look', or 'face' a direction. Also use for looking up, down, left, right, or turning around.",
  parameters: {
    type: "object",
    properties: {
      heading_degrees: {
        type: "number",
        description:
          "Target heading in degrees (0-360). 0=North, 90=East, 180=South, 270=West. To turn right, add to current heading. To turn left, subtract from current heading. To turn around, add 180."
      },
      pitch_degrees: {
        type: "number",
        description:
          "Target pitch in degrees (-90 to 90). 0=horizon (straight ahead), positive values look up (max 90), negative values look down (min -90)."
      }
    },
    required: ["heading_degrees", "pitch_degrees"]
  }
};

/**
 * Function declaration for move_forward.
 * Allows the AI to advance along the current street.
 */
const moveForwardDeclaration: FunctionDeclaration = {
  name: "move_forward",
  description:
    "Advance along the current street in the direction the camera is facing. Use when the user says 'go forward', 'keep walking', 'continue', 'move ahead', or 'let's go down the street'. Each step advances roughly 10-20 meters.",
  parameters: {
    type: "object",
    properties: {
      steps: {
        type: "number",
        description:
          "Number of panorama positions to advance (1-5). Use 1 for a short step, 3 for a moderate distance, 5 for covering more ground quickly."
      }
    },
    required: ["steps"]
  }
};

/**
 * Function declaration for teleport.
 * Allows the AI to jump to any location worldwide.
 */
const teleportDeclaration: FunctionDeclaration = {
  name: "teleport",
  description:
    "Instantly travel to a named location anywhere in the world. Use when the user asks to 'go to', 'take me to', 'visit', 'show me', or 'let's explore' a specific place. Works with landmarks, cities, addresses, and points of interest.",
  parameters: {
    type: "object",
    properties: {
      location_name: {
        type: "string",
        description:
          "Natural language location name. Can be a famous landmark ('Eiffel Tower'), city ('Tokyo'), address ('221B Baker Street, London'), or point of interest ('Central Park, New York'). Be specific for better accuracy."
      }
    },
    required: ["location_name"]
  }
};

/**
 * Function declaration for look_at.
 * Allows the AI to center the view on specific objects.
 */
const lookAtDeclaration: FunctionDeclaration = {
  name: "look_at",
  description:
    "Center the view on a specific object or feature visible in the current scene. Use when the user asks to 'look at', 'focus on', 'show me', or 'what's that' referring to something visible. Requires visual interpretation of the scene.",
  parameters: {
    type: "object",
    properties: {
      object_description: {
        type: "string",
        description:
          "Description of what to look at in the current view (e.g., 'the church steeple', 'the red car on the left', 'the mountain in the distance', 'that tall building')."
      }
    },
    required: ["object_description"]
  }
};

/**
 * Function declaration for get_location_info.
 * Triggers knowledge retrieval about the current location.
 */
const getLocationInfoDeclaration: FunctionDeclaration = {
  name: "get_location_info",
  description:
    "Search for interesting facts, history, and information about the current location using Google Search. Use when the user asks 'tell me about this place', 'what's the history here', 'any interesting facts', 'what is this building', or generally wants to learn more about where they are.",
  parameters: {
    type: "object",
    properties: {}
  }
};

/**
 * Function declaration for take_selfie.
 * Triggers AI selfie generation at the current location.
 */
const takeSelfieDeclaration: FunctionDeclaration = {
  name: "take_selfie",
  description:
    "Generate an AI composite image inserting the user into the current Street View scene as a souvenir. Use when the user says 'take a selfie', 'put me in this photo', 'take a picture', 'souvenir photo', or 'I want a photo here'.",
  parameters: {
    type: "object",
    properties: {
      style: {
        type: "string",
        description:
          "Optional style modifier for the generated image. Options: 'polaroid' (white frame, nostalgic), 'vintage' (sepia, film grain), 'professional' (clean, crisp), 'fun' (vibrant, Instagram-style), or 'natural' (matches scene exactly)."
      }
    }
  }
};

/**
 * Array of all navigation function declarations.
 * Pass this to the Gemini Live API configuration.
 *
 * @example
 * ```typescript
 * const config = {
 *   responseModalities: [Modality.AUDIO, Modality.TEXT],
 *   tools: [
 *     { googleSearch: {} },
 *     { functionDeclarations: navigationFunctions }
 *   ],
 *   systemInstruction: SYSTEM_PROMPT
 * };
 * ```
 */
export const navigationFunctions: FunctionDeclaration[] = [
  panCameraDeclaration,
  moveForwardDeclaration,
  teleportDeclaration,
  lookAtDeclaration,
  getLocationInfoDeclaration,
  takeSelfieDeclaration
];

/**
 * Result type for navigation function execution.
 */
export type NavigationFunctionResult = {
  /** Whether the function executed successfully */
  success: boolean;
  /** Human-readable message describing the result */
  message: string;
  /** Optional additional data returned by the function */
  data?: unknown;
};

/**
 * Validates that function arguments match expected types.
 *
 * @param functionName - Name of the function being called
 * @param args - Arguments to validate
 * @returns true if arguments are valid
 * @throws {Error} If arguments are invalid
 */
export function validateFunctionArgs(functionName: NavigationFunctionName, args: unknown): boolean {
  if (typeof args !== "object" || args === null) {
    throw new Error(`Invalid arguments for ${functionName}: expected object, got ${typeof args}`);
  }

  const argsObj = args as Record<string, unknown>;

  switch (functionName) {
    case "pan_camera": {
      if (typeof argsObj.heading_degrees !== "number") {
        throw new Error("pan_camera requires heading_degrees as a number");
      }
      if (typeof argsObj.pitch_degrees !== "number") {
        throw new Error("pan_camera requires pitch_degrees as a number");
      }
      if (argsObj.heading_degrees < 0 || argsObj.heading_degrees > 360) {
        throw new Error("heading_degrees must be between 0 and 360");
      }
      if (argsObj.pitch_degrees < -90 || argsObj.pitch_degrees > 90) {
        throw new Error("pitch_degrees must be between -90 and 90");
      }
      return true;
    }

    case "move_forward": {
      if (typeof argsObj.steps !== "number") {
        throw new Error("move_forward requires steps as a number");
      }
      if (argsObj.steps < 1 || argsObj.steps > 5) {
        throw new Error("steps must be between 1 and 5");
      }
      return true;
    }

    case "teleport": {
      if (typeof argsObj.location_name !== "string" || argsObj.location_name.trim() === "") {
        throw new Error("teleport requires location_name as a non-empty string");
      }
      return true;
    }

    case "look_at": {
      if (typeof argsObj.object_description !== "string" || argsObj.object_description.trim() === "") {
        throw new Error("look_at requires object_description as a non-empty string");
      }
      return true;
    }

    case "get_location_info": {
      // No required arguments
      return true;
    }

    case "take_selfie": {
      // style is optional
      if (argsObj.style !== undefined && typeof argsObj.style !== "string") {
        throw new Error("take_selfie style must be a string if provided");
      }
      return true;
    }

    default: {
      throw new Error(`Unknown function: ${functionName}`);
    }
  }
}
