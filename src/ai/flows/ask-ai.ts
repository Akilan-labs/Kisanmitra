'use server';

/**
 * @fileOverview A general-purpose conversational AI flow.
 *
 * - askAI - A function that handles conversational queries.
 * - AskAIInput - The input type for the askAI function.
 * - AskAIOutput - The return type for the askAI function.
 */

import {ai} from '@/ai/genkit';
import {MessageData} from 'genkit/model';
import {z} from 'zod';

const AskAIInputSchema = z.object({
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.array(z.object({
        text: z.string()
    })),
  })),
  language: z.string().describe('The language for the response.'),
});
export type AskAIInput = z.infer<typeof AskAIInputSchema>;

const AskAIOutputSchema = z.object({
  answer: z.string().describe("The AI's response to the user's query."),
});
export type AskAIOutput = z.infer<typeof AskAIOutputSchema>;

export async function askAI(input: AskAIInput): Promise<AskAIOutput> {
  return askAIFlow(input);
}


const askAIFlow = ai.defineFlow(
  {
    name: 'askAIFlow',
    inputSchema: AskAIInputSchema,
    outputSchema: AskAIOutputSchema,
  },
  async ({history, language}) => {
    const systemPrompt = `You are KisanMitra, an expert AI assistant for farmers. Your goal is to provide helpful, accurate, and concise advice on a wide range of agricultural topics. Always answer in the user's specified language: ${language}.`;

    const messages: MessageData[] = [
        {role: 'system', content: [{text: systemPrompt}]},
        ...history.map(msg => ({role: msg.role as 'user' | 'model', content: msg.content}))
    ]
    
    const response = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      messages: messages,
    });
    
    return {
      answer: response.text,
    };
  }
);
