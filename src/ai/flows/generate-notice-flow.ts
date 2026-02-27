
'use server';
/**
 * @fileOverview AI notice generation flow.
 *
 * - generateNotice - A function that generates professional school notice content.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateNoticeInputSchema = z.object({
  topic: z.string().describe('The topic or subject of the notice.'),
});
export type GenerateNoticeInput = z.infer<typeof GenerateNoticeInputSchema>;

const GenerateNoticeOutputSchema = z.object({
  title: z.string().describe('A suitable title for the notice.'),
  content: z.string().describe('The detailed content of the notice in Bengali.'),
});
export type GenerateNoticeOutput = z.infer<typeof GenerateNoticeOutputSchema>;

export async function generateNotice(input: GenerateNoticeInput): Promise<GenerateNoticeOutput> {
  return generateNoticeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateNoticePrompt',
  input: {schema: GenerateNoticeInputSchema},
  output: {schema: GenerateNoticeOutputSchema},
  prompt: `You are a professional school administrator. Your task is to write a formal and clear notice in Bengali for a high school.

Topic: {{{topic}}}

Requirements:
1. The title should be short and descriptive.
2. The content must be formal, respectful, and clearly state the information.
3. Use proper Bengali grammar and formal address (e.g., "সংশ্লিষ্ট সকলকে জানানো যাচ্ছে যে...").
4. If the topic is about a holiday, mention the reason and dates clearly.
5. Keep it concise but complete.`,
});

const generateNoticeFlow = ai.defineFlow(
  {
    name: 'generateNoticeFlow',
    inputSchema: GenerateNoticeInputSchema,
    outputSchema: GenerateNoticeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
