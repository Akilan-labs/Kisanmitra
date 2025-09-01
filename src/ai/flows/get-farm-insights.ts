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
    
    const mandi = input.mandi || input.region;

    // In parallel, fetch weather, disease, and market price data.
    const [weather, disease, market] = await Promise.all([
        getWeatherForecast({location: input.region, language: input.language}),
        forecastDiseaseOutbreak({crop: input.crop, region: input.region, language: input.language}),
        // Market price is optional and might fail, so we catch errors.
        getMarketPrice({crop: input.crop, mandi: mandi, language: input.language}).catch(() => null),
    ]);

    // Construct a context string with all the fetched data for the LLM.
    const farmDataContext = `
      Current Crop: ${input.crop}
      Region: ${input.region}
      Planting Date: ${input.plantingDate}
      Weather Forecast: ${JSON.stringify(weather, null, 2)}
      Disease Risk Forecast: ${JSON.stringify(disease, null, 2)}
      Market Price Data: ${market ? JSON.stringify(market, null, 2) : "Not available"}
    `;

    // The main prompt that instructs the AI on how to act.
    const prompt = `You are an expert farm manager AI, named KisanMitra. Your primary role is to synthesize various data points and provide a farmer with a simple, prioritized list of actionable insights for the upcoming week. The current date is ${new Date().toISOString().split('T')[0]}.

      Analyze the provided JSON data which contains the weather forecast, potential disease risks, and market price information for a farmer's crop and region. The planting date is provided, use it to estimate the current growth stage of the crop.

      **Instructions:**
      1.  **Synthesize Data:** Review all available data (weather, disease, market, crop growth stage). Identify critical connections. For example, does upcoming rain increase disease risk for a crop at its flowering stage? Does a high market price suggest prioritizing harvest activities for a mature crop?
      2.  **Identify Key Insights:** Identify the most critical pieces of information that require the farmer's attention. Think about how weather impacts disease risk, irrigation needs, and other farm activities. How do market trends influence harvesting and selling decisions?
      3.  **Prioritize:** Assign a priority ('High', 'Medium', 'Low') to each insight. High priority should be for things that could cause significant crop loss or require immediate action (e.g., disease outbreak, heavy rain warning, critical fertilization window).
      4.  **Create Actionable Recommendations:** For each insight, create a short, clear title and a simple, actionable recommendation. The recommendation is the most important part. It MUST include a short "Why" section explaining the reasoning in simple terms. For example: "Recommendation: Apply a preventive spray. Why: High humidity is forecasted, which increases the risk of blight on a flowering crop."
      5.  **Categorize & Source:** Assign a category to each insight ('Weather', 'Disease', 'Irrigation', 'Market', 'General') and state the primary source of the information (e.g., "Weather Forecast", "Disease Risk Model", "Market Analysis").
      6.  **Filter Noise:** Do not create insights for normal or non-impactful events (e.g., "Partly cloudy skies with no rain"). Focus only on what matters. If a data source (like market price) is unavailable or shows no significant trend, do not generate an insight for it.
      7.  **Be Proactive:** Phrase recommendations proactively. Instead of just stating facts, suggest actions.

      Respond in the specified language: ${input.language}.

      **Farm Data Context:**
      ${farmDataContext}
    `;

    // Generate the insights using the constructed prompt and data.
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
