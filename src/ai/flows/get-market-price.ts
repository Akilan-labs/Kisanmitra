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
  prompt: `You are an expert market analyst for Indian agricultural markets. Your goal is to provide the most recent, real-time market price available.

**Task:**
Provide the current market price, a trend analysis, and historical data for a specific crop in a given mandi (market).

**Instructions:**
1.  **Prioritize Recency:** Perform a web search to find **today's closing price** or the absolute most recent price for the given crop in the specified mandi. State the date of the price you find.
2.  **Find Fallbacks:** If an exact match for the mandi isn't found, use a major nearby market in the same state. Clearly state which mandi you are using.
3.  **Provide Current Price:** The primary output must be the most recent price found.
4.  **Gather Historical Data:** Provide price points for the last 7 days to show a trend. If daily data is not available, provide what you can and note the gaps.
5.  **Generate Trend Analysis:** Based on the historical data, generate a concise trend analysis (e.g., "Prices have been stable," "Prices are trending upwards," "Volatile market this week").
6.  **Use INR:** All monetary values must be in Indian Rupees (INR).

Respond in the language specified: {{{language}}}.

**Query:**
*   **Crop:** {{{crop}}}
*   **Mandi:** {{{mandi}}}
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
