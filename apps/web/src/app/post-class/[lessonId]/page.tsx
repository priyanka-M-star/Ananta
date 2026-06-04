'use client';

/**
 * Post-class hub for a specific lesson.
 *
 * Three tabs:
 *   - Quiz       — full interactive flow against /v1/quizzes APIs
 *   - Notes      — auto-generated HTML from /v1/notes
 *   - Materials  — chapter materials from /v1/materials
 *
 * Each tab fetches lazily (only when first opened) so opening the page is
 * a single round-trip to find the quiz; the rest is on demand.
 */

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError, type MaterialItem, type NoteFull, type QuizForStudent, type QuizResult } from '@/lib/api';
import { isSignedIn } from '@/lib/auth';

type Tab = 'quiz' | 'notes' | 'materials';

export default function PostClassPage() {
  const router = useRouter();
  const params = useParams<{ lessonId: string }>();
  const lessonId = params.lessonId;
  const [tab, setTab] = useState<Tab>('quiz');

  useEffect(() => {
    if (!isSignedIn()) router.replace('/login');
  }, [router]);

  return (
    <main className="min-h-screen pb-20" style={{ background: 'var(--bg)' }}>
      <header className="max-w-5xl mx-auto px-6 lg:px-10 pt-8 flex items-center justify-between">
        <Link href="/dashboard" className="text-sm" style={{ color: 'var(--ink-soft)' }}>
          ← Back to dashboard
        </Link>
      </header>

      <section className="max-w-5xl mx-auto px-6 lg:px-10 mt-6">
        <div className="mono text-xs tracking-widest" style={{ color: 'var(--ink-soft)' }}>
          — POST-CLASS
        </div>
        <h1 className="serif text-4xl font-bold mt-2">Lock in tonight&apos;s lesson.</h1>
        <p className="mt-2" style={{ color: 'var(--ink-soft)' }}>
          Take the quiz, read the notes, and grab any materials you need.
        </p>

        {/* Tabs */}
        <nav className="mt-6 inline-flex gap-1 p-1 rounded-2xl border" style={{ background: '#fff', borderColor: 'var(--line)' }}>
          {(['quiz', 'notes', 'materials'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-5 py-2 rounded-xl text-sm font-semibold transition"
              style={{
                background: tab === t ? 'var(--ink)' : 'transparent',
                color:      tab === t ? 'var(--bg)' : 'var(--ink-soft)',
              }}
            >
              {t === 'quiz' && "Today's Quiz"}
              {t === 'notes' && 'Notes'}
              {t === 'materials' && 'Materials'}
            </button>
          ))}
        </nav>

        <div className="mt-6">
          {tab === 'quiz' && <QuizTab lessonId={lessonId} onJumpToNotes={() => setTab('notes')} />}
          {tab === 'notes' && <NotesTab lessonId={lessonId} />}
          {tab === 'materials' && <MaterialsTab />}
        </div>
      </section>
    </main>
  );
}

// ============================================================
// QUIZ TAB
// ============================================================

type QuizPhase = 'loading' | 'no-quiz' | 'ready' | 'attempting' | 'done' | 'error';

