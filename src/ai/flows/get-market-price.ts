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
    // In a real application, this would call an external API.
    // TODO: Replace the placeholder data below with a real API call to a service like Agmarknet or eNAM.
    // You will likely need to sign up for an API key and consult their documentation.
    
    /*
    // Here is an example of how you might fetch and adapt the data:
    try {
      // Replace with the actual API endpoint and your key
      const response = await fetch(`https://api.example.com/marketdata?crop=${encodeURIComponent(crop)}&mandi=${encodeURIComponent(mandi)}&apikey=YOUR_API_KEY`);
      if (!response.ok) {
        throw new Error('API response was not ok');
      }
      const data = await response.json();
      
      // Adapt the received data to match the required output structure.
      // This is just an example and will depend on the API's response format.
      const currentPrice = data.latestPrice;
      const priceHistory = data.historical.map(item => ({
        date: item.date, // ensure format is YYYY-MM-DD
        price: item.price,
      }));

      return { currentPrice, priceHistory };

    } catch (error) {
      console.error("Failed to fetch real-time market data:", error);
      // It's good practice to throw an error or handle it gracefully
      throw new Error('Could not fetch real-time market data. Please try again later.');
    }
    */

    // Placeholder data: Replace this with the live data from your API call.
    // This static data is returned to prevent the app from crashing while you implement the API call.
    console.warn(`[Placeholder Data] Simulating API call for crop: ${crop}, mandi: ${mandi}. Implement a real API call in src/ai/flows/get-market-price.ts.`);
    const today = new Date();
    const priceHistory = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() - (6 - i));
        return {
            date: date.toISOString().split('T')[0],
            // Static example prices
            price: parseFloat((1800 + i * 25 - (i % 3) * 40 + (crop.length % 5) * 15).toFixed(2)),
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
