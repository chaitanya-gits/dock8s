import { NextRequest, NextResponse } from "next/server";
import { QUIZ_QUESTIONS } from "@/lib/content";

export async function GET() {
  // Return questions without answers for client
  const questions = QUIZ_QUESTIONS.map(({ id, section, question, options }) => ({
    id, section, question, options
  }));
  return NextResponse.json(questions);
}

export async function POST(req: NextRequest) {
  const { questionId, selectedAnswer } = await req.json();
  const question = QUIZ_QUESTIONS.find(q => q.id === questionId);

  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const correct = selectedAnswer === question.answer;
  return NextResponse.json({
    correct,
    correctAnswer: question.answer,
    explanation: question.explanation
  });
}
