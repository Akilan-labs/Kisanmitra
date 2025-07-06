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
  price: z.number().describe('The current market price of the crop in INR.'),
  trendAnalysis: z.string().describe('The trend analysis of the market price.'),
  priceHistory: z
    .array(
      z.object({
        date: z.string().describe('The date of the price point in YYYY-MM-DD format.'),
        price: z.number().describe('The price on that date in INR.'),
      })
    )
    .describe('Historical price data for the last 7 days for trend visualization.'),
});
export type GetMarketPriceOutput = z.infer<typeof GetMarketPriceOutputSchema>;

export async function getMarketPrice(input: GetMarketPriceInput): Promise<GetMarketPriceOutput> {
  return getMarketPriceFlow(input);
}

const getMarketPricePrompt = ai.definePrompt({
  name: 'getMarketPricePrompt',
  input: {schema: GetMarketPriceInputSchema},
  output: {schema: GetMarketPriceOutputSchema},
  prompt: `You are an expert market analyst for Indian farmers.
Your task is to provide the current market price, a trend analysis, and historical data for a specific crop in a given mandi (market).

1. Search the web for the most up-to-date market price for the given crop in the specified mandi. If an exact match for the mandi isn't found, use a major nearby market in the same state.
2. Provide the current price. For historical data, provide price points for the last 7 days. If daily data isn't available, provide what you can find and note it.
3. Based on the data you find, generate a concise trend analysis.
4. All monetary values should be in Indian Rupees (INR).

Respond in the language specified: {{{language}}}.

Crop: {{{crop}}}
Mandi: {{{mandi}}}
`,
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
