
'use server';

import { z } from 'zod';
import {
  diagnoseCropDisease,
  type DiagnoseCropDiseaseInput,
  type DiagnoseCropDiseaseOutput,
} from '@/ai/flows/diagnose-crop-disease';
import {
  findGovernmentSchemes,
  type FindGovernmentSchemesInput,
  type FindGovernmentSchemesOutput,
} from '@/ai/flows/find-government-schemes';
import {
  getMarketPrice,
  type GetMarketPriceInput,
  type GetMarketPriceOutput,
} from '@/ai/flows/get-market-price';
import {
  speechToText,
  type SpeechToTextInput,
  type SpeechToTextOutput,
} from '@/ai/flows/speech-to-text';
import {
  textToSpeech,
  type TextToSpeechInput,
  type TextToSpeechOutput,
} from '@/ai/flows/text-to-speech';
import {
  predictYield,
  type PredictYieldInput,
  type PredictYieldOutput,
} from '@/ai/flows/predict-yield';
import {
  askAI,
  type AskAIInput,
  type AskAIOutput,
} from '@/ai/flows/ask-ai';
import {
  getWeatherForecast,
  type GetWeatherForecastInput,
  type GetWeatherForecastOutput,
} from '@/ai/flows/get-weather-forecast';
import {
  forecastDiseaseOutbreak,
  type ForecastDiseaseOutbreakInput,
  type ForecastDiseaseOutbreakOutput,
} from '@/ai/flows/forecast-disease-outbreak';
import {
    estimateCarbonCredits,
} from '@/ai/flows/estimate-carbon-credits';
import {
    EstimateCarbonCreditsInput,
    EstimateCarbonCreditsOutput
} from '@/ai/schemas/carbon-credits';
import {
    getFarmInsights,
} from '@/ai/flows/get-farm-insights';
import {
    GetFarmInsightsInput,
    GetFarmInsightsOutput
} from '@/ai/schemas/farm-insights';


const diagnoseCropDiseaseSchema = z.object({
  photoDataUri: z.string().min(1, 'Image is required.'),
  language: z.string(),
});

export async function diagnoseCropDiseaseAction(
  input: DiagnoseCropDiseaseInput
): Promise<{ success: true; data: DiagnoseCropDiseaseOutput } | { success: false; error: string }> {
  const parsed = diagnoseCropDiseaseSchema.safeParse(input);
  if (!parsed.success) {
    const errorMessage = parsed.error.flatten().fieldErrors.photoDataUri?.[0] ?? 'Invalid input.';
    return { success: false, error: errorMessage };
  }

  try {
    const result = await diagnoseCropDisease(parsed.data);
    return { success: true, data: result };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'An unexpected error occurred while diagnosing. Please try again.' };
  }
}

const getMarketPriceSchema = z.object({
  crop: z.string().min(1, 'Crop name is required.'),
  mandi: z.string().min(1, 'Mandi name is required.'),
  language: z.string(),
});

export async function getMarketPriceAction(
  input: GetMarketPriceInput
): Promise<{ success: true; data: GetMarketPriceOutput } | { success: false; error: string }> {
  const parsed = getMarketPriceSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Invalid input. Please provide both crop and mandi name.' };
  }

  try {
    const result = await getMarketPrice(parsed.data);
    return { success: true, data: result };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'An unexpected error occurred while fetching prices. Please try again.' };
  }
}

const findGovernmentSchemesSchema = z.object({
  query: z.string().min(3, 'Query must be at least 3 characters.'),
  language: z.string(),
});

export async function findGovernmentSchemesAction(
  input: FindGovernmentSchemesInput
): Promise<{ success: true; data: FindGovernmentSchemesOutput } | { success: false; error: string }> {
  const parsed = findGovernmentSchemesSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Invalid input. Please provide a longer query.' };
  }
  try {
    const result = await findGovernmentSchemes(parsed.data);
    return { success: true, data: result };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'An unexpected error occurred while finding schemes. Please try again.' };
  }
}

const speechToTextSchema = z.object({
  audio: z.string().min(1, 'Audio data is required.'),
  language: z.string(),
});

export async function speechToTextAction(
  input: SpeechToTextInput
): Promise<{ success: true; data: SpeechToTextOutput } | { success: false; error: string }> {
  const parsed = speechToTextSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Invalid audio input.' };
  }
  try {
    const result = await speechToText(parsed.data);
    return { success: true, data: result };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to transcribe audio. Please try again.' };
  }
}

const textToSpeechSchema = z.object({
  text: z.string().min(1, 'Text is required.'),
  language: z.string().optional(),
});

export async function textToSpeechAction(
  input: TextToSpeechInput
): Promise<{ success: true; data: TextToSpeechOutput } | { success: false; error: string }> {
  const parsed = textToSpeechSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Invalid text input.' };
  }
  try {
    const result = await textToSpeech(parsed.data);
    return { success: true, data: result };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to convert text to speech. Please try again.' };
  }
}

