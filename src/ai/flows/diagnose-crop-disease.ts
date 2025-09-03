
'use server';

/**
 * @fileOverview Diagnoses crop diseases from an image and provides localized remedies.
 *
 * - diagnoseCropDisease - A function that handles the crop disease diagnosis process.
 * - DiagnoseCropDiseaseInput - The input type for the diagnoseCropdisease function.
 * - DiagnoseCropDiseaseOutput - The return type for the diagnoseCropdisease function.
 */

import {ai} from '@/ai/genkit';
import { DiagnoseCropDiseaseInput, DiagnoseCropDiseaseInputSchema, DiagnoseCropDiseaseOutput, DiagnoseCropDiseaseOutputSchema } from '@/ai/schemas/diagnose-crop-disease';

export async function diagnoseCropDisease(input: DiagnoseCropDiseaseInput): Promise<DiagnoseCropDiseaseOutput> {
  return diagnoseCropDiseaseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'diagnoseCropDiseasePrompt',
  input: {schema: DiagnoseCropDiseaseInputSchema},
  output: {schema: DiagnoseCropDiseaseOutputSchema},
  prompt: `You are an expert in identifying plants and diagnosing crop diseases. Your analysis must be comprehensive and actionable for a farmer.

Analyze the image provided and follow these steps precisely to generate your response in the specified language.

1.  **Identify the Crop:** First, identify the crop in the image. Set this to the 'cropName' field.
2.  **Identify the Disease/Pest:** Analyze the image for signs of disease or pest infestation. Identify the specific issue. Set this to the 'disease' field.
3.  **Assess Severity:** Determine the severity of the problem (e.g., Low, Medium, High). Set this to the 'severity' field.
4.  **Describe Current Stage:** Based on the visual evidence in the photo, describe the current observable stage of the disease (e.g., "Early stage with small yellow spots on lower leaves," "Advanced infestation with visible larvae and significant leaf damage"). Set this to the 'currentStage' field.
5.  **Forecast Disease Progression:** Describe the likely next stages and symptoms of the disease if it is left untreated over the next 1-3 weeks. This is critical. Set this to the 'diseaseProgression' field.
6.  **Provide Immediate Steps:** List the most critical actions the farmer should take right away to mitigate damage. Set this to the 'immediateSteps' field.
7.  **Suggest General Remedies**: Provide a section for general, affordable, and locally available remedies. Set this to the 'remedies' field.
8.  **Suggest Organic Remedies**: Provide a dedicated section for organic or natural remedies. Set this to the 'organicRemedies' field.
9.  **Suggest Chemical Remedies**: Provide a dedicated section for chemical-based (pesticide/fungicide) remedies. Set this to the 'chemicalRemedies' field.
10. **Outline Preventive Measures:** Detail the steps the farmer can take in the future to prevent a recurrence of this issue. Set this to the 'preventiveMeasures' field.

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

