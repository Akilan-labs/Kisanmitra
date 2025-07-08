'use server';

/**
 * @fileOverview Predicts crop yield based on various agricultural factors and an optional image.
 *
 * - predictYield - A function that handles the crop yield prediction process.
 * - PredictYieldInput - The input type for the predictYield function.
 * - PredictYieldOutput - The return type for the predictYield function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictYieldInputSchema = z.object({
  crop: z.string().describe('The name of the crop.'),
  area: z.number().positive().describe('The area of land in acres.'),
  soilType: z.string().describe('The type of soil (e.g., Loamy, Sandy, Clay).'),
  rainfall: z.number().positive().describe('The average annual rainfall in mm.'),
  region: z.string().describe('The geographical region or state.'),
  language: z.string().describe('The language for the response.'),
  photoDataUri: z.string().optional().describe(
    "An optional photo of the crop field, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
});
export type PredictYieldInput = z.infer<typeof PredictYieldInputSchema>;

const PredictYieldOutputSchema = z.object({
  predictedYield: z
    .string()
    .describe(
      'The predicted yield for the crop, including units (e.g., "10-12 tonnes per acre").'
    ),
  recommendations: z
    .string()
    .describe(
      'Actionable recommendations to improve yield, such as soil management, irrigation, and pest control.'
    ),
  confidence: z
    .string()
    .describe('The confidence level of the prediction (e.g., High, Medium, Low).'),
});
export type PredictYieldOutput = z.infer<typeof PredictYieldOutputSchema>;

export async function predictYield(input: PredictYieldInput): Promise<PredictYieldOutput> {
  return predictYieldFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictYieldPrompt',
  input: {schema: PredictYieldInputSchema},
  output: {schema: PredictYieldOutputSchema},
  prompt: `You are an expert agronomist and data scientist. Your task is to predict crop yield based on the provided factors.
{{#if photoDataUri}}
Use the provided image to assess crop health, density, and any visible signs of stress or disease. This should be a key factor in your prediction.
{{/if}}
Use your knowledge base and perform a web search for recent data related to crop yields for the specified region and conditions to improve your prediction.

1.  **Analyze the inputs:**
    -   Crop: {{{crop}}}
    -   Land Area: {{{area}}} acres
    -   Soil Type: {{{soilType}}}
    -   Annual Rainfall: {{{rainfall}}} mm
    -   Region: {{{region}}}
    {{#if photoDataUri}}-   Image Analysis: Use the image to inform your prediction.{{/if}}

2.  **Predict the Yield:** Based on the analysis, predict the likely yield. Provide a realistic range (e.g., "10-12 tonnes per acre").
3.  **Provide Recommendations:** Offer specific, actionable advice to improve the farmer's yield. This could include suggestions on fertilizer use, irrigation techniques, crop rotation, or pest management suitable for the region.
4.  **State Confidence Level:** Indicate your confidence in the prediction (High, Medium, or Low) and briefly explain why. For example, confidence might be lower if data for that specific region is scarce or if the image quality is poor.

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
