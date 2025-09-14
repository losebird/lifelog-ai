
import { GoogleGenAI, Type } from "@google/genai";
import type { Record, GeminiAnalysisResult, GeminiLinkAnalysisResult, GeminiScanAnalysisResult, GeminiFileAnalysisResult, InsightTemplate, ProactiveSuggestion, Habit } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function withRetry<T>(apiCall: () => Promise<T>, maxRetries = 3, initialDelay = 1000): Promise<T> {
    let attempt = 0;
    while (true) {
        try {
            return await apiCall();
        } catch (error: any) {
            const errorMessage = error?.toString() || '';
            const isRateLimitError = errorMessage.includes('429') || errorMessage.toLowerCase().includes('resource_exhausted');
            
            if (isRateLimitError && attempt < maxRetries) {
                attempt++;
                // Exponential backoff with jitter
                const delay = initialDelay * Math.pow(2, attempt - 1) * (0.8 + Math.random() * 0.4); 
                console.warn(`Rate limit exceeded. Retrying in ${Math.round(delay)}ms... (Attempt ${attempt}/${maxRetries})`);
                await sleep(delay);
            } else {
                if (isRateLimitError) {
                    console.error(`API call failed after ${maxRetries} retries due to rate limiting.`, error);
                }
                throw error;
            }
        }
    }
}

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        tags: {
            type: Type.ARRAY,
            items: {
                type: Type.STRING,
                description: 'A relevant keyword or phrase tag, 4 characters or less.'
            },
            description: 'An array of up to 3 relevant tags based on the note\'s content. Each tag must be 4 characters or less.'
        },
        actionItems: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    task: {
                        type: Type.STRING,
                        description: 'The description of the action item or task.'
                    },
                    dueDate: {
                        type: Type.STRING,
                        description: 'The extracted due date in ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ), if mentioned. For relative dates like "tomorrow", calculate the absolute date based on the current date provided.'
                    },
                    priority: {
                        type: Type.STRING,
                        description: 'The priority of the task: "high", "medium", or "low". Default to "medium" if not specified.'
                    },
                    project: {
                        type: Type.STRING,
                        description: 'The project or category this task belongs to, if mentioned (e.g., from a heading or context like "#ProjectX").'
                    }
                },
                required: ['task']
            },
            description: 'An array of action items identified in the note. If none are found, this should be an empty array.'
        },
        emotion: {
            type: Type.STRING,
            description: 'A single emoji representing the dominant emotion of the note from this list: 😊, 😢, 😠, 😮, 🤔, 😐. If no clear emotion, return 😐.',
            enum: ['😊', '😢', '😠', '😮', '🤔', '😐']
        },
    },
    required: ['tags', 'actionItems', 'emotion']
};

const linkAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        title: {
            type: Type.STRING,
            description: 'A concise and accurate title for the web page content.'
        },
        summary: {
            type: Type.STRING,
            description: 'A 2-3 sentence summary of the main points of the web page.'
        },
        tags: {
            type: Type.ARRAY,
            items: {
                type: Type.STRING,
                description: 'A relevant keyword or phrase tag, 4 characters or less.'
            },
            description: 'An array of up to 3 relevant tags based on the web page content. Each tag must be 4 characters or less.'
        }
    },
    required: ['title', 'summary', 'tags']
};

const scanAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        ocrText: {
            type: Type.STRING,
            description: 'The full text extracted from the image(s) via OCR, combined into a single string. If no text is found, return an empty string.'
        },
        ...analysisSchema.properties
    },
    required: ['ocrText', 'tags', 'actionItems', 'emotion']
};

const fileAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        summaryPoints: {
            type: Type.ARRAY,
            items: {
                type: Type.STRING,
                description: 'A single, concise bullet point summarizing a key aspect of the document.'
            },
            description: 'An array of 3-5 key summary bullet points extracted from the document text.'
        },
        ...analysisSchema.properties
    },
    required: ['summaryPoints', 'tags', 'actionItems', 'emotion']
};


