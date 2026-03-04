import { NextRequest, NextResponse } from "next/server";

// In-memory store for demo (in production this would be a database like Supabase/Redis)
// Vercel Edge KV or Upstash Redis would be the production choice
const progressStore: Record<string, { sections: string[]; quiz: string[]; score: number; lastActive: number }> = {};

function getSessionId(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : "anonymous";
  // Simple session key - in production use signed cookies
  return `session_${ip.replace(/\./g, "_")}`;
}

export async function GET(req: NextRequest) {
  const sessionId = getSessionId(req);
  const progress = progressStore[sessionId] || { sections: [], quiz: [], score: 0, lastActive: Date.now() };
  return NextResponse.json(progress);
}

export async function POST(req: NextRequest) {
  const sessionId = getSessionId(req);
  const body = await req.json();
  const current = progressStore[sessionId] || { sections: [], quiz: [], score: 0, lastActive: Date.now() };

  if (body.type === "section") {
    const sections = Array.from(new Set([...current.sections, body.sectionId]));
    progressStore[sessionId] = { ...current, sections, lastActive: Date.now() };
  } else if (body.type === "quiz") {
    const quiz = Array.from(new Set([...current.quiz, body.questionId]));
    const score = body.correct ? current.score + 1 : current.score;
    progressStore[sessionId] = { ...current, quiz, score, lastActive: Date.now() };
  }

  return NextResponse.json(progressStore[sessionId]);
}

export async function DELETE(req: NextRequest) {
  const sessionId = getSessionId(req);
  delete progressStore[sessionId];
  return NextResponse.json({ reset: true });
}
