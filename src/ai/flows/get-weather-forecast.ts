'use server';

/**
 * @fileOverview Provides a weather forecast for a given location.
 *
 * - getWeatherForecast - A function that handles the weather forecast retrieval.
 * - GetWeatherForecastInput - The input type for the getWeatherForecast function.
 * - GetWeatherForecastOutput - The return type for the getWeatherForecast function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetWeatherForecastInputSchema = z.object({
  location: z.string().describe('The city or region for which to get the weather forecast.'),
  language: z.string().describe('The language for the response.'),
});
export type GetWeatherForecastInput = z.infer<typeof GetWeatherForecastInputSchema>;

const DailyForecastSchema = z.object({
    day: z.string().describe('The day of the week (e.g., Monday).'),
    date: z.string().describe('The date in YYYY-MM-DD format.'),
    highTemp: z.number().describe('The forecasted high temperature in Celsius.'),
    lowTemp: z.number().describe('The forecasted low temperature in Celsius.'),
    condition: z.string().describe('A brief description of the weather condition (e.g., "Sunny", "Partly Cloudy").'),
    icon: z.enum(['Sunny', 'Cloudy', 'Rainy', 'Windy', 'Snowy', 'Thunderstorm', 'PartlyCloudy']).describe("A machine-readable icon name for the weather condition."),
    humidity: z.number().describe('The average humidity percentage.'),
    windSpeed: z.number().describe('The average wind speed in km/h.'),
});

const GetWeatherForecastOutputSchema = z.object({
  current: z.object({
    temp: z.number().describe('The current temperature in Celsius.'),
    condition: z.string().describe('A brief description of the current weather condition.'),
    humidity: z.number().describe('The current humidity percentage.'),
    windSpeed: z.number().describe('The current wind speed in km/h.'),
  }),
  forecast: z.array(DailyForecastSchema).describe('A 5-day weather forecast.'),
  summary: z.string().describe('A short, farmer-focused summary of the weather for the week.'),
});
export type GetWeatherForecastOutput = z.infer<typeof GetWeatherForecastOutputSchema>;

export async function getWeatherForecast(input: GetWeatherForecastInput): Promise<GetWeatherForecastOutput> {
  return getWeatherForecastFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getWeatherForecastPrompt',
  input: {schema: GetWeatherForecastInputSchema},
  output: {schema: GetWeatherForecastOutputSchema},
  prompt: `You are a meteorological AI that provides weather forecasts specifically for farmers. 
  
  Your task is to provide a detailed and accurate weather report for the given location. Use web search to get the most current data.

  1.  **Current Conditions:** Provide the current temperature, weather condition, humidity, and wind speed.
  2.  **5-Day Forecast:** Provide a day-by-day forecast for the next 5 days. For each day, include:
      - Day of the week
      - Date
      - High and low temperature
      - Weather condition and a corresponding icon name
      - Average humidity
      - Average wind speed
  3.  **Farmer's Summary:** Write a brief, easy-to-understand summary of the week's weather, highlighting any conditions that might impact farming activities (e.g., heavy rain, high winds, heat waves).

  All temperatures must be in Celsius. All wind speeds must be in km/h.

  Respond in the specified language: {{{language}}}
  Location: {{{location}}}
  `,
});

const getWeatherForecastFlow = ai.defineFlow(
  {
    name: 'getWeatherForecastFlow',
    inputSchema: GetWeatherForecastInputSchema,
    outputSchema: GetWeatherForecastOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
