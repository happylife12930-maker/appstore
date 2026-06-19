'use server';
/**
 * @fileOverview A Genkit flow for generating project quotations based on a client's request.
 *
 * - generateProjectQuotation - A function that handles the project quotation generation process.
 * - GenerateProjectQuotationInput - The input type for the generateProjectQuotation function.
 * - GenerateProjectQuotationOutput - The return type for the generateProjectQuotation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateProjectQuotationInputSchema = z.object({
  clientRequestDescription: z
    .string()
    .describe("A high-level description of the client's project request."),
});
export type GenerateProjectQuotationInput = z.infer<
  typeof GenerateProjectQuotationInputSchema
>;

const GenerateProjectQuotationOutputSchema = z.object({
  suggestedRequirements: z
    .array(z.string())
    .describe("A list of suggested requirements for the project."),
  estimatedCost: z
    .number()
    .describe("The estimated cost of the project in Egyptian Pounds (EGP)."),
  executionTimelineDays: z
    .number()
    .describe("The estimated duration of the project in days."),
  notes: z
    .string()
    .describe("Any additional notes or considerations for the quotation."),
});
export type GenerateProjectQuotationOutput = z.infer<
  typeof GenerateProjectQuotationOutputSchema
>;

export async function generateProjectQuotation(
  input: GenerateProjectQuotationInput
): Promise<GenerateProjectQuotationOutput> {
  return generateProjectQuotationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateProjectQuotationPrompt',
  input: {schema: GenerateProjectQuotationInputSchema},
  output: {schema: GenerateProjectQuotationOutputSchema},
  prompt: `You are an expert project manager and an AI assistant specialized in creating detailed and accurate project quotations for web and Android application development.

Based on the following high-level client request description, provide a comprehensive project quotation including suggested requirements, an estimated cost in Egyptian Pounds (EGP), an execution timeline in days, and any additional notes.

Client Request Description:
{{{clientRequestDescription}}}

Ensure that the output strictly adheres to the specified JSON schema for 'GenerateProjectQuotationOutput'.`,
});

const generateProjectQuotationFlow = ai.defineFlow(
  {
    name: 'generateProjectQuotationFlow',
    inputSchema: GenerateProjectQuotationInputSchema,
    outputSchema: GenerateProjectQuotationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
