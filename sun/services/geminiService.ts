import { GoogleGenAI, Type } from "@google/genai";
import { JournalPrompt } from '../types';

const apiKey = process.env.API_KEY || ''; // In a real app, ensure this is set safely

// Fallback if no key is provided to prevent app crashing in demo mode
const FALLBACK_PROMPT: JournalPrompt = {
  topic: "Stillness in Chaos",
  context: "Reflect on a moment today where you found silence amidst noise."
};

export const generateDailyPrompt = async (): Promise<JournalPrompt> => {
  if (!apiKey) {
    console.warn("No API_KEY found. Using fallback prompt.");
    return new Promise(resolve => setTimeout(() => resolve(FALLBACK_PROMPT), 1000));
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Generate a deep, philosophical, yet actionable journaling prompt for a designer or creative person. The tone should be calm, stoic, and inspiring.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: {
              type: Type.STRING,
              description: 'A short, poetic title for the topic.',
            },
            context: {
              type: Type.STRING,
              description: 'A question or instruction for the user to write about.',
            },
          },
          required: ["topic", "context"]
        },
      },
    });

    const jsonText = response.text;
    if (!jsonText) return FALLBACK_PROMPT;
    
    return JSON.parse(jsonText) as JournalPrompt;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return FALLBACK_PROMPT;
  }
};