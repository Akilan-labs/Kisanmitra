import {z} from 'genkit';

export const GetFarmInsightsInputSchema = z.object({
  crop: z.string().describe('The name of the crop.'),
  region: z.string().describe('The geographical region or state.'),
  language: z.string().describe('The language for the response.'),
});
export type GetFarmInsightsInput = z.infer<typeof GetFarmInsightsInputSchema>;

const InsightSchema = z.object({
  priority: z.enum(['High', 'Medium', 'Low']).describe('The priority level of the insight.'),
  category: z.enum(['Weather', 'Disease', 'Irrigation', 'Market', 'General']).describe('The category of the insight.'),
  title: z.string().describe('A short, clear title for the insight (e.g., "Heavy Rain Expected", "High Risk of Blight").'),
  recommendation: z.string().describe('A concise, actionable recommendation for the farmer.'),
  source: z.string().describe('The source of the insight (e.g., "Weather Forecast", "Disease Risk Model").'),
});

export const GetFarmInsightsOutputSchema = z.object({
  insights: z.array(InsightSchema).describe('A prioritized list of actionable insights for the farmer for the upcoming week.'),
});
export type GetFarmInsightsOutput = z.infer<typeof GetFarmInsightsOutputSchema>;
