'use server';
/**
 * @fileOverview This file implements a Genkit flow for generating test cases.
 *
 * - generateTestCases - A function that generates test cases based on a feature description.
 * - GenerateTestCasesInput - The input type for the generateTestCases function.
 * - GenerateTestCasesOutput - The return type for the generateTestCases function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTestCasesInputSchema = z.object({
  featureDescription: z
    .string()
    .describe('A brief description of the application feature for which to generate test cases.'),
});
export type GenerateTestCasesInput = z.infer<typeof GenerateTestCasesInputSchema>;

const TestCaseSchema = z.object({
  testCaseId: z.string().describe('A unique identifier for the test case.'),
  scenario: z.string().describe('The specific scenario or condition being tested.'),
  expectedResult: z.string().describe('The expected outcome when the test case is executed.'),
  steps: z.array(z.string()).describe('A detailed list of steps to perform the test case.'),
});

const GenerateTestCasesOutputSchema = z.object({
  testCases: z.array(TestCaseSchema).describe('An array of generated test cases.'),
});
export type GenerateTestCasesOutput = z.infer<typeof GenerateTestCasesOutputSchema>;

export async function generateTestCases(
  input: GenerateTestCasesInput
): Promise<GenerateTestCasesOutput> {
  return generateTestCasesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTestCasesPrompt',
  input: {schema: GenerateTestCasesInputSchema},
  output: {schema: GenerateTestCasesOutputSchema},
  prompt: `As a highly experienced QA engineer, your task is to generate comprehensive test cases for a given application feature.

You need to generate:
- A unique Test Case ID.
- A clear Scenario describing the test.
- The Expected Result of the test.
- Detailed, step-by-step instructions to execute the test.

Generate at least 3 distinct test cases for the following feature description.

Feature Description: {{{featureDescription}}}`,
});

const generateTestCasesFlow = ai.defineFlow(
  {
    name: 'generateTestCasesFlow',
    inputSchema: GenerateTestCasesInputSchema,
    outputSchema: GenerateTestCasesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
