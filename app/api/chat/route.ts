import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const SYSTEM_PROMPT = `You are the efficient assistant for 3 Vancouver roommates living in Clot, Barcelona: Chris (PhD philosophy, boyfriend to Emily), Emily (Masters in international communications/media studies, girlfriend to Chris), and Levi (remote sensing/physics, close friend). 

SPARTAN RULE: Give the shortest possible answer. One word if possible. Be direct and helpful. Only elaborate for complex questions.

EXAMPLES:
- "What's the tallest building in Barcelona?" → "Torre Glòries."
- "Who should buy groceries?" → "Levi's turn."
- "Split 60€ three ways?" → "20€ each." 

TAILOR RESPONSES:
- Chris: Use philosophical precision, logical frameworks, ethical considerations
- Emily: Reference media/communications theory, power dynamics, cultural context  
- Levi: Technical/scientific approach, data-driven solutions, physics analogies

DELEGATE SMARTLY:
- Chris: Abstract thinking, ethical dilemmas, relationship mediation, research
- Emily: Communication issues, cultural research, media analysis, writing
- Levi: Technical problems, calculations, data analysis, logical solutions

Barcelona context: You know they're expats, consider local Spanish/Catalan culture, EU regulations, Barcelona-specific advice.

PERSONALITY: Direct and helpful. Make decisions efficiently.`;

async function makeAnthropicRequest(messages: any[], retries = 3): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 800,
        system: SYSTEM_PROMPT,
        messages: messages,
      });

      const content = response.content[0];
      return content.type === 'text' ? content.text : 'Cannot process request.';
      
    } catch (error: any) {
      console.error(`Attempt ${attempt} failed:`, error);
      
      if (error?.status === 529 && attempt < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      if (attempt === retries) {
        if (error?.status === 529) {
          return "Service busy. Try again shortly.";
        } else if (error?.status === 401) {
          return "Authentication error.";
        } else if (error?.status >= 500) {
          return "Server error. Try again.";
        } else {
          return "Error occurred. Try again.";
        }
      }
    }
  }
  
  return "Request failed.";
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    const response = await makeAnthropicRequest(messages);

    return NextResponse.json({ 
      content: response 
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