export const analyzeTextWithGemini = async (text: string): Promise<GeminiAnalysisResult> => {
    try {
        const currentDate = new Date().toISOString();
        const prompt = `
            You are an intelligent assistant analyzing a user's journal entry. Your task is to extract structured data from the text.
            The current date and time is: ${currentDate}. Use this as the reference for all relative date calculations.

            Follow these instructions carefully:
            1.  **Generate Tags:** Identify main themes. Create a maximum of 3 relevant keyword tags. **Each tag must be 4 characters or less.**
            2.  **Identify Action Items:** Find any tasks, reminders, or to-do items.
            3.  **Extract Due Dates with Precision:**
                - If a specific date and time is mentioned (e.g., "August 10th at 3 PM"), convert it to a full ISO 8601 string.
                - If a relative date is mentioned, calculate the absolute date based on the current date provided.
                    - "tomorrow": The next day.
                    - "next Friday": The upcoming Friday. If today is Friday, it means the Friday of next week.
                    - "end of the month": The last day of the current month.
                - If ONLY a date is mentioned (e.g., "by tomorrow"), assume a default time of 9:00 AM local time for the due date.
                - If no date is mentioned for a task, omit the dueDate field for that item.
            4.  **Extract Priority & Project:**
                - Identify task priority (e.g., "high priority", "urgent", "low priority"). If not specified, default to "medium".
                - Identify a project name if the task is associated with one (e.g., "#ProjectX", "for the marketing campaign").
            5.  **Analyze Emotion:** Based on the overall tone, select the most fitting emoji from the allowed list (😊, 😢, 😠, 😮, 🤔, 😐) to represent the user's emotion. Default to 😐 if neutral or unclear.
            6.  **Output Format:** Return ONLY a single, valid JSON object that strictly conforms to the provided schema. Do not include any explanations, markdown formatting, or any text outside of the JSON object.

            ---
            User's note to analyze:
            ---
            ${text}
            ---
        `;

        const response = await withRetry(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: analysisSchema,
            },
        }));
        
        const jsonString = response.text;
        if (!jsonString) {
            console.error("Gemini API returned an empty response for text analysis.");
            return { tags: [], actionItems: [], emotion: '😐' };
        }

        const result = JSON.parse(jsonString);
        
        return {
            tags: result.tags || [],
            actionItems: result.actionItems || [],
            emotion: result.emotion || '😐',
        };

    } catch (error) {
        console.error("Error analyzing text with Gemini:", error);
        return {
            tags: [],
            actionItems: [],
            emotion: '😐',
        };
    }
};

export const analyzeLinkWithGemini = async (url: string): Promise<GeminiLinkAnalysisResult> => {
    try {
        const prompt = `
            You are a web page summarizer. I will provide you with a URL. Your task is to:
            1.  Infer the content of the page from the URL.
            2.  Generate a concise, compelling title for the page.
            3.  Write a 2-3 sentence summary of the page's likely content.
            4.  Extract a maximum of 3 relevant keywords as tags. **Each tag must be 4 characters or less.**
            5.  Return the result as a single, valid JSON object that conforms to the provided schema. Do not include any markdown formatting.

            URL:
            ---
            ${url}
            ---
        `;

        const response = await withRetry(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: linkAnalysisSchema,
            },
        }));

        const jsonString = response.text;
        if (!jsonString) {
             console.error("Gemini API returned an empty response for link analysis.");
            return { title: url, summary: "Could not generate summary.", tags: [] };
        }
        
        const result = JSON.parse(jsonString);

        return {
            title: result.title || url,
            summary: result.summary || "No summary available.",
            tags: result.tags || []
        };

    } catch (error) {
        console.error("Error analyzing link with Gemini:", error);
        return {
            title: url,
            summary: "Failed to analyze the link. Please check the URL and try again.",
            tags: []
        };
    }
};

export const analyzeImageWithGemini = async (base64DataArray: string[], mimeType: string): Promise<GeminiScanAnalysisResult> => {
    try {
        const imageParts = base64DataArray.map(data => ({
            inlineData: { mimeType, data },
        }));

        const textPart = {
            text: `
                Analyze the attached image(s), which represent pages of a single document in order.
                1. Extract all text from all images using Optical Character Recognition (OCR). Combine the text from all pages into a single continuous block. If no text is discernible, return an empty string for the 'ocrText' field.
                2. Based *only* on the combined extracted text, generate a maximum of 3 relevant keywords or phrases as tags. **Each tag must be 4 characters or less.**
                3. Based *only* on the combined extracted text, identify any specific action items or tasks mentioned. Extract their priority and project if available.
                4. Based *only* on the combined extracted text, determine the dominant emotion and select a single emoji from this list: 😊, 😢, 😠, 😮, 🤔, 😐.
                5. Return the result as a single, valid JSON object that conforms to the provided schema.
            `
        };

        const response = await withRetry(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [...imageParts, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: scanAnalysisSchema,
            },
        }));

        const jsonString = response.text;
        if (!jsonString) {
            console.error("Gemini API returned an empty response for image analysis.");
            return { ocrText: '分析失败，未返回任何内容。', tags: [], actionItems: [], emotion: '😐' };
        }
        
        const result = JSON.parse(jsonString);
        
        return {
            ocrText: result.ocrText || '',
            tags: result.tags || [],
            actionItems: result.actionItems || [],
            emotion: result.emotion || '😐',
        };

    } catch (error) {
        console.error("Error analyzing image with Gemini:", error);
        return {
            ocrText: '图片分析失败。请检查图片或稍后再试。',
            tags: [],
            actionItems: [],
            emotion: '😐',
        };
    }
};

