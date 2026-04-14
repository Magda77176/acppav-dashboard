import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const GEMINI_KEY = 'AIzaSyAd8d0buBn_Lj-V339YXv9UHVoqI8LvFGQ';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text || text.length < 3) return NextResponse.json({ fixed: text });

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Fix this badly transcribed speech. The speaker is a French AI engineer speaking English in a job interview. French company/tech names are often garbled.

Known terms: La Compagnie des Animaux, Agence AARON, ACPPAV, Anthropic Claude, LangChain, LangGraph, Qdrant, Ollama, OpenClaw, ShipUp, Shippingbo, intelligence artificielle, ingénieur, orchestration, RAG, LLM, NLP, DevOps, CI/CD

Bad transcript: "${text}"

Return ONLY the corrected text, nothing else:` }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 150 },
        }),
      }
    );

    const data = await res.json();
    const fixed = (data.candidates?.[0]?.content?.parts?.[0]?.text || text).trim().replace(/^["']|["']$/g, '');
    return NextResponse.json({ fixed });
  } catch {
    return NextResponse.json({ fixed: "" });
  }
}
