'use server';
/**
 * @fileOverview Get Market Price flow for farmers.
 *
 * - getMarketPrice - A function that retrieves the market price of a crop.
 * - GetMarketPriceInput - The input type for the getMarketPrice function.
 * - GetMarketPriceOutput - The return type for the getMarketPrice function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetMarketPriceInputSchema = z.object({
  crop: z.string().describe('The crop to get the market price for.'),
  mandi: z.string().describe('The local mandi to get the price from.'),
  language: z.string().describe('The language to respond in.'),
});
export type GetMarketPriceInput = z.infer<typeof GetMarketPriceInputSchema>;

const GetMarketPriceOutputSchema = z.object({
  price: z.string().describe('The current market price of the crop.'),
  trendAnalysis: z.string().describe('The trend analysis of the market price.'),
});
export type GetMarketPriceOutput = z.infer<typeof GetMarketPriceOutputSchema>;

export async function getMarketPrice(input: GetMarketPriceInput): Promise<GetMarketPriceOutput> {
  return getMarketPriceFlow(input);
}

const getMarketPricePrompt = ai.definePrompt({
  name: 'getMarketPricePrompt',
  input: {schema: GetMarketPriceInputSchema},
  output: {schema: GetMarketPriceOutputSchema},
  prompt: `You are an expert market analyst for farmers.

You will retrieve the current market price of the crop from the specified mandi.
Then you will analyze the price trends and suggest the best selling time.

Crop: {{{crop}}}
Mandi: {{{mandi}}}
Language: {{{language}}}

Respond in {{{language}}}`,
});

const getMarketPriceFlow = ai.defineFlow(
  {
    name: 'getMarketPriceFlow',
    inputSchema: GetMarketPriceInputSchema,
    outputSchema: GetMarketPriceOutputSchema,
  },
  async input => {
    const {output} = await getMarketPricePrompt(input);
    return output!;
  }
);