export const analyzeFileContentWithGemini = async (textContent: string): Promise<GeminiFileAnalysisResult> => {
    try {
        const prompt = `
            Analyze the following document content.
            1. Generate 3-5 concise, key bullet points that summarize the main ideas of the document.
            2. Based on the content, generate a maximum of 3 relevant keywords or phrases as tags. **Each tag must be 4 characters or less.**
            3. Identify any specific action items or tasks mentioned within the text. Extract their priority and project if available.
            4. Based on the content, determine the dominant emotion and select a single emoji from this list: 😊, 😢, 😠, 😮, 🤔, 😐.
            5. Return the result as a single, valid JSON object that conforms to the provided schema.

            Document Content:
            ---
            ${textContent}
            ---
        `;

        const response = await withRetry(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: fileAnalysisSchema,
            },
        }));
        
        const jsonString = response.text;
        if (!jsonString) {
            console.error("Gemini API returned an empty response for file analysis.");
            return { summaryPoints: ["Analysis failed to produce a summary."], tags: [], actionItems: [], emotion: '😐' };
        }

        const result = JSON.parse(jsonString);
        
        return {
            summaryPoints: result.summaryPoints || [],
            tags: result.tags || [],
            actionItems: result.actionItems || [],
            emotion: result.emotion || '😐',
        };

    } catch (error) {
        console.error("Error analyzing file content with Gemini:", error);
        return {
            summaryPoints: ["An error occurred during AI analysis."],
            tags: [],
            actionItems: [],
            emotion: '😐',
        };
    }
};


export const searchRecordsWithGemini = async (query: string, records: Record[]): Promise<string[]> => {
    if (records.length === 0) return [];
    
    try {
        // Create a simplified text representation of all records for the AI to search through.
        const recordsAsText = records.map(r => {
            return `
                ID: ${r.id}
                Type: ${r.type}
                Timestamp: ${r.timestamp}
                Tags: ${r.tags.join(', ')}
                Content: ${r.fullText || r.content}
            `;
        }).join('\n---\n');

        const prompt = `
            You are a semantic search engine for a user's digital journal.
            Analyze the user's search query and the list of journal records provided below.
            Identify the records that are the most semantically relevant to the user's query.
            Consider the content, tags, and type of each record.
            
            Return ONLY a single JSON object with a key "relevantRecordIds" containing an array of the IDs of the matching records.
            The array should be ordered from most to least relevant. If no records are relevant, return an empty array.
            
            Search Query: "${query}"
            
            ---
            Journal Records:
            ---
            ${recordsAsText}
            ---
        `;

        const response = await withRetry(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        relevantRecordIds: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.STRING
                            }
                        }
                    },
                    required: ['relevantRecordIds']
                },
            },
        }));
        
        const jsonString = response.text;
        if (!jsonString) {
            console.error("Gemini API returned an empty response for search.");
            return [];
        }
        
        const result = JSON.parse(jsonString);
        return result.relevantRecordIds || [];

    } catch (error) {
        console.error("Error searching records with Gemini:", error);
        return [];
    }
};

export const generateSearchSuggestions = async (records: Record[]): Promise<string[]> => {
    if (records.length < 1) return []; // Generate even with one record

    try {
        const recordsAsText = records.slice(0, 50).map(r => { // Limit to recent 50 records for performance
            return `
                - Type: ${r.type}, Timestamp: ${r.timestamp}, Tags: [${r.tags.join(', ')}], Content: ${r.content.substring(0, 100)}...
            `;
        }).join('\n');

        const prompt = `
            You are an AI data analyst for a user's personal journal. Your goal is to spark curiosity and help the user rediscover their own thoughts. Based on the recent entries provided below, generate 4 to 6 intriguing and highly relevant search suggestions. These should be phrased as questions or short topics that highlight potential connections, patterns, or forgotten items.
            
            Focus on creating suggestions that are genuinely useful and feel personalized. Avoid generic suggestions.

            Examples: "What were my main goals last month?", "Find all ideas related to Project Phoenix", "Show me my notes about the marketing strategy", "List unresolved action items".

            Return ONLY a single, valid JSON object with a key "suggestions" containing an array of the string suggestions.

            ---
            Recent Journal Entries:
            ---
            ${recordsAsText}
            ---
        `;

        const response = await withRetry(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        suggestions: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    },
                    required: ['suggestions']
                },
            },
        }));

        const jsonString = response.text;
        if (!jsonString) {
            console.error("Gemini API returned an empty response for search suggestions.");
            return [];
        }
        
        const result = JSON.parse(jsonString);
        return result.suggestions || [];

    } catch (error) {
        console.error("Error generating search suggestions with Gemini:", error);
        return [];
    }
};

