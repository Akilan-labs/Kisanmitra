
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
  prompt: `You are an expert in carbon credit estimation for agricultural projects, using IPCC default methodologies. Your task is to provide a simplified carbon credit estimate for a farmer.

  **Instructions:**

  1.  **Analyze Inputs:** Review the project details provided below.
  2.  **Select Methodology:** Based on the \`projectType\`, use the appropriate IPCC guidelines (2006 or 2019 refinements) for Agriculture, Forestry and Other Land Use (AFOLU).
      *   For \`agroforestry\`, calculate CO₂ sequestration based on tree growth. Use a default annual sequestration rate for the specified region. Assume a generic mixed-species, fast-growing tree type suitable for agroforestry.
      *   For \`rice_cultivation\`, estimate the reduction in methane (CH₄) emissions based on improved water and tillage management practices compared to a baseline of continuous flooding and conventional tillage.
  3.  **Perform Calculation:**
      *   Use web search to find conservative, scientifically-backed IPCC default values for biomass accumulation (for trees) or emission factors (for rice methane) for the specified \`region\`.
      *   Calculate the total estimated annual carbon credits and express them in tonnes of CO₂ equivalent (tCO₂e).
  4.  **Explain the Calculation:** Briefly and simply explain how you arrived at the estimate. Mention the IPCC guidelines used.
  5.  **Estimate Revenue:** Provide a potential revenue range in USD, assuming a conservative market price for carbon credits (e.g., $5 to $15 per tCO₂e).
  6.  **Provide Next Steps:** Give the farmer clear, simple, and actionable next steps on how they could get started with a formal carbon project.

  **Project Details:**
  *   Project Type: {{{projectType}}}
  *   Hectares: {{{hectares}}}
  *   Region: {{{region}}}
  {{#if treeCount}}*   Number of Trees: {{{treeCount}}}{{/if}}
  {{#if waterManagement}}*   Water Management: {{{waterManagement}}}{{/if}}
  {{#if tillage}}*   Tillage Practice: {{{tillage}}}{{/if}}

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
