
import {z} from 'genkit';

export const GetCropRecommendationsInputSchema = z.object({
  currentCrop: z.string().describe('The name of the crop the farmer is currently growing.'),
  region: z.string().describe('The geographical region or state.'),
  language: z.string().describe('The language for the response.'),
  soilReport: z.string().optional().describe('Optional text data from a soil report (e.g., NPK values, pH).'),
  history: z.string().optional().describe('Optional text describing past treatments, yields, or issues for this field.'),
});
export type GetCropRecommendationsInput = z.infer<typeof GetCropRecommendationsInputSchema>;

const RecommendationSchema = z.object({
  cropName: z.string().describe('The name of the recommended crop.'),
  profitabilityScore: z.string().describe('A score for profitability (e.g., "High Profitability", "Medium Profitability").'),
  riskScore: z.string().describe('A score for risk (e.g., "Low Risk", "Medium Risk").'),
  profitabilityAnalysis: z.string().describe('A detailed analysis of the market demand, price trends, and expected yield that led to the profitability score.'),
  suitability: z.string().describe('A detailed analysis of the crop\'s suitability based on soil data, water needs, and climate.'),
  actionableAdvice: z.string().describe('Actionable advice for the farmer, including seed variety suggestions, sowing window, and key risks to prepare for.'),
});

export const GetCropRecommendationsOutputSchema = z.object({
  recommendations: z.array(RecommendationSchema).describe('A ranked list of the top 3 recommended crops.'),
});
export type GetCropRecommendationsOutput = z.infer<typeof GetCropRecommendationsOutputSchema>;
