
import {z} from 'zod';

export const EstimateCarbonCreditsInputSchema = z.object({
  projectType: z.enum(['agroforestry', 'rice_cultivation']).describe('The type of carbon project.'),
  treeCount: z.number().optional().describe('The number of trees planted (for agroforestry).'),
  hectares: z.number().positive().describe('The total area in hectares.'),
  region: z.string().describe('The geographical region or country for IPCC default values.'),
  waterManagement: z.enum(['flooded', 'intermittent', 'drained']).optional().describe('Water management practice for rice cultivation.'),
  tillage: z.enum(['conventional', 'no-till']).optional().describe('Tillage practice for rice cultivation.'),
  language: z.string().describe('The language for the response.'),
});
export type EstimateCarbonCreditsInput = z.infer<typeof EstimateCarbonCreditsInputSchema>;

export const EstimateCarbonCreditsOutputSchema = z.object({
  estimatedCredits: z.number().describe('The estimated annual carbon credits in tCO₂e (tonnes of CO₂ equivalent).'),
  explanation: z.string().describe('A simple explanation of how the estimate was calculated, mentioning the methodology (e.g., IPCC 2006/2019 Guidelines).'),
  potentialRevenue: z.string().describe('An estimated potential annual revenue range in USD, based on a typical carbon price range (e.g., $5-$15 per credit).'),
  nextSteps: z.string().describe('Simple, actionable next steps for the farmer to formally enroll in a carbon credit program.'),
});
export type EstimateCarbonCreditsOutput = z.infer<typeof EstimateCarbonCreditsOutputSchema>;
