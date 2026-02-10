import { GoogleGenAI, Type, Modality } from "@google/genai";
import { DetectedObject, WordDetails } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Detects objects in a base64 image string.
 */
export const detectObjectsInImage = async (base64Image: string): Promise<DetectedObject[]> => {
  try {
    // Using gemini-3-flash-preview for multimodal object detection with structured output
    const modelId = "gemini-3-flash-preview";
    
    // We want a structured JSON response
    const schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING, description: "The English name of the object" },
          box_2d: {
            type: Type.ARRAY,
            items: { type: Type.INTEGER },
            description: "Bounding box coordinates [ymin, xmin, ymax, xmax] normalized to 1000x1000 grid.",
          },
        },
        required: ["label", "box_2d"],
      },
    };

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
          {
            text: "Detect the main objects in this image. Return a list of objects with their English labels and 2D bounding boxes.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.4,
      },
    });

    let rawData: any[] = [];
    if (response.text) {
      try {
        const cleanText = response.text.replace(/```json|```/g, '').trim();
        rawData = JSON.parse(cleanText);
      } catch (e) {
        console.warn("JSON parse failed", e);
      }
    }
    
    // Map to our internal type and add IDs
    return Array.isArray(rawData) ? rawData.map((item: any, index: number) => ({
      id: `obj-${index}-${Date.now()}`,
      label: item.label,
      box2d: item.box_2d,
    })) : [];

  } catch (error) {
    console.error("Error detecting objects:", error);
    return [];
  }
};

/**
 * Generates sample sentences and details for a specific word.
 */
export const getWordDetails = async (word: string): Promise<WordDetails> => {
  try {
    const modelId = "gemini-3-flash-preview";
    
    const schema = {
      type: Type.OBJECT,
      properties: {
        word: { type: Type.STRING },
        phonetic: { type: Type.STRING, description: "IPA phonetic transcription" },
        sentences: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "3 simple, real-world example sentences using the word.",
        },
      },
      required: ["word", "sentences"],
    };

    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Provide English learning details for the word: "${word}". Include phonetic spelling and 3 simple example sentences.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    if (response.text) {
      const cleanText = response.text.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanText) as WordDetails;
    }
    throw new Error("No data returned");
  } catch (error) {
    console.error("Error getting word details:", error);
    return {
      word: word,
      sentences: [`Here is a sentence with ${word}.`, `I like this ${word}.`, `Can you see the ${word}?`],
    };
  }
};

/**
 * Generates audio for pronunciation.
 * @param text The text to speak
 * @param isSentence If true, speaks the text naturally. If false, emphasizes it as a vocabulary word.
 */
export const generatePronunciation = async (text: string, isSentence: boolean = false): Promise<ArrayBuffer | null> => {
  try {
    // For single words, we use a prompt to ensure clear enunciation.
    // For sentences, we just pass the text.
    const prompt = isSentence ? text : `Say the word: ${text}`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return null;

    // Decode base64 to ArrayBuffer
    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;

  } catch (error) {
    console.error("Error generating speech:", error);
    return null;
  }
};