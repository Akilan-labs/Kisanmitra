'use server';

/**
 * @fileOverview Implements the FindGovernmentSchemes flow to search for and explain government schemes.
 *
 * - findGovernmentSchemes - A function that handles the government scheme search process.
 * - FindGovernmentSchemesInput - The input type for the findGovernmentSchemes function.
 * - FindGovernmentSchemesOutput - The return type for the findGovernmentSchemes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FindGovernmentSchemesInputSchema = z.object({
  query: z.string().describe('The query to search for government schemes.'),
  language: z.string().describe('The language for the response.'),
});
export type FindGovernmentSchemesInput = z.infer<typeof FindGovernmentSchemesInputSchema>;

const FindGovernmentSchemesOutputSchema = z.object({
  schemes: z.array(
    z.object({
      title: z.string().describe('The title of the government scheme.'),
      eligibility: z.string().describe('The eligibility criteria for the scheme.'),
      benefits: z.string().describe('The benefits of the scheme.'),
      applicationProcess: z
        .string()
        .describe('The process to apply for the scheme.'),
      link: z.string().optional().describe('Link to the scheme details.'),
    })
  ).describe('A list of government schemes.'),
});
export type FindGovernmentSchemesOutput = z.infer<typeof FindGovernmentSchemesOutputSchema>;

export async function findGovernmentSchemes(
  input: FindGovernmentSchemesInput
): Promise<FindGovernmentSchemesOutput> {
  return findGovernmentSchemesFlow(input);
}

const findGovernmentSchemesPrompt = ai.definePrompt({
  name: 'findGovernmentSchemesPrompt',
  input: {schema: FindGovernmentSchemesInputSchema},
  output: {schema: FindGovernmentSchemesOutputSchema},
  prompt: `You are an AI assistant helping farmers find relevant government schemes.
  Based on the farmer's query, search for relevant schemes and provide a simple explanation of eligibility, benefits, and the application process.

  Respond in the specified language: {{{language}}}
  Query: {{{query}}}
  `,
});

const findGovernmentSchemesFlow = ai.defineFlow(
  {
    name: 'findGovernmentSchemesFlow',
    inputSchema: FindGovernmentSchemesInputSchema,
    outputSchema: FindGovernmentSchemesOutputSchema,
  },
  async input => {
    const {output} = await findGovernmentSchemesPrompt(input);
    return output!;
  }
);
