import { NextResponse } from "next/server";

type AskPayload = {
  question?: string;
  solution?: string;
};

const pasnexContext = `
Pasnex.ai is an AI automation platform for businesses.
It helps teams automate Instagram, Facebook, Messenger, WhatsApp, website enquiries, customer conversations, lead capture, qualification, follow-ups, support replies, appointment/demo booking, analytics, and team workflows.
Real provider API connections such as Meta, WhatsApp, Messenger, Telegram, and payment gateways require official provider approval and token setup.
Answer as Pasnex.ai assistant. Be clear, practical, honest, and concise. Do not promise live provider API connection unless approval/setup is complete.
`;

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
    const payload = (await request.json()) as AskPayload;
    const question = payload.question?.trim();
    const solution = payload.solution?.trim();

    if (!question) {
      return NextResponse.json({ error: "Please enter a question." }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "Pasnex.ai chat needs OPENAI_API_KEY in the environment before real AI replies can be enabled.",
        },
        { status: 503 },
      );
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "system",
            content: pasnexContext,
          },
          {
            role: "user",
            content: `Solution card: ${solution || "General"}\nCustomer question: ${question}`,
          },
        ],
        max_output_tokens: 220,
      }),
    });

    const data = (await response.json()) as {
      error?: { message?: string };
      output_text?: string;
      output?: Array<{
        content?: Array<{ text?: string }>;
      }>;
    };

    if (!response.ok) {
      return NextResponse.json({ error: data.error?.message ?? "Could not generate Pasnex.ai reply." }, { status: 500 });
    }

    const answer = data.output_text ?? data.output?.flatMap((item) => item.content ?? []).map((item) => item.text).join("\n").trim();

    return NextResponse.json({
      answer: answer || "Pasnex.ai can help with automation planning, but I could not prepare a reply right now.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Pasnex.ai chat is temporarily unavailable." },
      { status: 500 },
    );
  }
}
