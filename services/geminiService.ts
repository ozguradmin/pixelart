import { GoogleGenAI } from "@google/genai";
import { PixelSize } from "../types";

export const generatePixelArtImage = async (prompt: string, size: PixelSize): Promise<string> => {
  // Always create the client instance just before the call to ensure 
  // we use the most recent API Key selected by the user.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Construct a prompt that guides the model towards the specific aesthetic of the resolution
  let styleGuide = "";
  
  switch (size) {
    case PixelSize.XS:
      styleGuide = "very minimalist, low-res pixel art, iconic style, NES era graphics, distinct large pixels, limited color palette.";
      break;
    case PixelSize.S:
      styleGuide = "SNES era pixel art, 16-bit style, moderate detail, clean outlines.";
      break;
    case PixelSize.M:
      styleGuide = "high quality pixel art, Playstation 1 era 2D sprite, detailed shading and lighting.";
      break;
    case PixelSize.L:
      styleGuide = "HD pixel art, very detailed, modern indie game aesthetic, complex textures.";
      break;
  }

  const finalPrompt = `Create a single pixel art sprite of: ${prompt}.
  
  Critical Requirements:
  1. Style: ${styleGuide}
  2. Background: Solid Black (#000000). This is crucial for background removal.
  3. Outlines: Use Dark Gray (#222222) or colored outlines instead of pure black (#000000) for the sprite itself, to distinguish it from the background.
  4. View: Full view, centered.
  5. Format: Pixel art style is mandatory. Sharp edges, no blur.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          { text: finalPrompt }
        ]
      },
      config: {
        // We generate a standard image, we will downsample it client-side to get the exact grid
        // This ensures better creativity than asking for raw JSON pixels
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image generated.");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};