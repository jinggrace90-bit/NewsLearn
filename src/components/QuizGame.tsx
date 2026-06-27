"use client";

import { useState, useEffect } from "react";

interface Question {
  id: number;
  question: string;
  question_type: string;
  options: string[];
  correct_answer: number | null;
  explanation: string;
}

interface QuizGameProps {
  articleId: number;
}

export default function QuizGame({ articleId }: QuizGameProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number | string>>({});
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setLoading(true);
    fetch(`/api/quiz/${articleId}`)
      .then((r) => r.json())
      .then((data) => {
        setQuestions(data.questions || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [articleId]);

  if (loading) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[rgba(22,34,48,0.7)] backdrop-blur-sm p-4 text-center text-[var(--text-muted)] text-xs">
        <div className="inline-block w-4 h-4 border-2 border-[var(--border)] border-t-[var(--gold)] rounded-full animate-spin mr-1.5" />
        加载测验...
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[rgba(22,34,48,0.7)] backdrop-blur-sm p-4 text-center text-[var(--text-muted)] text-xs">
        暂无测验
      </div>
    );
  }

  const q = questions[currentQ];
  const total = questions.length;
  const isSubmitted = submitted[currentQ];

  const handleMC = (idx: number) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({ ...prev, [currentQ]: idx }));
  };

  const handleSubmit = () => {
    setSubmitted((prev) => ({ ...prev, [currentQ]: true }));
  };

  const handleOpen = (text: string) => {
    setAnswers((prev) => ({ ...prev, [currentQ]: text }));
  };

  const mcCorrect = questions.filter(
    (q, i) => q.question_type === "mc" && answers[i] === q.correct_answer
  ).length;
  const mcTotal = questions.filter((q) => q.question_type === "mc").length;

  if (currentQ >= total) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[rgba(22,34,48,0.7)] backdrop-blur-sm p-4 text-center">
        <div className="text-lg mb-2">🎉</div>
        <p className="text-sm font-bold mb-1">测验完成！</p>
        <p className="text-[0.7rem] text-[var(--text-secondary)] mb-1">
          选择题: <span className="text-[var(--gold)] font-bold">{mcCorrect}/{mcTotal}</span>
        </p>
        <p className="text-[0.65rem] text-[var(--text-muted)] mb-3">
          开放式问题已提交，锻炼分析思维
        </p>
        <button
          onClick={() => {
            setCurrentQ(0);
            setAnswers({});
            setSubmitted({});
          }}
          className="px-3 py-1.5 bg-[var(--gold)] text-[var(--bg-primary)] rounded-lg text-xs font-bold hover:bg-[var(--gold-hover)] transition-colors"
        >
          重新开始
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[rgba(22,34,48,0.7)] backdrop-blur-sm p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-[0.6rem] px-1.5 py-0.5 rounded font-bold ${
          q.question_type === "mc" ? "bg-[var(--accent)] text-white" : "bg-[var(--gold-dim)] text-[var(--gold)]"
        }`}>
          {q.question_type === "mc" ? "选择题" : "开放式"}
        </span>
        <span className="text-[0.6rem] text-[var(--text-muted)]">第 {currentQ + 1}/{total} 题</span>
      </div>

      <p className="text-[0.8rem] font-semibold mb-3 leading-relaxed">{q.question}</p>

      {q.question_type === "mc" ? (
        <div className="space-y-1.5">
          {q.options.map((opt, i) => {
            let cls = "p-2 rounded-lg border text-[0.75rem] cursor-pointer transition-all ";
            if (isSubmitted) {
              if (i === q.correct_answer) cls += "border-[var(--green)] bg-[rgba(56,201,122,0.15)] text-[var(--green)]";
              else if (i === answers[currentQ] && i !== q.correct_answer)
                cls += "border-[var(--red)] bg-[rgba(232,84,84,0.15)] text-[var(--red)]";
              else cls += "border-[var(--border)] bg-[rgba(11,18,25,0.5)] text-[var(--text-muted)] opacity-50";
            } else if (answers[currentQ] === i) {
              cls += "border-[var(--gold)] bg-[rgba(212,168,67,0.12)] text-[var(--text-primary)]";
            } else {
              cls += "border-[var(--border)] bg-[rgba(11,18,25,0.4)] text-[var(--text-primary)] hover:border-[var(--border-light)]";
            }
            return (
              <div key={i} className={cls} onClick={() => handleMC(i)}>
                <span className="font-bold mr-1.5 text-[var(--text-muted)]">{String.fromCharCode(65 + i)}.</span>
                {opt}
              </div>
            );
          })}
        </div>
      ) : (
        <textarea
          className="w-full min-h-[70px] p-2.5 bg-[rgba(11,18,25,0.5)] border border-[var(--border)] rounded-lg text-[0.75rem] text-[var(--text-primary)] resize-y outline-none focus:border-[var(--gold)] transition-colors"
          placeholder="写下你的分析..."
          value={(answers[currentQ] as string) || ""}
          onChange={(e) => handleOpen(e.target.value)}
          disabled={isSubmitted}
        />
      )}

      {isSubmitted && q.explanation && (
        <div className="mt-2 p-2 bg-[rgba(11,18,25,0.5)] rounded-lg text-[0.65rem] text-[var(--text-secondary)]">
          <strong className="text-[var(--gold)]">解析: </strong>{q.explanation}
        </div>
      )}

      {q.question_type === "open" && !isSubmitted && (
        <p className="mt-1.5 text-[0.6rem] text-[var(--text-muted)]">
          💡 从多角度分析，考虑直接和间接影响
        </p>
      )}

      <div className="flex justify-end gap-1.5 mt-3 pt-2 border-t border-[var(--border)]">
        {currentQ > 0 && (
          <button
            onClick={() => setCurrentQ((p) => p - 1)}
            className="px-2.5 py-1 bg-[rgba(11,18,25,0.5)] text-[var(--text-secondary)] rounded-md text-[0.65rem] font-medium hover:bg-[rgba(30,48,68,0.6)] transition-colors"
          >
            上一题
          </button>
        )}
        {q.question_type === "open" && !isSubmitted && answers[currentQ] !== undefined && (
          <button
            onClick={handleSubmit}
            className="px-2.5 py-1 bg-[var(--gold)] text-[var(--bg-primary)] rounded-md text-[0.65rem] font-bold hover:bg-[var(--gold-hover)] transition-colors"
          >
            提交
          </button>
        )}
        <button
          onClick={() => {
            if (q.question_type === "open" && !isSubmitted && answers[currentQ] !== undefined) handleSubmit();
            setCurrentQ((p) => p + 1);
          }}
          className="px-2.5 py-1 bg-[var(--accent)] text-white rounded-md text-[0.65rem] font-bold hover:bg-[var(--accent-hover)] transition-colors"
        >
          {currentQ >= total - 1 ? "完成" : "下一题"}
        </button>
      </div>
    </div>
  );
}
