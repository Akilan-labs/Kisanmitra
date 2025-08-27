
'use server';

/**
 * @fileOverview A general-purpose conversational AI flow.
 *
 * - askAI - A function that handles conversational queries.
 * - AskAIInput - The input type for the askAI function.
 * - AskAIOutput - The return type for the askAI function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AskAIInputSchema = z.object({
  query: z.string().describe('The user\'s question or message.'),
  language: z.string().describe('The language for the response.'),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    text: z.string(),
  })).optional().describe('The conversation history.'),
});
export type AskAIInput = z.infer<typeof AskAIInputSchema>;

const AskAIOutputSchema = z.object({
  answer: z.string().describe('The AI\'s response to the user\'s query.'),
});
export type AskAIOutput = z.infer<typeof AskAIOutputSchema>;

export async function askAI(input: AskAIInput): Promise<AskAIOutput> {
  return askAIFlow(input);
}

const prompt = ai.definePrompt({
  name: 'askAIPrompt',
  input: {schema: AskAIInputSchema},
  output: {schema: AskAIOutputSchema},
  prompt: `You are KisanMitra, an expert AI assistant for farmers. Your goal is to provide helpful, accurate, and concise advice on a wide range of agricultural topics.
Always answer in the user's specified language.

User's Language: {{{language}}}

{{#if history}}
Conversation History:
{{#each history}}
{{#if (eq role 'user')}}User: {{text}}{{/if}}
{{#if (eq role 'assistant')}}Assistant: {{text}}{{/if}}
{{/each}}
{{/if}}

Current User Query: {{{query}}}
`,
});


const askAIFlow = ai.defineFlow(
  {
    name: 'askAIFlow',
    inputSchema: AskAIInputSchema,
    outputSchema: AskAIOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

