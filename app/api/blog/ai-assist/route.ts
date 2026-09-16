import { rateLimit } from '@/lib/rate-limit';
import { streamText } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { isAdminAuthorized } from '@/lib/admin-auth';

export const runtime = 'nodejs';

const AI_PROMPTS: Record<string, string> = {
    improve: `You are an expert writing assistant. Improve the writing quality, clarity, and flow of the following content while maintaining the original meaning and voice. Focus on:
- Clearer sentence structure
- Better word choices
- Improved readability
- Fixed grammar and punctuation

Content to improve:`,

    summarize: `You are a skilled summarizer. Create a concise, engaging summary of the following content in 2-3 sentences. Capture the key points and main message:`,

    expand: `You are a content expansion expert. Expand on the following content with more details, examples, and insights. Add value by:
- Including relevant examples
- Providing additional context
- Adding supporting information
- Maintaining the original tone

Content to expand:`,

    simplify: `You are a communication expert. Simplify the following content to make it more accessible and easier to understand. Focus on:
- Shorter sentences
- Simpler vocabulary
- Clear explanations
- Removing jargon

Content to simplify:`,

    seo: `You are an SEO expert. Analyze the following content and provide specific suggestions to improve its search engine optimization:
- Headline improvements
- Keyword suggestions
- Structure recommendations
- Meta description suggestions

Content to analyze:`,

    hashtags: `You are a social media expert. Generate 5-10 relevant hashtags for the following content that would work well on Twitter/X and LinkedIn. Include a mix of popular and niche hashtags:`,

    // Social Media Specific Prompts
    twitter: `You are a social media manager for a tech influencer. Write a punchy, engaging Twitter thread (or single tweet if short) for this blog post. 
- Use a hook in the first line.
- Use the "staircase" formatting style (short lines progressing to longer ones or vice versa) for readability.
- Include 2-3 relevant hashtags.
- Keep it under 280 characters per tweet.
- End with a call to action to read the full post.
- Tone: Professional yet personal, exciting, "Captain's Log" vibe.

Content:`,

    linkedin: `You are a thought leader in AI and Software Engineering. Write a compelling LinkedIn post for this article.
- Start with a strong, attention-grabbing opening line.
- Use "staircase" formatting (varying line lengths) to create visual rhythm.
- Break down the key insights into bullet points.
- Ask a thought-provoking question at the end to encourage engagement.
- Tone: Professional, authoritative, insightful.
- Include relevant hashtags at the bottom.

Content:`,

    facebook: `Write an engaging Facebook post for this blog article.
- Focus on the personal journey or the "why" behind the post.
- Use a friendly, conversational tone.
- Make it easy into read with spacing.
- encourage friends and followers to share their thoughts.

Content:`,
};

export async function POST(req: Request) {
    const limited=await rateLimit(req,'ai-assist',8,600);if(limited)return limited;
    try {
        const { action, content, prompt } = await req.json();

        const PUBLIC_ACTIONS = new Set(["twitter", "linkedin", "facebook", "hashtags"]);
        const isPublicAction = PUBLIC_ACTIONS.has(action);
        if (!isPublicAction && !isAdminAuthorized(req)) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        if (!content || typeof content !== 'string' || content.length > 20000) {
            return new Response(
                JSON.stringify({ error: 'Content is required (max 20k chars)' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return new Response(
                JSON.stringify({ error: 'GROQ_API_KEY not configured' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const groq = createGroq({ apiKey });
        const systemPrompt = AI_PROMPTS[action] || prompt || AI_PROMPTS.improve;

        const result = await streamText({
            model: groq('qwen/qwen3-32b'),
            system: 'You are a professional writing assistant. Be helpful, concise, and provide actionable improvements.',
            messages: [
                {
                    role: 'user',
                    content: `${systemPrompt}\n\n---\n\n${content}`,
                },
            ],
            temperature: 0.7,
        });

        return result.toTextStreamResponse();
    } catch (error: unknown) {
        console.error('AI assist error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to process AI request';
        return new Response(
            JSON.stringify({ error: errorMessage }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
