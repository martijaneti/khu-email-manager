// Server-side only — never import from client components
import Anthropic from "@anthropic-ai/sdk";

export interface AIReplies {
  positive: string;
  neutral: string;
  negative: string;
}

export interface AIEmailContent {
  summary: string;
  replies: AIReplies;
}

const SYSTEM_PROMPT = `You are an AI email assistant. Given an email thread, produce:
1. A 1-sentence summary of the thread (concise, informative, third-person)
2. Three brief reply drafts in different tones

Respond in valid JSON only — no markdown, no explanation outside the JSON:
{
  "summary": "One sentence summarizing the thread.",
  "replies": {
    "positive": "Enthusiastic or agreeable reply (1-3 sentences).",
    "neutral": "Professional, non-committal reply (1-3 sentences).",
    "negative": "Politely declining or disagreeing reply (1-3 sentences)."
  }
}`;

function buildEmailContext(
  subject: string,
  messages: Array<{ from: string; date: string; body: string }>
): string {
  const bodies = messages
    .slice(-5) // cap at last 5 messages to keep token cost bounded
    .map((m) => `From: ${m.from}\nDate: ${m.date}\n\n${m.body.slice(0, 2000)}`)
    .join("\n\n---\n\n");
  return `Subject: ${subject}\n\n${bodies}`;
}

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  }
  return _client;
}

export async function generateEmailAI(
  subject: string,
  messages: Array<{ from: string; date: string; body: string }>
): Promise<AIEmailContent> {
  const emailContext = buildEmailContext(subject, messages);
  const model = process.env.CLAUDE_MODEL ?? "claude-haiku-4-5-20251001";

  const response = await client().messages.create({
    model,
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        // Cache the static system prompt across repeated calls in the same session
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: emailContext }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON in response");
    const parsed = JSON.parse(match[0]) as AIEmailContent;
    if (!parsed.summary || !parsed.replies?.positive) throw new Error("Incomplete response");
    return parsed;
  } catch {
    return {
      summary: "AI summary unavailable.",
      replies: {
        positive: "Thank you, sounds great!",
        neutral: "Thank you for your message. I'll follow up shortly.",
        negative: "Thank you for reaching out. I'm not able to proceed at this time.",
      },
    };
  }
}
