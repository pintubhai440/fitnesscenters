import { GoogleGenAI, Type, GenerateContentResponse, Chat, Modality } from "@google/genai";
import { DietPlan } from "../types";

const getGenAI = () => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const analyzeVideo = async (videoBase64: string, mimeType: string, exerciseType: string): Promise<string> => {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: {
            parts: [
                {
                    text: `You are an expert fitness coach. Analyze this video of a user performing '${exerciseType}'.
                    Structure your response ONLY in Markdown with the following exact headings:
                    
                    ### Repetition Count
                    [Your count as a single number. If you cannot determine a count, write 'Unable to count'.]
                    
                    ### Form Assessment
                    - [Point 1: A specific, concise comment on their form.]
                    - [Point 2: Another specific, concise comment on their form.]
                    
                    ### Tips for Improvement
                    - [Tip 1: An actionable tip related to their form.]
                    - [Tip 2: Another actionable tip for them to improve.]
                    
                    Keep feedback encouraging and constructive. If the video does not clearly show the specified exercise, state that clearly under the 'Form Assessment' heading and provide recommendations.
                    `
                },
                {
                    inlineData: {
                        data: videoBase64,
                        mimeType,
                    }
                }
            ]
        }
    });
    return response.text;
};

export const generateDietPlan = async (biography: string, goals: string): Promise<DietPlan | null> => {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: `Based on the following user details, create a personalized 7-day diet plan.
        
        User Biography: "${biography}"
        Fitness Goals: "${goals}"

        Generate a JSON object that follows the specified schema. The plan should be balanced, realistic, and tailored to the user's goals and preferences mentioned in their biography. Provide varied and interesting meal suggestions.
        `,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    summary: { type: Type.STRING },
                    daily_plans: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                day: { type: Type.STRING },
                                meals: {
                                    type: Type.OBJECT,
                                    properties: {
                                        breakfast: { type: Type.STRING },
                                        lunch: { type: Type.STRING },
                                        dinner: { type: Type.STRING },
                                        snacks: { type: Type.STRING },
                                    },
                                    required: ["breakfast", "lunch", "dinner", "snacks"]
                                },
                                notes: { type: Type.STRING }
                            },
                            required: ["day", "meals"]
                        }
                    }
                },
                required: ["title", "summary", "daily_plans"]
            },
            thinkingConfig: {
                thinkingBudget: 32768
            }
        }
    });
    
    try {
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as DietPlan;
    } catch (e) {
        console.error("Failed to parse diet plan JSON:", e);
        return null;
    }
};

export const getRecommendations = async (profile: string, goals: string): Promise<GenerateContentResponse> => {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `I am a user with the following profile: "${profile}" and my goals are: "${goals}".
        
        Please act as an expert fitness content curator. Find 5 high-quality, relevant YouTube videos that can help me achieve my goals. For each video, provide the title and a brief explanation of why it's a good recommendation for me.
        `,
        config: {
            tools: [{ googleSearch: {} }]
        }
    });
    return response;
};


export const createChat = (): Chat => {
    const ai = getGenAI();
    return ai.chats.create({
        model: 'gemini-2.5-flash',
    });
};

export const textToSpeech = async (text: string): Promise<string | undefined> => {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};

// --- START: CORRECTED FUNCTION ---
export const generateImage = async (prompt: string, aspectRatio: string): Promise<string | undefined> => {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
        // FIX: Using the experimental model name you provided
        model: 'gemini-2.0-flash-exp-image-generation', 
        
        contents: {
            parts: [{ text: prompt }]
        },
        
        config: {
            responseMimeType: 'image/jpeg',
            responseModalities: [Modality.IMAGE],
            aspectRatio,
        },
    });
    
    // Parse the response
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};
// --- END: CORRECTED FUNCTION ---
