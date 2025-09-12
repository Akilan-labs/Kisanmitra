import {z} from 'genkit';

export const PredictYieldInputSchema = z.object({
  crop: z.string().describe('The name of the crop.'),
  hectares: z.number().positive().describe('The area of land in hectares.'),
  soilType: z.string().describe('The type of soil (e.g., Loamy, Sandy, Clay).'),
  rainfall: z.number().positive().describe('The farmer\'s estimate of average annual rainfall in mm.'),
  region: z.string().describe('The geographical region or state.'),
  plantingDate: z.string().describe('The date the crop was planted in YYYY-MM-DD format.'),
  language: z.string().describe('The language for the response.'),
  photoDataUri: z.string().optional().describe(
    "An optional photo of the crop field, as a data URI. This is a critical input for assessing real-time crop health."
  ),
});
export type PredictYieldInput = z.infer<typeof PredictYieldInputSchema>;

export const PredictYieldOutputSchema = z.object({
  predictedYield: z
    .string()
    .describe(
      'The predicted yield for the crop, including units (e.g., "4.5 - 5.0 t/ha").'
    ),
  recommendations: z
    .string()
    .describe(
      'Actionable recommendations to improve yield, such as soil management, irrigation scheduling, and fertilizer optimization.'
    ),
  confidence: z
    .string()
    .describe('The confidence level of the prediction (e.g., High, Medium, Low) with a brief justification.'),
});
export type PredictYieldOutput = z.infer<typeof PredictYieldOutputSchema>;
