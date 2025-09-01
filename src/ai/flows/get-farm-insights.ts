'use server';
/**
 * @fileOverview A "master" flow that synthesizes data from multiple sources to provide actionable farm insights.
 *
 * - getFarmInsights - A function that provides a prioritized list of recommendations.
 */

import {ai} from '@/ai/genkit';
import { getWeatherForecast } from './get-weather-forecast';
import { forecastDiseaseOutbreak } from './forecast-disease-outbreak';
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

    const [weather, disease] = await Promise.all([
        getWeatherForecast(input),
        forecastDiseaseOutbreak(input),
    ]);

    const farmDataContext = `
      Weather Forecast: ${JSON.stringify(weather, null, 2)}
      Disease Risk Forecast: ${JSON.stringify(disease, null, 2)}
    `;

    const prompt = `You are an expert farm manager AI, named KisanMitra. Your primary role is to synthesize various data points and provide a farmer with a simple, prioritized list of actionable insights for the upcoming week.

      Analyze the provided JSON data which contains the weather forecast and potential disease risks for a farmer's crop and region.

      **Instructions:**
      1.  **Synthesize Data:** Review the weather and disease forecast data.
      2.  **Identify Key Insights:** Identify the most critical pieces of information that require the farmer's attention. Think about how weather impacts disease risk, irrigation needs, and other farm activities.
      3.  **Prioritize:** Assign a priority ('High', 'Medium', 'Low') to each insight. High priority should be for things that could cause significant crop loss or require immediate action.
      4.  **Create Actionable Recommendations:** For each insight, create a short, clear title and a simple, actionable recommendation. The recommendation should be something the farmer can do.
      5.  **Categorize:** Assign a category to each insight.
      6.  **Filter Noise:** Do not create insights for normal or non-impactful events (e.g., "Partly cloudy skies with no rain"). Focus only on what matters. For example, if there is no significant disease risk, do not generate a disease-related insight.

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
