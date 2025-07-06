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
