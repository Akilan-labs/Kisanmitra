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
    
    // In parallel, fetch weather, disease, and market price data.
    const [weather, disease, market] = await Promise.all([
        getWeatherForecast({location: input.region, language: input.language}),
        forecastDiseaseOutbreak({crop: input.crop, region: input.region, language: input.language}),
        // Market price is optional and might fail, so we catch errors.
        getMarketPrice({crop: input.crop, mandi: input.region, language: input.language}).catch(() => null),
    ]);

    // Construct a context string with all the fetched data for the LLM.
    const farmDataContext = `
      Current Crop: ${input.crop}
      Region: ${input.region}
      Planting Date: ${input.plantingDate}
      ${input.soilReport ? `Soil Report: ${input.soilReport}` : ''}
      ${input.history ? `Past Crop & Treatment History: ${input.history}` : ''}
      Weather Forecast: ${JSON.stringify(weather, null, 2)}
      Disease Risk Forecast: ${JSON.stringify(disease, null, 2)}
      Market Price Data: ${market ? JSON.stringify(market, null, 2) : "Not available"}
    `;

    // The main prompt that instructs the AI on how to act.
    const prompt = `You are an expert farm manager AI, named KisanMitra. Your primary role is to synthesize various data points and provide a farmer with a simple, prioritized list of actionable insights for the upcoming week. The current date is ${new Date().toISOString().split('T')[0]}.

      Analyze the provided JSON data which contains the weather forecast, potential disease risks, and market price information for a farmer's crop and region. Also consider the farmer's soil report and past history if provided.

      **Instructions:**
      1.  **Estimate Growth Stage:** Based on the \`plantingDate\` and the current date, first estimate the crop's current growth stage (e.g., seedling, vegetative, flowering, grain fill, maturity). This context is critical for all subsequent recommendations.
      2.  **Synthesize Data:** Review all available data (weather, disease, market, soil report, history, crop growth stage). Identify critical connections. For example, does upcoming rain increase disease risk for a crop at its flowering stage? Does a low Nitrogen value in the soil report combined with the vegetative growth stage suggest a specific fertilizer application?
      3.  **Identify Key Insights & Create Recommendations:** For each key insight, create a short, clear title and a simple, actionable recommendation. The recommendation MUST be specific and quantitative.
          *   **For Fertilizers:** If a nutrient deficiency is likely (based on soil report, visual symptoms from history, or growth stage), recommend a specific fertilizer and **provide an application rate** (e.g., "Apply 25 kg/ha of Urea").
          *   **For Irrigation:** Based on the weather forecast, crop stage, and soil type (inferred from region if not provided), recommend a **specific irrigation schedule** (e.g., "Irrigate every 3 days with 2 inches of water," or "No irrigation needed due to expected rainfall").
          *   **For all recommendations:** The recommendation MUST include a short "Why" section explaining the reasoning in simple terms. Example: "Recommendation: Apply 25kg/ha of Urea. Why: Your soil report shows low Nitrogen and the crop is in its vegetative growth phase, which has high nitrogen demand."
      4.  **Prioritize:** Assign a priority ('High', 'Medium', 'Low') to each insight. High priority should be for things that could cause significant crop loss or require immediate action (e.g., disease outbreak, heavy rain warning, critical fertilization window).
      5.  **Categorize & Source:** Assign a category to each insight ('Weather', 'Disease', 'Irrigation', 'Market', 'Fertilizer', 'General') and state the primary source of the information (e.g., "Weather Forecast", "Disease Risk Model", "Soil Report").
      6.  **Filter Noise:** Do not create insights for normal or non-impactful events. Focus only on what matters.

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
