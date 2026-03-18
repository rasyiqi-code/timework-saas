'use server';


import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { getCurrentUser } from './auth';
import { protocolGenerationSchema, type AIProvider } from '@/lib/ai-schema';

// Configure Custom Providers (OpenRouter and Groq are OpenAI-compatible)
const openrouter = createOpenAI({
  name: 'openrouter',
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || '',
});

const groq = createOpenAI({
  name: 'groq',
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY || '',
});

export async function generateProtocolWithAI(prompt: string, provider: AIProvider, modelId?: string) {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
        throw new Error("Unauthorized to generate protocols");
    }

    let model;
    
    switch (provider) {
        case 'auto':
            if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
                model = google('gemini-2.5-flash'); // Default highly capable and fast model
            } else if (process.env.OPENROUTER_API_KEY) {
                model = openrouter('meta-llama/llama-3.3-70b-instruct:free');
            } else if (process.env.GROQ_API_KEY) {
                model = groq('llama-4-scout');
            } else {
                return { success: false, error: 'Tidak ada API Key AI yang aktif. Tambahkan di .env' };
            }
            break;
        case 'gemini':
            if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) return { success: false, error: 'API Key for Gemini is missing.' };
            model = google(modelId && modelId !== 'auto' ? modelId : 'gemini-2.5-flash');
            break;
        case 'openrouter':
            if (!process.env.OPENROUTER_API_KEY) return { success: false, error: 'API Key for OpenRouter is missing.' };
            model = openrouter(modelId && modelId !== 'auto' ? modelId : 'meta-llama/llama-3.3-70b-instruct:free'); 
            break;
        case 'groq':
            if (!process.env.GROQ_API_KEY) return { success: false, error: 'API Key for Groq is missing.' };
            model = groq(modelId && modelId !== 'auto' ? modelId : 'llama-4-scout'); 
            break;
        default:
            return { success: false, error: 'Unsupported AI provider selected.' };
    }


    try {
        const { object } = await generateObject({
            model,
            schema: protocolGenerationSchema,
            system: `You are an expert operations manager and process architect. 
Your job is to take a request for a Standard Operating Procedure (SOP) or workflow 
and break it down into a highly structured, step-by-step protocol.
Crucially, you must also determine the necessary "Intake Form Fields" that should be gathered at the very beginning when a user starts this project.
Make tasks granular, assign realistic colors based on the task type (e.g. green for approval, red for review), and determine if an attachment (evidence) is required.
Establish clear dependencies so tasks logically unlock in the correct order.`,
            prompt: prompt,
        });

        return { success: true, data: object };
    } catch (error) {
        console.error("AI Generation Error:", error);
        return { success: false, error: 'Failed to generate protocol. The AI service may be unavailable or the schema was rejected.' };
    }
}
