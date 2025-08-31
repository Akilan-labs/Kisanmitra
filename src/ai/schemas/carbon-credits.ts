
import {z} from 'zod';

export const EstimateCarbonCreditsInputSchema = z.object({
  projectType: z.enum(['agroforestry', 'rice_cultivation']).describe('The type of carbon project.'),
  hectares: z.number().positive().describe('The total area in hectares.'),
  region: z.string().describe('The geographical region or country for IPCC default values.'),
  language: z.string().describe('The language for the response.'),

  // Agroforestry specific
  treeCount: z.number().optional().describe('The number of trees planted.'),
  plantingYear: z.number().optional().describe('The year the trees were planted.'),
  
  // Rice Cultivation specific
  waterManagement: z.enum(['flooded', 'intermittent_awd', 'drained']).optional().describe('Water management practice for rice cultivation. AWD is Alternate Wetting and Drying.'),
  strawManagement: z.enum(['removed', 'incorporated_retained', 'burned']).optional().describe('How the rice straw is managed after harvest.'),
  plantingDate: z.string().optional().describe('The planting date of the rice crop (YYYY-MM-DD).'),
  harvestDate: z.string().optional().describe('The harvest date of the rice crop (YYYY-MM-DD).'),

  // Optional Photo
  photoDataUri: z.string().optional().describe(
    "An optional geo-tagged photo of the project area, as a data URI."
  ),
});
export type EstimateCarbonCreditsInput = z.infer<typeof EstimateCarbonCreditsInputSchema>;

export const EstimateCarbonCreditsOutputSchema = z.object({
  estimatedCredits: z.number().describe('The estimated annual carbon credits in tCO₂e (tonnes of CO₂ equivalent).'),
  explanation: z.string().describe('A simple explanation of how the estimate was calculated, mentioning the methodology (e.g., IPCC 2006/2019 Guidelines) and key factors used.'),
  potentialRevenue: z.string().describe('An estimated potential annual revenue range in USD, based on a typical carbon price range (e.g., $5-$15 per credit).'),
  nextSteps: z.string().describe('Simple, actionable next steps for the farmer to formally enroll in a carbon credit program.'),
});
export type EstimateCarbonCreditsOutput = z.infer<typeof EstimateCarbonCreditsOutputSchema>;
