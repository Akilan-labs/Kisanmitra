import { config } from 'dotenv';
config();

import '@/ai/flows/diagnose-crop-disease.ts';
import '@/ai/flows/find-government-schemes.ts';
import '@/ai/flows/get-market-price.ts';
import '@/ai/flows/speech-to-text.ts';
import '@/ai/flows/text-to-speech.ts';
