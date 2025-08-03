'use server';

/**
 * @fileOverview Diagnoses crop diseases from an image and provides localized remedies.
 *
 * - diagnoseCropDisease - A function that handles the crop disease diagnosis process.
 * - DiagnoseCropDiseaseInput - The input type for the diagnoseCropdisease function.
 * - DiagnoseCropDiseaseOutput - The return type for the diagnoseCropdisease function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DiagnoseCropDiseaseInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the diseased crop, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  language: z.string().describe('The language for the diagnosis and remedies.'),
});
export type DiagnoseCropDiseaseInput = z.infer<typeof DiagnoseCropDiseaseInputSchema>;

const DiagnoseCropDiseaseOutputSchema = z.object({
  cropName: z.string().describe('The name of the crop identified from the image.'),
  disease: z.string().describe('The name of the disease or pest.'),
  severity: z.string().describe('The severity of the disease (e.g., Low, Medium, High).'),
  remedies: z.string().describe('General affordable remedies for the disease or pest.'),
  immediateSteps: z.string().describe('Immediate steps the farmer should take to save the crop.'),
  preventiveMeasures: z.string().describe('Detailed preventive measures to avoid this issue in the future.'),
  organicRemedies: z.string().describe('Organic and natural remedies for the identified disease/pest.'),
  chemicalRemedies: z.string().describe('Chemical-based (pesticide/fungicide) remedies for the identified disease/pest.'),
});
export type DiagnoseCropDiseaseOutput = z.infer<typeof DiagnoseCropDiseaseOutputSchema>;

export async function diagnoseCropDisease(input: DiagnoseCropDiseaseInput): Promise<DiagnoseCropDiseaseOutput> {
  return diagnoseCropDiseaseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'diagnoseCropDiseasePrompt',
  input: {schema: DiagnoseCropDiseaseInputSchema},
  output: {schema: DiagnoseCropDiseaseOutputSchema},
  prompt: `You are an expert in identifying plants and diagnosing crop diseases. Your analysis must be comprehensive and actionable for a farmer.

Analyze the image provided and follow these steps:

1.  **Identify the Crop:** First, identify the crop in the image.
2.  **Identify the Disease/Pest:** Analyze the image for signs of disease or pest infestation. Identify the specific issue.
3.  **Assess Severity:** Determine the severity of the problem (e.g., Low, Medium, High).
4.  **Provide Immediate Steps:** List the most critical actions the farmer should take right away to mitigate damage.
5.  **Suggest Remedies:**
    *   Provide a section for **General Remedies**.
    *   Provide a dedicated section for **Organic Remedies**.
    *   Provide a dedicated section for **Chemical Remedies**. Ensure remedies are affordable and likely to be locally available.
6.  **Outline Preventive Measures:** Detail the steps the farmer can take in the future to prevent a recurrence of this issue.

Respond in the specified language.

Language: {{{language}}}
Crop Image: {{media url=photoDataUri}}
  `,
});

const diagnoseCropDiseaseFlow = ai.defineFlow(
  {
    name: 'diagnoseCropDiseaseFlow',
    inputSchema: DiagnoseCropDiseaseInputSchema,
    outputSchema: DiagnoseCropDiseaseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
