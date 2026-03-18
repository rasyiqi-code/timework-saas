
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GOOGLE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

export interface ProposedProtocolItem {
    title: string;
    description: string;
    category: 'TASK' | 'NOTE' | 'GROUP';
    order: number;
    requireAttachment: boolean;
}

export async function parseSOPToProtocol(text: string): Promise<ProposedProtocolItem[]> {
    if (!API_KEY) {
        throw new Error("GOOGLE_GEMINI_API_KEY is not configured");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
        Analyze the following Standard Operating Procedure (SOP) text and convert it into a structured list of protocol items.
        
        Rules:
        1. Identify clear actionable steps as 'TASK'.
        2. Identify informational sections as 'NOTE'.
        3. Identify major phases or sections as 'GROUP'.
        4. Determine if a task likely requires a file upload (e.g., photos, documents) and set 'requireAttachment' to true.
        5. Assign a logical 'order' starting from 1.
        
        Output EXCLUSIVELY a JSON array with this structure:
        [
            {
                "title": "Step Name",
                "description": "Details about the step",
                "category": "TASK" | "NOTE" | "GROUP",
                "order": number,
                "requireAttachment": boolean
            }
        ]

        SOP Text:
        """
        ${text}
        """
    `;

    try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        // Extract JSON block if AI wrapped it in markdown
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        const jsonStr = jsonMatch ? jsonMatch[0] : responseText;
        
        return JSON.parse(jsonStr) as ProposedProtocolItem[];
    } catch (error) {
        console.error("AI Parsing Error:", error);
        throw new Error("Failed to parse SOP with AI. Please check your text or API key.");
    }
}
