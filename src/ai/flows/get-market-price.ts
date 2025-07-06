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
  price: z.number().describe('The current market price of the crop.'),
  trendAnalysis: z.string().describe('The trend analysis of the market price.'),
  priceHistory: z
    .array(
      z.object({
        date: z.string().describe('The date of the price point in YYYY-MM-DD format.'),
        price: z.number().describe('The price on that date.'),
      })
    )
    .describe('Historical price data for trend visualization.'),
});
export type GetMarketPriceOutput = z.infer<typeof GetMarketPriceOutputSchema>;

const fetchMarketDataTool = ai.defineTool(
  {
    name: 'fetchMarketDataTool',
    description: 'Fetches the current and historical market price for a given crop in a specific mandi.',
    inputSchema: z.object({
      crop: z.string().describe('The crop to get the market price for.'),
      mandi: z.string().describe('The local mandi to get the price from.'),
    }),
    outputSchema: z.object({
      currentPrice: z.number().describe('The current market price.'),
      priceHistory: z
        .array(
          z.object({
            date: z.string().describe('The date for the price point (YYYY-MM-DD).'),
            price: z.number().describe('The price on that date.'),
          })
        )
        .describe('The historical price data for the last 7 days.'),
    }),
  },
  async ({crop, mandi}) => {
    // Since a live API is unavailable, this tool simulates realistic market data.
    // The data is generated pseudo-randomly based on the inputs to ensure
    // consistent-yet-unique results for different crop/mandi combinations.

    const generateConsistentRandom = (seed: string): number => {
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // Convert to 32bit integer
      }
      const random = Math.abs(hash);
      return random;
    };

    const baseSeed = `${crop.toLowerCase()}-${mandi.toLowerCase()}`;
    const basePriceRandom = generateConsistentRandom(baseSeed);
    // Base price between 1000 and 5000
    const basePrice = 1000 + (basePriceRandom % 4001);

    const today = new Date();
    const priceHistory = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - i));
      
      const dateSeed = date.toISOString().split('T')[0];
      const dailyRandom = generateConsistentRandom(`${baseSeed}-${dateSeed}`);
      
      // Fluctuation of up to 10% of the base price
      const fluctuation = (dailyRandom % (basePrice / 5)) - (basePrice / 10);
      const finalPrice = basePrice + fluctuation;

      return {
          date: date.toISOString().split('T')[0],
          price: parseFloat(finalPrice.toFixed(2)),
      };
    });

    return {
      currentPrice: priceHistory[6].price,
      priceHistory: priceHistory,
    };
  }
);

export async function getMarketPrice(input: GetMarketPriceInput): Promise<GetMarketPriceOutput> {
  return getMarketPriceFlow(input);
}

const getMarketPricePrompt = ai.definePrompt({
  name: 'getMarketPricePrompt',
  tools: [fetchMarketDataTool],
  input: {schema: GetMarketPriceInputSchema},
  output: {schema: GetMarketPriceOutputSchema},
  prompt: `You are an expert market analyst for farmers.
Your task is to provide the current market price, a trend analysis, and historical data for a specific crop in a given mandi.

1. Use the 'fetchMarketDataTool' with the provided crop and mandi to get the latest price data.
2. From the tool's output, use the 'currentPrice' for the 'price' field in your final response.
3. Use the 'priceHistory' from the tool's output for the 'priceHistory' field in your final response.
4. Based on the 'priceHistory', generate a concise trend analysis and suggest the best selling time for the 'trendAnalysis' field.

Respond in the language specified: {{{language}}}.
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