function QuizTab({ lessonId, onJumpToNotes }: { lessonId: string; onJumpToNotes: () => void }) {
  const [phase, setPhase] = useState<QuizPhase>('loading');
  const [quiz, setQuiz] = useState<QuizForStudent | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [questionIdx, setQuestionIdx] = useState(0);
  const [locked, setLocked] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.getQuizForLesson(lessonId)
      .then((q) => {
        if (!q) { setPhase('no-quiz'); return; }
        setQuiz(q);
        setPhase('ready');
      })
      .catch((e) => { setErr(asMessage(e)); setPhase('error'); });
  }, [lessonId]);

  async function start() {
    if (!quiz) return;
    try {
      const a = await api.startQuiz(quiz.id);
      setAttemptId(a.id);
      setPhase('attempting');
      setQuestionIdx(0);
      setResponses({});
      setLocked(false);
    } catch (e) { setErr(asMessage(e)); setPhase('error'); }
  }

  function pick(questionId: string, optionId: string) {
    if (locked) return;
    setResponses((r) => ({ ...r, [questionId]: optionId }));
  }

  async function submit() {
    if (!quiz || !attemptId) return;
    try {
      const r = await api.submitQuiz({
        attemptId,
        responses: quiz.questions.map((q) => ({
          questionId: q.id,
          answer: { id: responses[q.id] ?? null },
        })),
      });
      setResult(r);
      setPhase('done');
    } catch (e) { setErr(asMessage(e)); setPhase('error'); }
  }

  const current = quiz?.questions[questionIdx];
  const allAnswered = useMemo(
    () => quiz?.questions.every((q) => responses[q.id]) ?? false,
    [quiz, responses],
  );

  if (phase === 'loading') return <Loading />;
  if (phase === 'error')   return <ErrorBox message={err ?? 'Something went wrong.'} />;

  if (phase === 'no-quiz') {
    return (
      <Card>
        <h2 className="serif text-2xl font-semibold">No quiz yet for this lesson.</h2>
        <p className="text-sm mt-2" style={{ color: 'var(--ink-soft)' }}>
          The AI worker is still generating the quiz. Try again in a few minutes — or browse the notes.
        </p>
      </Card>
    );
  }

  if (phase === 'ready' && quiz) {
    return (
      <Card>
        <div className="mono text-xs tracking-widest" style={{ color: 'var(--ink-soft)' }}>
          QUICK QUIZ
        </div>
        <h2 className="serif text-2xl font-semibold mt-1">{quiz.titleEn}</h2>
        <p className="text-sm mt-2" style={{ color: 'var(--ink-soft)' }}>
          {quiz.questions.length} questions · pass at {quiz.passPercentage}% · ~{quiz.durationMin} minutes
        </p>
        <button
          onClick={start}
          className="mt-5 px-5 py-3 rounded-full font-semibold text-sm"
          style={{ background: 'var(--ink)', color: 'var(--bg)' }}
        >
          Start the quiz →
        </button>
      </Card>
    );
  }

  if (phase === 'attempting' && quiz && current) {
    const picked = responses[current.id];
    return (
      <>
        <Card>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="mono text-xs tracking-widest" style={{ color: 'var(--ink-soft)' }}>
              QUESTION {questionIdx + 1} OF {quiz.questions.length} · {current.difficulty}
            </div>
            <ProgressBar idx={questionIdx} total={quiz.questions.length} />
          </div>

          <p className="serif text-xl md:text-2xl font-semibold leading-snug mt-4" style={{ color: 'var(--ink)' }}>
            {current.textEn}
          </p>

          <div className="space-y-2 mt-5">
            {current.options.map((opt, i) => (
              <button
                key={opt.id}
                onClick={() => pick(current.id, opt.id)}
                className="w-full text-left rounded-2xl px-4 py-3 flex items-center gap-3 transition"
                style={{
                  background: picked === opt.id ? 'var(--bg-2, #F5EDD8)' : '#fff',
                  border: `2px solid ${picked === opt.id ? 'var(--ink)' : 'var(--line)'}`,
                  color: 'var(--ink)',
                }}
              >
                <span
                  className="w-9 h-9 rounded-lg flex items-center justify-center font-extrabold"
                  style={{
                    background: picked === opt.id ? 'var(--ink)' : 'var(--bg-2, #F5EDD8)',
                    color:      picked === opt.id ? 'var(--bg)' : 'var(--ink-soft)',
                  }}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="font-medium">{opt.textEn}</span>
              </button>
            ))}
          </div>
        </Card>

        <div className="flex justify-between items-center mt-4">
          <button
            disabled={questionIdx === 0}
            onClick={() => setQuestionIdx((i) => Math.max(0, i - 1))}
            className="text-sm font-semibold disabled:opacity-30"
            style={{ color: 'var(--ink-soft)' }}
          >
            ← Previous
          </button>
          {questionIdx < quiz.questions.length - 1 ? (
            <button
              disabled={!picked}
              onClick={() => setQuestionIdx((i) => i + 1)}
              className="px-5 py-3 rounded-full font-semibold text-sm disabled:opacity-50"
              style={{ background: 'var(--ink)', color: 'var(--bg)' }}
            >
              Next question →
            </button>
          ) : (
            <button
              disabled={!allAnswered}
              onClick={submit}
              className="px-5 py-3 rounded-full font-semibold text-sm disabled:opacity-50"
              style={{ background: 'var(--amber, #D97706)', color: '#fff' }}
            >
              Submit quiz
            </button>
          )}
        </div>
      </>
    );
  }

  if (phase === 'done' && result && quiz) {
    return (
      <Card>
        <div className="text-center">
          <div className="serif text-5xl">{result.passed ? '✓' : '↻'}</div>
          <h2 className="serif text-3xl font-bold mt-3">
            {result.scorePercent}% · {result.passed ? 'passed' : 'try again'}
          </h2>
          <p className="mt-2" style={{ color: 'var(--ink-soft)' }}>
            {result.scorePoints} of {quiz.questions.reduce((s, q) => s + q.points, 0)} XP ·{' '}
            {result.responses.filter((r) => r.isCorrect).length} right ·{' '}
            {result.responses.filter((r) => !r.isCorrect).length} wrong
          </p>
        </div>

        <div className="mt-6 space-y-3">
          {quiz.questions.map((q, i) => {
            const r = result.responses.find((x) => x.questionId === q.id);
            const exp = result.explanations.find((x) => x.questionId === q.id);
            const ok = r?.isCorrect ?? false;
            return (
              <div
                key={q.id}
                className="rounded-2xl p-4"
                style={{
                  background: ok ? '#ECFDF5' : '#FEE2E2',
                  border: `1px solid ${ok ? '#A7F3D0' : '#FCA5A5'}`,
                }}
              >
                <div className="mono text-[10px] tracking-widest" style={{ color: ok ? '#047857' : '#9F1239' }}>
                  Q{i + 1} · {ok ? 'CORRECT' : 'INCORRECT'}
                </div>
                <p className="serif font-semibold mt-1" style={{ color: 'var(--ink)' }}>{q.textEn}</p>
                {exp?.explanationEn && (
                  <p className="text-sm mt-2" style={{ color: 'var(--ink-2, #3F2E22)' }}>{exp.explanationEn}</p>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-3 mt-6">
          <button
            onClick={onJumpToNotes}
            className="px-5 py-3 rounded-full font-semibold text-sm"
            style={{ background: 'var(--ink)', color: 'var(--bg)' }}
          >
            Read tonight&apos;s notes →
          </button>
          <Link
            href="/memory-deck"
            className="px-5 py-3 rounded-full font-semibold text-sm border"
            style={{ borderColor: 'var(--ink)', color: 'var(--ink)' }}
          >
            Open Memory Deck
          </Link>
        </div>
      </Card>
    );
  }

  return null;
}

// ============================================================
// NOTES TAB
// ============================================================

function NotesTab({ lessonId }: { lessonId: string }) {
  const [note, setNote] = useState<NoteFull | null>(null);
  const [phase, setPhase] = useState<'loading' | 'ok' | 'none' | 'error'>('loading');
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.notes.list({ limit: 50 })
      .then(async (list) => {
        const found = list.find((n) => n.lesson.id === lessonId) ?? list[0];
        if (!found) { setPhase('none'); return; }
        const full = await api.notes.get(found.id);
        setNote(full);
        setPhase('ok');
      })
      .catch((e) => { setErr(asMessage(e)); setPhase('error'); });
  }, [lessonId]);

  if (phase === 'loading') return <Loading />;
  if (phase === 'error')   return <ErrorBox message={err ?? 'Could not load notes.'} />;
  if (phase === 'none' || !note) {
    return (
      <Card>
        <h2 className="serif text-2xl font-semibold">Notes aren&apos;t ready yet.</h2>
        <p className="text-sm mt-2" style={{ color: 'var(--ink-soft)' }}>
          Notes generate automatically when the class ends. Check back in a minute.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
        <div>
          <div className="mono text-xs tracking-widest" style={{ color: 'var(--ink-soft)' }}>
            AUTO-GENERATED · {new Date(note.generatedAt).toLocaleDateString('en-IN')}
          </div>
          <h2 className="serif text-2xl font-semibold mt-1">{note.lesson.titleEn}</h2>
          <p className="text-xs mt-1" style={{ color: 'var(--ink-soft)' }}>
            Ch. {note.lesson.chapter.number} · {note.lesson.subject.nameEn} · {note.lesson.subject.teacherName}
          </p>
        </div>
        {note.pdfUrl && (
          <a
            href={note.pdfUrl}
            onClick={() => api.notes.markDownloaded(note.id)}
            className="px-4 py-2 rounded-full text-sm font-semibold"
            style={{ background: 'var(--ink)', color: 'var(--bg)' }}
          >
            Download PDF
          </a>
        )}
      </div>

      <div
        className="prose-notes mt-2"
        // The HTML is auto-generated and sanitised at write-time by the AI worker.
        // Production should run DOMPurify on the client too as a belt-and-braces guard.
        dangerouslySetInnerHTML={{ __html: note.contentHtml }}
      />
    </Card>
  );
}

// ============================================================
// MATERIALS TAB
// ============================================================

function MaterialsTab() {
  const [items, setItems] = useState<MaterialItem[] | null>(null);
  const [filter, setFilter] = useState<'all' | 'PYQ' | 'WORKSHEET' | 'REFERENCE' | 'SYLLABUS'>('all');
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.materials.list({ limit: 30 })
      .then(setItems)
      .catch((e) => setErr(asMessage(e)));
  }, []);

  const filtered = items?.filter((m) => filter === 'all' || m.type === filter) ?? null;

  if (err) return <ErrorBox message={err} />;
  if (!items) return <Loading />;

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        {(['all', 'PYQ', 'WORKSHEET', 'REFERENCE', 'SYLLABUS'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border transition"
            style={{
              background: filter === f ? 'var(--ink)' : 'transparent',
              color:      filter === f ? 'var(--bg)' : 'var(--ink-soft)',
              borderColor: filter === f ? 'var(--ink)' : 'var(--line)',
            }}
          >
            {f === 'all' ? 'All' : f.replace(/_/g, ' ').toLowerCase()}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mt-4">
        {filtered?.length === 0 && (
          <Card>
            <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
              Nothing matches that filter.
            </p>
          </Card>
        )}
        {filtered?.map((m) => (
          <div key={m.id} className="rounded-2xl border p-4" style={{ background: '#fff', borderColor: 'var(--line)' }}>
            <div className="mono text-[10px] tracking-widest" style={{ color: 'var(--ink-soft)' }}>
              {m.type.replace(/_/g, ' ')} · {m.subject.code} {m.year ? `· ${m.year}` : ''}
            </div>
            <div className="serif font-semibold mt-1" style={{ color: 'var(--ink)' }}>{m.titleEn}</div>
            {m.description && (
              <p className="text-xs mt-1" style={{ color: 'var(--ink-soft)' }}>{m.description}</p>
            )}
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] mono" style={{ color: 'var(--ink-soft)' }}>
                {(m.fileSizeBytes / 1024 / 1024).toFixed(1)} MB · {m.downloadCount} downloads
              </span>
              <button
                onClick={async () => {
                  const { fileUrl } = await api.materials.download(m.id);
                  window.open(fileUrl, '_blank', 'noopener,noreferrer');
                }}
                className="text-xs font-bold underline"
                style={{ color: 'var(--ink)' }}
              >
                Download →
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ============================================================
// Helpers
// ============================================================

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-3xl border p-6 md:p-7"
      style={{
        background: '#fff',
        borderColor: 'var(--line)',
        boxShadow: '0 6px 16px -8px rgba(31,22,17,.07), 0 22px 60px -28px rgba(31,22,17,.14)',
      }}
    >
      {children}
    </div>
  );
}

function ProgressBar({ idx, total }: { idx: number; total: number }) {
  const pct = total > 0 ? ((idx + 1) / total) * 100 : 0;
  return (
    <div className="w-32 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--line)' }}>
      <div
        className="h-full"
        style={{
          width: `${pct}%`,
          background: 'linear-gradient(90deg, var(--amber, #D97706), var(--emerald, #059669))',
        }}
      />
    </div>
  );
}

function Loading() {
  return <p className="mono text-sm py-8" style={{ color: 'var(--ink-soft)' }}>Loading…</p>;
}

function ErrorBox({ message }: { message: string }) {
  return (
    <Card>
      <p className="serif text-lg">Something went wrong.</p>
      <p className="text-sm mt-1" style={{ color: 'var(--ink-soft)' }}>{message}</p>
    </Card>
  );
}

function asMessage(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return String(e);
}
