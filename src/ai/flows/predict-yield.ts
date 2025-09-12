'use server';

/**
 * @fileOverview Predicts crop yield based on various agricultural factors and an optional image.
 *
 * - predictYield - A function that handles the crop yield prediction process.
 * - PredictYieldInput - The input type for the predictYield function.
 * - PredictYieldOutput - The return type for the predictYield function.
 */

import {ai} from '@/ai/genkit';
import { PredictYieldInput, PredictYieldInputSchema, PredictYieldOutput, PredictYieldOutputSchema } from '@/ai/schemas/predict-yield';


export async function predictYield(input: PredictYieldInput): Promise<PredictYieldOutput> {
  return predictYieldFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictYieldPrompt',
  input: {schema: PredictYieldInputSchema},
  output: {schema: PredictYieldOutputSchema},
  prompt: `You are an expert agronomist and data scientist specializing in crop yield prediction. Your task is to act as a context-aware, environment-aware, and soil-aware AI agent.

You will synthesize multiple data sources (simulated via web search and user inputs) to provide a precise yield forecast and actionable advice.

**Instructions:**

1.  **Analyze User Inputs:**
    *   Crop: {{{crop}}}
    *   Area: {{{hectares}}} hectares
    *   Soil Type: {{{soilType}}}
    *   Region: {{{region}}}
    *   Planting Date: {{{plantingDate}}}
    *   Farmer-provided Rainfall Estimate: {{{rainfall}}} mm/year
    {{#if photoDataUri}}
    *   Farmer-provided Photo: Analyze the image for crop health, density, color, and any visible signs of stress, disease, or nutrient deficiency. This is a critical, real-time data point.
    {{/if}}

2.  **Simulate Multi-Source Data Ingestion (via Web Search):**
    *   **Weather:** Search for recent and historical weather patterns for the specified region (temperature, precipitation). Compare with the farmer's rainfall estimate.
    *   **Soil Properties:** Search for typical soil properties (e.g., pH, organic matter) for the given soil type and region.
    *   **Satellite Data (Simulated):** Search for typical NDVI (Normalized Difference Vegetation Index) values for the specified crop at its current growth stage in that region. This will serve as a proxy for vegetation health and density.
    *   **Historical Yield:** Search for average historical yields for the given crop in that region to establish a baseline.

3.  **Perform Reasoning and Prediction:**
    *   **Estimate Growth Stage:** Based on the planting date and the current date, estimate the crop's current growth stage (e.g., vegetative, flowering, grain fill).
    *   **Synthesize Data:** Integrate all the information. For example: "The crop is in the grain-filling stage. The provided photo shows some yellowing, and typical NDVI for this stage is X, suggesting a potential nitrogen deficiency. Weather has been drier than average."
    *   **Predict Yield:** Based on your synthesis, predict the final yield in **tonnes per hectare (t/ha)**. Provide a realistic range (e.g., "4.5 - 5.0 t/ha").
    *   **State Confidence:** Assign a confidence level (High, Medium, Low) to your prediction and briefly explain your reasoning (e.g., "Medium confidence due to lack of specific soil test data, but photo analysis shows healthy crop density.").

4.  **Provide Actionable Outputs:**
    *   **Yield Forecast:** The predicted yield from the step above.
    *   **Actionable Recommendations:** Provide clear, concise recommendations to improve or secure the predicted yield. These should be based on your analysis. Examples: "Consider a top-dressing of 25kg/ha of Urea to address the observed yellowing and support grain development." or "Ensure consistent irrigation for the next 2 weeks as the crop is in a critical water-use stage and rainfall has been below average."

Respond in the specified language: {{{language}}}.

{{#if photoDataUri}}
Crop Field Image: {{media url=photoDataUri}}
{{/if}}
`,
});

const predictYieldFlow = ai.defineFlow(
  {
    name: 'predictYieldFlow',
    inputSchema: PredictYieldInputSchema,
    outputSchema: PredictYieldOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
