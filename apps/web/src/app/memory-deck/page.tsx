'use client';

/**
 * Memory Deck — the daily 5-minute review.
 *
 * Pulls the due queue from /v1/memory-deck/due, walks through one card at a
 * time. The student grades their own recall on a 0-5 scale; we POST to
 * /v1/memory-deck/cards/:id/review and the SM-2 algorithm on the server
 * computes the next due date.
 *
 * The whole thing fits in a single client component because the queue is
 * small (≤ 50 cards) and we don't paginate.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError, type MemoryCard } from '@/lib/api';
import { isSignedIn } from '@/lib/auth';

type Queue = MemoryCard[];
type Phase = 'loading' | 'reviewing' | 'done' | 'empty' | 'error';

type Stats = { right: number; wrong: number };

const QUALITY_BUTTONS: { quality: 0 | 1 | 2 | 3 | 4 | 5; label: string; hint: string; tone: 'red' | 'amber' | 'green' }[] = [
  { quality: 0, label: 'Again',  hint: 'Total blank',      tone: 'red'    },
  { quality: 1, label: 'Hard',   hint: 'Got it eventually',tone: 'red'    },
  { quality: 2, label: 'Wrong',  hint: 'Wrong answer',     tone: 'red'    },
  { quality: 3, label: 'OK',     hint: 'With effort',      tone: 'amber'  },
  { quality: 4, label: 'Good',   hint: 'Recalled clearly', tone: 'green'  },
  { quality: 5, label: 'Perfect',hint: 'Instant + sure',   tone: 'green'  },
];

export default function MemoryDeckPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('loading');
  const [queue, setQueue] = useState<Queue>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [stats, setStats] = useState<Stats>({ right: 0, wrong: 0 });
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn()) { router.replace('/login'); return; }
    api.memoryDeck.due(50)
      .then((q) => {
        setQueue(q);
        setPhase(q.length === 0 ? 'empty' : 'reviewing');
      })
      .catch((e) => {
        setErr(e instanceof ApiError ? e.message : 'Failed to load cards');
        setPhase('error');
      });
  }, [router]);

  const current = queue[index];
  const remaining = queue.length - index;

  async function grade(quality: 0 | 1 | 2 | 3 | 4 | 5) {
    if (!current) return;
    try {
      await api.memoryDeck.review(current.id, quality);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Could not save review');
    }
    setStats((s) => ({
      right: s.right + (quality >= 3 ? 1 : 0),
      wrong: s.wrong + (quality < 3  ? 1 : 0),
    }));
    setRevealed(false);
    if (index + 1 >= queue.length) {
      setPhase('done');
    } else {
      setIndex((i) => i + 1);
    }
  }

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Header remaining={remaining} total={queue.length} stats={stats} phase={phase} />

      <section className="max-w-3xl mx-auto px-6 mt-8 pb-16">
        {phase === 'loading' && <Loading />}
        {phase === 'error' && err && <ErrorView message={err} />}
        {phase === 'empty' && <Empty />}
        {phase === 'reviewing' && current && (
          <Reviewer
            card={current}
            revealed={revealed}
            onReveal={() => setRevealed(true)}
            onGrade={grade}
          />
        )}
        {phase === 'done' && <Done stats={stats} total={queue.length} />}
      </section>
    </main>
  );
}

function Header({ remaining, total, stats, phase }: { remaining: number; total: number; stats: Stats; phase: Phase }) {
  const pct = total > 0 ? Math.round(((total - remaining) / total) * 100) : 0;
  return (
    <header className="max-w-3xl mx-auto px-6 pt-8">
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="text-sm" style={{ color: 'var(--ink-soft)' }}>
          ← Back to dashboard
        </Link>
        <div className="mono text-xs" style={{ color: 'var(--ink-soft)' }}>
          {phase === 'reviewing' && (
            <>
              <b style={{ color: 'var(--ink)' }}>{stats.right}</b> right ·{' '}
              <b style={{ color: 'var(--burgundy, #9F1239)' }}>{stats.wrong}</b> wrong
            </>
          )}
        </div>
      </div>
      <div className="mt-3">
        <div className="flex items-baseline justify-between">
          <h1 className="serif text-3xl font-bold">Memory Deck</h1>
          <div className="mono text-xs" style={{ color: 'var(--ink-soft)' }}>
            {total > 0 ? `${total - remaining} / ${total}` : '— / —'}
          </div>
        </div>
        <div className="h-1.5 rounded-full mt-3 overflow-hidden" style={{ background: 'var(--line)' }}>
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--amber, #D97706), var(--emerald, #059669))' }}
          />
        </div>
      </div>
    </header>
  );
}

function Reviewer({ card, revealed, onReveal, onGrade }: {
  card: MemoryCard;
  revealed: boolean;
  onReveal: () => void;
  onGrade: (q: 0 | 1 | 2 | 3 | 4 | 5) => void;
}) {
  return (
    <>
      <div
        className="rounded-3xl border p-8 mt-4"
        style={{
          background: '#fff',
          borderColor: 'var(--line)',
          minHeight: 240,
          boxShadow: '0 6px 16px -8px rgba(31,22,17,.07), 0 22px 60px -28px rgba(31,22,17,.14)',
        }}
      >
        <div className="mono text-[10px] tracking-widest mb-4" style={{ color: 'var(--ink-soft)' }}>
          {card.tags.length > 0 ? card.tags.join(' · ').toUpperCase() : 'MEMORY DECK'}
        </div>

        <p className="serif text-2xl leading-snug" style={{ color: 'var(--ink)' }}>{card.front}</p>

        {revealed && (
          <>
            <hr className="my-6" style={{ borderColor: 'var(--line)' }} />
            <div className="mono text-[10px] tracking-widest mb-2" style={{ color: 'var(--ink-soft)' }}>
              ANSWER
            </div>
            <p className="text-base leading-relaxed" style={{ color: 'var(--ink-2, #3F2E22)' }}>
              {card.back}
            </p>
          </>
        )}
      </div>

      {!revealed && (
        <button
          onClick={onReveal}
          className="mt-6 w-full py-4 rounded-full font-semibold text-sm"
          style={{ background: 'var(--ink)', color: 'var(--bg)' }}
        >
          Show answer (press Space)
        </button>
      )}

      {revealed && (
        <>
          <p className="mt-5 mono text-xs tracking-widest text-center" style={{ color: 'var(--ink-soft)' }}>
            HOW WELL DID YOU REMEMBER?
          </p>
          <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-2">
            {QUALITY_BUTTONS.map((b) => (
              <button
                key={b.quality}
                onClick={() => onGrade(b.quality)}
                className="rounded-2xl py-3 px-2 text-center transition hover:translate-y-[-2px]"
                style={{
                  background:
                    b.tone === 'red'   ? '#FEE2E2' :
                    b.tone === 'amber' ? '#FEF3C7' : '#ECFDF5',
                  color:
                    b.tone === 'red'   ? '#9F1239' :
                    b.tone === 'amber' ? '#B45309' : '#047857',
                  border: '1px solid transparent',
                }}
                title={b.hint}
              >
                <div className="mono text-[10px] tracking-widest opacity-70">{b.quality}</div>
                <div className="serif font-bold text-sm mt-0.5">{b.label}</div>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-center" style={{ color: 'var(--ink-soft)' }}>
            Your rating sets when this card is due next (SM-2).
          </p>
        </>
      )}
    </>
  );
}

function Done({ stats, total }: { stats: Stats; total: number }) {
  return (
    <div className="rounded-3xl border p-8 mt-4 text-center"
         style={{ background: '#fff', borderColor: 'var(--line)' }}>
      <div className="serif text-3xl font-bold">All done for today.</div>
      <p className="mt-2" style={{ color: 'var(--ink-soft)' }}>
        Reviewed {total} cards · <b style={{ color: 'var(--emerald-deep, #047857)' }}>{stats.right}</b> right ·{' '}
        <b style={{ color: 'var(--burgundy, #9F1239)' }}>{stats.wrong}</b> wrong.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-block px-6 py-3 rounded-full font-semibold text-sm"
        style={{ background: 'var(--ink)', color: 'var(--bg)' }}
      >
        Back to dashboard
      </Link>
    </div>
  );
}

function Empty() {
  return (
    <div className="rounded-3xl border p-8 mt-4 text-center"
         style={{ background: '#fff', borderColor: 'var(--line)' }}>
      <div className="serif text-2xl font-semibold">Nothing due — caught up.</div>
      <p className="mt-2 text-sm" style={{ color: 'var(--ink-soft)' }}>
        Your next review will appear once a card&apos;s interval is up. Come back tomorrow,
        or attend tonight&apos;s class to add new cards.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-block px-6 py-3 rounded-full font-semibold text-sm border"
        style={{ borderColor: 'var(--ink)', color: 'var(--ink)' }}
      >
        Back to dashboard
      </Link>
    </div>
  );
}

function Loading() {
  return <div className="text-center mt-12 mono text-sm" style={{ color: 'var(--ink-soft)' }}>Loading queue…</div>;
}

function ErrorView({ message }: { message: string }) {
  return (
    <div className="text-center mt-12">
      <div className="serif text-xl">Something went wrong.</div>
      <p style={{ color: 'var(--ink-soft)' }}>{message}</p>
      <Link href="/dashboard" className="underline mt-3 inline-block">Back to dashboard</Link>
    </div>
  );
}
