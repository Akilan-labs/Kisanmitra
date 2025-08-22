'use server';

/**
 * @fileOverview Forecasts potential crop disease outbreaks based on weather and crop type.
 *
 * - forecastDiseaseOutbreak - A function that handles the disease outbreak forecast.
 * - ForecastDiseaseOutbreakInput - The input type for the forecastDiseaseOutbreak function.
 * - ForecastDiseaseOutbreakOutput - The return type for the forecastDiseaseOutbreak function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ForecastDiseaseOutbreakInputSchema = z.object({
  crop: z.string().describe('The name of the crop.'),
  region: z.string().describe('The geographical region or state.'),
  language: z.string().describe('The language for the response.'),
});
export type ForecastDiseaseOutbreakInput = z.infer<typeof ForecastDiseaseOutbreakInputSchema>;

const DiseaseRiskSchema = z.object({
  diseaseName: z.string().describe('The name of the potential disease.'),
  riskLevel: z.enum(['Low', 'Medium', 'High', 'Very High']).describe('The calculated risk level for this disease.'),
  riskFactors: z.string().describe('The specific weather conditions and other factors contributing to this risk (e.g., "High humidity and moderate temperatures for the next 3 days").'),
  preventiveActions: z.string().describe('Specific, actionable preventive measures the farmer can take now to mitigate this risk.'),
});

const ForecastDiseaseOutbreakOutputSchema = z.object({
  forecastSummary: z.string().describe('A high-level summary of the disease risk for the upcoming week.'),
  diseaseRisks: z.array(DiseaseRiskSchema).describe('A list of potential diseases and their associated risks.'),
});
export type ForecastDiseaseOutbreakOutput = z.infer<typeof ForecastDiseaseOutbreakOutputSchema>;

export async function forecastDiseaseOutbreak(input: ForecastDiseaseOutbreakInput): Promise<ForecastDiseaseOutbreakOutput> {
  return forecastDiseaseOutbreakFlow(input);
}

const prompt = ai.definePrompt({
  name: 'forecastDiseaseOutbreakPrompt',
  input: {schema: ForecastDiseaseOutbreakInputSchema},
  output: {schema: ForecastDiseaseOutbreakOutputSchema},
  prompt: `You are an expert agricultural scientist and plant pathologist. Your task is to forecast the risk of crop disease outbreaks based on the crop type, region, and upcoming weather patterns.

  1.  **Analyze Inputs:**
      - Crop: {{{crop}}}
      - Region: {{{region}}}

  2.  **Fetch Weather Data:** Perform a web search to get the 7-day weather forecast for the specified region, focusing on temperature, humidity, rainfall, and leaf wetness duration if possible.

  3.  **Identify Potential Diseases:** Based on the crop and the fetched weather forecast, identify the most likely fungal, bacterial, or viral diseases that could emerge or spread.

  4.  **Assess Risk Level:** For each potential disease, assess the risk level (Low, Medium, High, Very High). Justify the assessment based on the specific weather conditions.

  5.  **Provide Preventive Actions:** For each identified risk, suggest concrete, actionable preventive measures. These should be practical for a farmer to implement.

  6.  **Summarize:** Provide a high-level summary of the overall disease risk for the next week.

  Respond in the specified language: {{{language}}}.
  `,
});

const forecastDiseaseOutbreakFlow = ai.defineFlow(
  {
    name: 'forecastDiseaseOutbreakFlow',
    inputSchema: ForecastDiseaseOutbreakInputSchema,
    outputSchema: ForecastDiseaseOutbreakOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
