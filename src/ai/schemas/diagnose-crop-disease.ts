
import {z} from 'genkit';

export const DiagnoseCropDiseaseInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the diseased crop, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
  language: z.string().describe('The language for the diagnosis and remedies.'),
});
export type DiagnoseCropDiseaseInput = z.infer<typeof DiagnoseCropDiseaseInputSchema>;

export const DiagnoseCropDiseaseOutputSchema = z.object({
  cropName: z.string().describe('The name of the crop identified from the image.'),
  disease: z.string().describe('The name of the disease or pest.'),
  severity: z.string().describe('The severity of the disease (e.g., Low, Medium, High).'),
  currentStage: z.string().describe('A detailed description of the current stage of the disease or pest infestation visible in the image.'),
  remedies: z.string().describe('General affordable remedies for the disease or pest.'),
  immediateSteps: z.string().describe('Immediate steps the farmer should take to save the crop.'),
  preventiveMeasures: z.string().describe('Detailed preventive measures to avoid this issue in the future.'),
  organicRemedies: z.string().describe('Organic and natural remedies for the identified disease/pest.'),
  chemicalRemedies: z.string().describe('Chemical-based (pesticide/fungicide) remedies for the identified disease/pest.'),
  diseaseProgression: z.string().describe('A forecast of how the disease will progress over time if left untreated, detailing the next stages and symptoms.'),
});
export type DiagnoseCropDiseaseOutput = z.infer<typeof DiagnoseCropDiseaseOutputSchema>;
