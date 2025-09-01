import {z} from 'genkit';

export const GetFarmInsightsInputSchema = z.object({
  crop: z.string().describe('The name of the crop.'),
  region: z.string().describe('The geographical region or state.'),
  plantingDate: z.string().describe('The date the crop was planted in YYYY-MM-DD format.'),
  mandi: z.string().optional().describe('The optional local mandi for market price context.'),
  language: z.string().describe('The language for the response.'),
});
export type GetFarmInsightsInput = z.infer<typeof GetFarmInsightsInputSchema>;

const InsightSchema = z.object({
  priority: z.enum(['High', 'Medium', 'Low']).describe('The priority level of the insight.'),
  category: z.enum(['Weather', 'Disease', 'Irrigation', 'Market', 'General']).describe('The category of the insight.'),
  title: z.string().describe('A short, clear title for the insight (e.g., "Heavy Rain Expected", "High Risk of Blight").'),
  recommendation: z.string().describe('A concise, actionable recommendation for the farmer, including the rationale (e.g., "Apply a preventive spray. Why: High humidity is forecasted...")'),
  source: z.string().describe('The primary data source for the insight (e.g., "Weather Forecast", "Disease Risk Model", "Market Analysis").'),
});

export const GetFarmInsightsOutputSchema = z.object({
  insights: z.array(InsightSchema).describe('A prioritized list of actionable insights for the farmer for the upcoming week.'),
});
export type GetFarmInsightsOutput = z.infer<typeof GetFarmInsightsOutputSchema>;