const predictYieldSchema = z.object({
  crop: z.string().min(2, 'Please enter a crop name.'),
  area: z.coerce.number().positive('Area must be a positive number.'),
  soilType: z.string().min(1, 'Please select a soil type.'),
  rainfall: z.coerce.number().positive('Rainfall must be a positive number.'),
  region: z.string().min(2, 'Please enter a region.'),
  language: z.string(),
  photoDataUri: z.string().optional(),
});

export async function predictYieldAction(
  input: PredictYieldInput
): Promise<{ success: true; data: PredictYieldOutput } | { success: false; error: string }> {
  const parsed = predictYieldSchema.safeParse(input);
  if (!parsed.success) {
    const errorMessage = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? 'Invalid input. Please check the form and try again.';
    return { success: false, error: errorMessage };
  }

  try {
    const result = await predictYield(parsed.data);
    return { success: true, data: result };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'An unexpected error occurred during yield prediction. Please try again.' };
  }
}

const askAISchema = z.object({
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.array(z.object({
        text: z.string()
    })),
  })),
  language: z.string(),
});


export async function askAIAction(
  input: AskAIInput
): Promise<{ success: true; data: AskAIOutput } | { success: false; error: string }> {
  const parsed = askAISchema.safeParse(input);
  if (!parsed.success) {
    const errorMessage = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? 'Invalid input.';
    return { success: false, error: errorMessage };
  }

  try {
    const result = await askAI(parsed.data);
    return { success: true, data: result };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
}

const getWeatherForecastSchema = z.object({
  location: z.string().min(2, 'Please enter a location.'),
  language: z.string(),
});

export async function getWeatherForecastAction(
  input: GetWeatherForecastInput
): Promise<{ success: true; data: GetWeatherForecastOutput } | { success: false; error: string }> {
  const parsed = getWeatherForecastSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Invalid input. Please provide a location.' };
  }
  try {
    const result = await getWeatherForecast(parsed.data);
    return { success: true, data: result };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'An unexpected error occurred while fetching the forecast. Please try again.' };
  }
}

const forecastDiseaseOutbreakSchema = z.object({
  crop: z.string().min(2, 'Please enter a crop name.'),
  region: z.string().min(2, 'Please enter a region.'),
  language: z.string(),
});

export async function forecastDiseaseOutbreakAction(
  input: ForecastDiseaseOutbreakInput
): Promise<{ success: true; data: ForecastDiseaseOutbreakOutput } | { success: false; error: string }> {
  const parsed = forecastDiseaseOutbreakSchema.safeParse(input);
  if (!parsed.success) {
    const errorMessage = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? 'Invalid input. Please check the form and try again.';
    return { success: false, error: errorMessage };
  }
  try {
    const result = await forecastDiseaseOutbreak(parsed.data);
    return { success: true, data: result };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'An unexpected error occurred during the forecast. Please try again.' };
  }
}


const estimateCarbonCreditsSchema = z.object({
    projectType: z.enum(['agroforestry', 'rice_cultivation']),
    hectares: z.coerce.number().positive(),
    region: z.string().min(2),
    language: z.string(),
    treeCount: z.coerce.number().optional(),
    plantingYear: z.coerce.number().optional(),
    waterManagement: z.enum(['flooded', 'intermittent_awd', 'drained']).optional(),
    strawManagement: z.enum(['removed', 'incorporated_retained', 'burned']).optional(),
    plantingDate: z.string().optional(),
    harvestDate: z.string().optional(),
    photoDataUri: z.string().optional(),
});


export async function estimateCarbonCreditsAction(
    input: EstimateCarbonCreditsInput
): Promise<{ success: true; data: EstimateCarbonCreditsOutput } | { success: false; error: string }> {
    const parsed = estimateCarbonCreditsSchema.safeParse(input);
    if (!parsed.success) {
        const errorMessage = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? 'Invalid input. Please check the form and try again.';
        return { success: false, error: errorMessage };
    }
    try {
        const result = await estimateCarbonCredits(parsed.data);
        return { success: true, data: result };
    } catch (error) {
        console.error(error);
        return { success: false, error: 'An unexpected error occurred during carbon credit estimation. Please try again.' };
    }
}

const getFarmInsightsSchema = z.object({
  crop: z.string().min(2, 'Please enter a crop name.'),
  region: z.string().min(2, 'Please enter a region.'),
  plantingDate: z.string().min(1, 'Please enter a planting date.'),
  language: z.string(),
  soilReport: z.string().optional(),
  history: z.string().optional(),
});

export async function getFarmInsightsAction(
  input: GetFarmInsightsInput
): Promise<{ success: true; data: GetFarmInsightsOutput } | { success: false; error: string }> {
    const parsed = getFarmInsightsSchema.safeParse(input);
    if (!parsed.success) {
        const errorMessage = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? 'Invalid input. Please check the form and try again.';
        return { success: false, error: errorMessage };
    }
    try {
        const result = await getFarmInsights(parsed.data);
        return { success: true, data: result };
    } catch (error) {
        console.error(error);
        return { success: false, error: 'An unexpected error occurred while generating insights. Please try again.' };
    }
}
