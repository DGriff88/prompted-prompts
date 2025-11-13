
import { GoogleGenAI, Modality } from "@google/genai";

export async function editImageWithPrompt(
  base64ImageData: string,
  mimeType: string,
  prompt: string
): Promise<string> {
  // It is recommended to create a new instance for each call
  // if the API key can be changed by the user during the session.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  // Enhance the user's prompt with artistic keywords for better results
  const enhancedPrompt = `A masterpiece, high-resolution, studio quality, intricate details, ethereal mood, dramatic lighting. Focus on textures like stained glass, iridescent crystal, and glowing filaments. Using the provided image as a base, edit it to: "${prompt}"`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          {
            text: enhancedPrompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
      }
    }

    throw new Error("No image data was found in the API response.");

  } catch (error) {
    console.error("Error editing image with Gemini:", error);
    if (error instanceof Error) {
        // Provide a more user-friendly error message
        if (error.message.includes('API key not valid')) {
            throw new Error('The provided API key is not valid. Please check your configuration.');
        }
        throw new Error(`Failed to edit image: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the AI model.");
  }
}
