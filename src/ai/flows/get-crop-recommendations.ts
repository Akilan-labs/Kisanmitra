
'use server';
/**
 * @fileOverview An "AI Crop Switching Advisor" that recommends alternative crops based on a variety of factors.
 *
 * - getCropRecommendations - A function that provides a ranked list of crop recommendations.
 */

import {ai} from '@/ai/genkit';
import { GetCropRecommendationsInput, GetCropRecommendationsInputSchema, GetCropRecommendationsOutput, GetCropRecommendationsOutputSchema } from '@/ai/schemas/crop-recommendations';
import { forecastDiseaseOutbreak } from './forecast-disease-outbreak';
import { getMarketPrice } from './get-market-price';


export async function getCropRecommendations(input: GetCropRecommendationsInput): Promise<GetCropRecommendationsOutput> {
  return getCropRecommendationsFlow(input);
}


const getCropRecommendationsFlow = ai.defineFlow(
  {
    name: 'getCropRecommendationsFlow',
    inputSchema: GetCropRecommendationsInputSchema,
    outputSchema: GetCropRecommendationsOutputSchema,
  },
  async (input) => {
    
    const candidateCrops = ["Maize", "Soybean", "Groundnut", "Sorghum", "Millet", "Lentil", "Chickpea", "Cotton"].filter(c => c !== input.currentCrop);

    const dataPromises = candidateCrops.map(async (crop) => {
        const [disease, market] = await Promise.all([
            forecastDiseaseOutbreak({crop: crop, region: input.region, language: input.language}).catch(() => null),
            getMarketPrice({crop: crop, mandi: input.region, language: input.language}).catch(() => null),
        ]);
        return { crop, disease, market };
    });

    const cropData = await Promise.all(dataPromises);

    const context = `
      Current Crop: ${input.currentCrop}
      Region: ${input.region}
      Soil Report: ${input.soilReport || "Not provided"}
      Past History: ${input.history || "Not provided"}
      Candidate Crop Data: ${JSON.stringify(cropData, null, 2)}
    `;

    const prompt = `You are an expert agronomist and farm advisor. Your task is to act as an AI-Driven Crop Switching Advisor. Based on the provided data, recommend the top 3 alternative crops for a farmer for the next planting season.

      **Instructions:**

      1.  **Analyze Context:** Review all the provided context: the farmer's current crop, region, soil report, and past history. Also review the "Candidate Crop Data" which contains market price trends and disease risk forecasts for several potential alternative crops.
      2.  **Evaluate Each Candidate Crop:** For each candidate crop in the data, perform a thorough analysis:
          *   **Soil-Crop Suitability:** Based on the user's soil report (if available) and general knowledge of the crop's needs, assess how suitable the soil is for this crop. If no soil report is provided, use general knowledge about the soil in the specified region.
          *   **Water Availability/Use:** Consider typical water requirements for the crop versus the general climate of the region.
          *   **Market Analysis:** Analyze the provided market data. Is the price volatile? Is there a stable or upward trend?
          *   **Pest/Disease Risk:** Look at the disease forecast. Is this crop at high risk for diseases in this region?
      3.  **Calculate Profitability and Risk:** For each candidate, create a "Profitability Score" (e.g., "High", "Medium", "Low") and a "Risk Score" (e.g., "High", "Medium", "Low").
          *   **Profitability** should be a synthesis of market price trends and potential yield (based on soil suitability).
          *   **Risk** should be a synthesis of market price volatility and disease/pest risk.
      4.  **Rank and Select Top 3:** Based on your analysis, select the top 3 best alternative crops. The best crops are typically those with high profitability and low-to-medium risk.
      5.  **Generate Detailed Recommendations:** For each of the top 3 crops, provide a detailed breakdown in the required output format:
          *   **cropName:** The name of the crop.
          *   **profitabilityScore:** The calculated profitability score (e.g., "High Profitability").
          *   **riskScore:** The calculated risk score (e.g., "Low Risk").
          *   **profitabilityAnalysis:** A detailed explanation of why you assigned the profitability score, referencing market trends and yield potential.
          *   **suitability:** An analysis of the crop's suitability for the farmer's soil and environment.
          *   **actionableAdvice:** Concrete advice for the farmer, such as suggested seed varieties, expected sowing windows, and key disease risks to watch out for.

      **CRITICAL:** You must return a ranked list of exactly 3 crop recommendations.

      Respond in the specified language: ${input.language}.

      **Farm & Candidate Crop Data:**
      ${context}
    `;

    const llmResponse = await ai.generate({
      prompt: prompt,
      model: 'googleai/gemini-2.0-flash',
      output: {
        schema: GetCropRecommendationsOutputSchema,
      },
    });

    return llmResponse.output || { recommendations: [] };
  }
);