export const generateInsightReport = async (template: InsightTemplate, records: Record[]): Promise<string> => {
    if (records.length === 0) return "没有找到相关记录以生成报告。";

    try {
        const recordsAsText = records.map(r => `
            ---
            Date: ${new Date(r.timestamp).toLocaleString()}
            Emotion: ${r.emotion || 'N/A'}
            Tags: ${r.tags.join(', ')}
            Content: ${r.content}
            ---
        `).join('\n');

        const prompt = `
            You are an AI reflection assistant. The user wants to generate an insight report based on one of their templates and a selection of their journal entries.
            
            Your task is to analyze the provided records and generate a structured report that answers the questions from the template.
            Synthesize information from multiple entries to provide thoughtful, well-supported answers.
            The report should be in Markdown format. For each question in the template, create a heading and then provide a detailed answer based on the journal data.

            **Template:** ${template.name}
            **Questions to Answer:**
            ${template.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

            **Journal Records to Analyze:**
            ${recordsAsText}

            Generate the report now.
        `;

        const response = await withRetry(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        }));

        return response.text || "AI未能生成报告，请重试。";
    } catch (error) {
        console.error("Error generating insight report:", error);
        return "生成洞察报告时出错。";
    }
};

export const generateProactiveSuggestions = async (records: Record[]): Promise<ProactiveSuggestion[]> => {
     if (records.length < 5) return [];

    const suggestionSchema = {
        type: Type.OBJECT,
        properties: {
            suggestions: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        type: { type: Type.STRING, enum: ['habit_suggestion', 'pattern_insight'] },
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        relatedRecordIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                        actionLabel: { type: Type.STRING, description: "If type is 'habit_suggestion', a call-to-action label for a button." },
                        habitData: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                icon: { type: Type.STRING, enum: ['RunIcon', 'BookIcon', 'BedIcon', 'MeditateIcon', 'ForkKnifeIcon'] },
                                color: { type: Type.STRING, enum: ['orange', 'red', 'amber', 'green', 'sky', 'indigo', 'purple', 'pink'] }
                            },
                            description: "If type is 'habit_suggestion', pre-filled data for creating the new habit."
                        }
                    },
                    required: ['type', 'title', 'description', 'relatedRecordIds']
                }
            }
        },
        required: ['suggestions']
    };

    try {
        const recordsAsText = records.map(r => `
            ID: ${r.id} | Date: ${new Date(r.timestamp).toISOString().split('T')[0]} | Emotion: ${r.emotion || ''} | Tags: ${r.tags.join(', ')} | Content: ${r.content.substring(0, 200)}...
        `).join('\n');

        const prompt = `
            You are a proactive AI life coach. Your task is to analyze a user's recent journal entries to find interesting patterns or opportunities for growth. Generate 1-2 insightful suggestions based on the data.
            
            Instructions:
            1.  **Look for Correlations:** Find connections between activities, emotions, and topics. For example, does the user often mention "anxiety" and then "music"? Or mention "Project X" with a "😢" emotion?
            2.  **Generate Suggestions:**
                - If you find a positive coping mechanism (like listening to music when anxious), suggest turning it into a formal habit ('habit_suggestion').
                - If you find a recurring theme or unresolved issue, highlight it as a pattern ('pattern_insight').
            3.  **Provide Details:** For each suggestion, provide a concise title and description. Include the IDs of the records that support your finding.
            4.  **Format for Habits:** For 'habit_suggestion', also provide a suggested name, icon, and color for the new habit.
            5.  **Output:** Return ONLY a single, valid JSON object conforming to the schema. If no strong patterns are found, return an empty "suggestions" array.

            **Recent Records:**
            ${recordsAsText}
        `;

        const response = await withRetry(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: suggestionSchema,
            },
        }));

        const jsonString = response.text;
        if (!jsonString) return [];
        
        const result = JSON.parse(jsonString);
        return (result.suggestions || []).map((s: any) => ({
            id: crypto.randomUUID(),
            type: s.type,
            title: s.title,
            description: s.description,
            relatedRecordIds: s.relatedRecordIds,
            action: s.actionLabel && s.habitData ? { label: s.actionLabel, data: s.habitData } : undefined,
        }));

    } catch (error) {
        console.error("Error generating proactive suggestions:", error);
        return [];
    }
};
