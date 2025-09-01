'use server';
/**
 * @fileOverview A "master" flow that synthesizes data from multiple sources to provide actionable farm insights.
 *
 * - getFarmInsights - A function that provides a prioritized list of recommendations.
 */

import {ai} from '@/ai/genkit';
import { getWeatherForecast } from './get-weather-forecast';
import { forecastDiseaseOutbreak } from './forecast-disease-outbreak';
import { getMarketPrice } from './get-market-price';
import { GetFarmInsightsInput, GetFarmInsightsInputSchema, GetFarmInsightsOutput, GetFarmInsightsOutputSchema } from '@/ai/schemas/farm-insights';


export async function getFarmInsights(input: GetFarmInsightsInput): Promise<GetFarmInsightsOutput> {
  return getFarmInsightsFlow(input);
}


const getFarmInsightsFlow = ai.defineFlow(
  {
    name: 'getFarmInsightsFlow',
    inputSchema: GetFarmInsightsInputSchema,
    outputSchema: GetFarmInsightsOutputSchema,
  },
  async (input) => {
    
    // In a real-world app, you might get the mandi from user preferences.
    // For now, we'll use a sensible default or make it optional.
    const mandi = input.mandi || input.region;

    const [weather, disease, market] = await Promise.all([
        getWeatherForecast({location: input.region, language: input.language}),
        forecastDiseaseOutbreak(input),
        getMarketPrice({crop: input.crop, mandi: mandi, language: input.language}).catch(() => null),
    ]);

    const farmDataContext = `
      Weather Forecast: ${JSON.stringify(weather, null, 2)}
      Disease Risk Forecast: ${JSON.stringify(disease, null, 2)}
      Market Price Data: ${market ? JSON.stringify(market, null, 2) : "Not available"}
    `;

    const prompt = `You are an expert farm manager AI, named KisanMitra. Your primary role is to synthesize various data points and provide a farmer with a simple, prioritized list of actionable insights for the upcoming week.

      Analyze the provided JSON data which contains the weather forecast, potential disease risks, and market price information for a farmer's crop and region.

      **Instructions:**
      1.  **Synthesize Data:** Review all available data (weather, disease, market). Identify critical connections. For example, does upcoming rain increase disease risk? Does a high market price suggest prioritizing harvest activities?
      2.  **Identify Key Insights:** Identify the most critical pieces of information that require the farmer's attention. Think about how weather impacts disease risk, irrigation needs, and other farm activities. How do market trends influence harvesting and selling decisions?
      3.  **Prioritize:** Assign a priority ('High', 'Medium', 'Low') to each insight. High priority should be for things that could cause significant crop loss or require immediate action (e.g., disease outbreak, heavy rain warning, significant price drop).
      4.  **Create Actionable Recommendations:** For each insight, create a short, clear title and a simple, actionable recommendation. The recommendation should be a concrete task the farmer can perform.
      5.  **Categorize & Source:** Assign a category to each insight and state the primary source of the information (e.g., "Weather Forecast", "Disease Risk Model", "Market Analysis").
      6.  **Filter Noise:** Do not create insights for normal or non-impactful events (e.g., "Partly cloudy skies with no rain"). Focus only on what matters. If a data source (like market price) is unavailable or shows no significant trend, do not generate an insight for it.

      Respond in the specified language: ${input.language}.

      **Farm Data Context:**
      ${farmDataContext}
    `;

    const llmResponse = await ai.generate({
      prompt: prompt,
      model: 'googleai/gemini-2.0-flash',
      output: {
        schema: GetFarmInsightsOutputSchema,
      },
    });

    return llmResponse.output || { insights: [] };
  }
);
