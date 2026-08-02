"use client";

import { useState } from "react";
import { trackCta } from "@/lib/track";

type AskPasnexCardProps = {
  solution: string;
  leadFormLink: string;
};

export function AskPasnexCard({ solution, leadFormLink }: AskPasnexCardProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const askPasnex = async () => {
    const cleanQuestion = question.trim();
    if (!cleanQuestion || isLoading) return;

    setIsLoading(true);
    setError("");
    setAnswer("");
    trackCta("ask_pasnex_ai", solution.toLowerCase().replaceAll(" ", "_"));

    try {
      const response = await fetch("/api/ask-pasnex", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: cleanQuestion, solution }),
      });
      const result = (await response.json()) as { answer?: string; error?: string };

      if (!response.ok || result.error) {
        throw new Error(result.error ?? "Pasnex.ai could not reply right now.");
      }

      setAnswer(result.answer ?? "");
    } catch (chatError) {
      setError(chatError instanceof Error ? chatError.message : "Pasnex.ai chat is temporarily unavailable.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-5 rounded-lg border border-blue-300/15 bg-blue-400/10 p-3" onClick={(event) => event.stopPropagation()}>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">Ask Pasnex.ai</p>
      <div className="mt-3 grid gap-2">
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          rows={3}
          placeholder={`Ask how ${solution.toLowerCase()} works for your business...`}
          className="resize-none rounded-lg border border-white/10 bg-[#030712] p-3 text-xs leading-5 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-300"
        />
        <button
          type="button"
          onClick={askPasnex}
          disabled={isLoading || question.trim().length === 0}
          className="rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Pasnex.ai is thinking..." : "Get AI Reply"}
        </button>
      </div>
      {answer && (
        <div className="mt-3 rounded-lg bg-[#07101d]/90 p-3 text-xs leading-5 text-slate-200">
          {answer}
          <a href={leadFormLink} className="mt-3 block font-bold text-blue-200 transition hover:text-white">
            Book a Demo
          </a>
        </div>
      )}
      {error && <p className="mt-3 rounded-lg border border-red-300/20 bg-red-400/10 p-3 text-xs leading-5 text-red-100">{error}</p>}
    </div>
  );
}
