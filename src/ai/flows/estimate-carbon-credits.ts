
'use server';

/**
 * @fileOverview Estimates carbon credits for agroforestry and rice cultivation projects.
 *
 * - estimateCarbonCredits - A function that handles the carbon credit estimation.
 */

import {ai} from '@/ai/genkit';
import {
    EstimateCarbonCreditsInput,
    EstimateCarbonCreditsInputSchema,
    EstimateCarbonCreditsOutput,
    EstimateCarbonCreditsOutputSchema,
} from '@/ai/schemas/carbon-credits';

export async function estimateCarbonCredits(input: EstimateCarbonCreditsInput): Promise<EstimateCarbonCreditsOutput> {
  return estimateCarbonCreditsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'estimateCarbonCreditsPrompt',
  input: {schema: EstimateCarbonCreditsInputSchema},
  output: {schema: EstimateCarbonCreditsOutputSchema},
  prompt: `You are an expert in carbon credit estimation for agricultural projects, using IPCC default methodologies. Your task is to provide a simplified carbon credit estimate for a farmer based on the provided details.

**Instructions:**

1.  **Analyze Inputs:** Review the project details provided.
2.  **Select Methodology:** Based on the \`projectType\`, use the appropriate IPCC guidelines (2006 or 2019 refinements) for Agriculture, Forestry and Other Land Use (AFOLU).
    *   For \`agroforestry\`: Calculate CO₂ sequestration. Use the \`plantingYear\` to determine the age of the trees. Base the growth rate on a generic, fast-growing agroforestry species suitable for the \`region\`. The number of trees and project area are key inputs.
    *   For \`rice_cultivation\`: Estimate the reduction in methane (CH₄) emissions. The baseline is continuous flooding with conventional straw management. Use the specified \`waterManagement\` (e.g., Alternate Wetting & Drying - AWD) and \`strawManagement\` to apply IPCC emission factors and calculate the emissions *avoided* compared to the baseline.
3.  **Perform Calculation:**
    *   Use web search to find conservative, scientifically-backed IPCC default values for biomass accumulation (for trees) or emission factors (for rice methane) for the specified \`region\`.
    *   Calculate the total estimated annual carbon credits and express them in tonnes of CO₂ equivalent (tCO₂e). For rice, this is the CH₄ reduction converted to tCO₂e.
4.  **Explain the Calculation:** Briefly and simply explain how you arrived at the estimate. Mention the key factors used (e.g., "Based on 5-year-old trees..." or "By switching to AWD from continuous flooding...").
5.  **Estimate Revenue:** Provide a potential revenue range in USD, assuming a conservative market price for carbon credits (e.g., $5 to $15 per tCO₂e).
6.  **Provide Next Steps:** Give the farmer clear, simple, and actionable next steps on how they could get started with a formal carbon project.
{{#if photoDataUri}}
7.  **Photo Analysis**: Briefly mention that the provided photo can be used for future verification but do not perform an analysis of it.
{{/if}}

**Project Details:**
*   Project Type: {{{projectType}}}
*   Hectares: {{{hectares}}}
*   Region: {{{region}}}
{{#if treeCount}}*   Number of Trees: {{{treeCount}}}{{/if}}
{{#if plantingYear}}*   Planting Year: {{{plantingYear}}}{{/if}}
{{#if waterManagement}}*   Water Management: {{{waterManagement}}}{{/if}}
{{#if strawManagement}}*   Straw Management: {{{strawManagement}}}{{/if}}
{{#if plantingDate}}*   Planting Date: {{{plantingDate}}}{{/if}}
{{#if harvestDate}}*   Harvest Date: {{{harvestDate}}}{{/if}}

Respond in the specified language: {{{language}}}.
  `,
});

const estimateCarbonCreditsFlow = ai.defineFlow(
  {
    name: 'estimateCarbonCreditsFlow',
    inputSchema: EstimateCarbonCreditsInputSchema,
    outputSchema: EstimateCarbonCreditsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
