'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { clearSession, isSignedIn } from '@/lib/auth';
import { TeacherPortrait, TEACHER_META, type TeacherSlug } from '@/components/TeacherPortrait';

type Me = Awaited<ReturnType<typeof api.me>>;
type Progress = Awaited<ReturnType<typeof api.myProgress>>;

export default function DashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [countdown, setCountdown] = useState('—:—:—');
  const [err, setErr] = useState<string | null>(null);

  // gate
  useEffect(() => {
    if (!isSignedIn()) { router.replace('/login'); return; }
    Promise.all([api.me(), api.myProgress()])
      .then(([m, p]) => { setMe(m); setProgress(p); })
      .catch((e: unknown) => {
        if (e instanceof ApiError && (e.code === 'student_not_found')) {
          router.replace('/onboarding');
          return;
        }
        setErr(e instanceof ApiError ? e.message : 'Could not load dashboard');
      });
  }, [router]);

  // tonight 7 PM countdown
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const target = new Date();
      target.setHours(19, 0, 0, 0);
      if (now > target) target.setDate(target.getDate() + 1);
      const ms = target.getTime() - now.getTime();
      const hh = Math.floor(ms / 36e5);
      const mm = Math.floor((ms % 36e5) / 6e4);
      const ss = Math.floor((ms % 6e4) / 1000);
      const pad = (n: number) => n.toString().padStart(2, '0');
      setCountdown(`${pad(hh)}:${pad(mm)}:${pad(ss)}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  function signOut() {
    clearSession();
    router.push('/');
  }

  if (err) return <ErrorView message={err} />;
  if (!me || !progress) return <Loading />;

  const todayTeacher = todayTeacherSlug();
  const m = TEACHER_META[todayTeacher];

  return (
    <main className="min-h-screen px-5 lg:px-10 py-8" style={{ background: 'var(--bg)' }}>
      <header className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--ink)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M3 12 Q12 3 21 12 Q12 21 3 12Z" stroke="#FEF3C7" strokeWidth="2" />
              <circle cx="12" cy="12" r="3" fill="#D97706" />
            </svg>
          </div>
          <div className="serif font-bold text-lg">Ananta</div>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm" style={{ color: 'var(--ink-soft)' }}>
          <Link href="/dashboard" className="font-semibold" style={{ color: 'var(--ink)' }}>Today</Link>
          <Link href="/memory-deck">Memory Deck</Link>
          <Link href="/profile">Profile</Link>
          <button onClick={signOut} className="underline">Sign out</button>
        </nav>
      </header>

      <section className="max-w-7xl mx-auto mt-10">
        <div className="mono text-xs tracking-widest" style={{ color: 'var(--ink-soft)' }}>
          — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
        <h1 className="serif text-4xl md:text-5xl font-bold mt-2">
          Good evening, {me.fullName.split(' ')[0]}.
          <br />
          <span style={{ color: 'var(--terracotta)' }} className="italic">{m.name}</span> is teaching in <span className="mono font-semibold" style={{ color: 'var(--terracotta)' }}>{countdown}</span>.
        </h1>

        <div className="mt-7 grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="DAY STREAK" value={`🔥 ${me.currentStreakDays}`} />
          <Stat label="TOTAL XP" value={`${me.totalXp.toLocaleString()}`} />
          <Stat label="QUIZZES TAKEN" value={`${progress.quizzesTaken}`} />
          <Stat label="AVG QUIZ" value={progress.averageQuizPercent !== null ? `${Math.round(progress.averageQuizPercent)}%` : '—'} />
        </div>

        <div className="mt-7 paper-card-strong rounded-3xl p-7 grid md:grid-cols-[auto_1fr_auto] gap-5 items-center">
          <TeacherPortrait slug={todayTeacher} size={72} />
          <div>
            <div className="mono text-[11px] tracking-widest" style={{ color: 'var(--ink-soft)' }}>TONIGHT · 7—8 PM</div>
            <div className="serif text-2xl font-semibold mt-1">{m.subject} with {m.name}</div>
            <div className="text-sm mt-1" style={{ color: 'var(--ink-soft)' }}>Joining today's live class records your attendance.</div>
          </div>
          <Link
            href="/live"
            className="px-5 py-3 rounded-full font-semibold text-sm whitespace-nowrap"
            style={{ background: 'var(--ink)', color: 'var(--bg)' }}
          >
            Join live at 7 PM
          </Link>
        </div>

        <h2 className="serif text-2xl font-semibold mt-10">Your six subjects</h2>
        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {progress.subjects.map((s) => {
            const slug = teacherSlugForCode(s.code);
            return (
              <div key={s.id} className="paper-card-strong rounded-2xl p-4 flex items-center gap-3">
                <TeacherPortrait slug={slug} size={44} />
                <div>
                  <div className="serif font-semibold">{s.nameEn}</div>
                  <div className="text-xs" style={{ color: 'var(--ink-soft)' }}>{s.teacherName}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 paper-card-strong rounded-3xl p-7">
          <div className="mono text-xs tracking-widest" style={{ color: 'var(--ink-soft)' }}>— MEMORY DECK</div>
          <h2 className="serif text-2xl font-semibold mt-1">{progress.memoryDeck.total} cards</h2>
          <div className="grid grid-cols-4 gap-2 mt-4 text-center">
            <Pill label="MASTERED" n={progress.memoryDeck.mastered} bg="#ECFDF5" fg="#047857" />
            <Pill label="LEARNING" n={progress.memoryDeck.learning} bg="#FEF3C7" fg="#B45309" />
            <Pill label="REVIEWING" n={progress.memoryDeck.reviewing} bg="#FED7AA" fg="#9A3412" />
            <Pill label="NEW" n={progress.memoryDeck.new} bg="var(--bg-2)" fg="var(--ink)" />
          </div>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="paper-card-strong rounded-2xl p-4">
      <div className="serif font-bold text-2xl">{value}</div>
      <div className="mono text-[10px] tracking-widest mt-1" style={{ color: 'var(--ink-soft)' }}>{label}</div>
    </div>
  );
}
function Pill({ label, n, bg, fg }: { label: string; n: number; bg: string; fg: string }) {
  return (
    <div className="rounded-xl py-2" style={{ background: bg, color: fg }}>
      <div className="serif font-bold">{n}</div>
      <div className="mono text-[10px]" style={{ color: fg }}>{label}</div>
    </div>
  );
}
function Loading() {
  return <main className="min-h-screen flex items-center justify-center" style={{ color: 'var(--ink-soft)' }}>Loading…</main>;
}
function ErrorView({ message }: { message: string }) {
  return (
    <main className="min-h-screen flex items-center justify-center text-center px-6">
      <div>
        <p className="serif text-xl mb-3">Something went wrong.</p>
        <p style={{ color: 'var(--ink-soft)' }}>{message}</p>
        <Link href="/login" className="underline mt-4 inline-block">Sign in again</Link>
      </div>
    </main>
  );
}

function todayTeacherSlug(): TeacherSlug {
  const map: Record<number, TeacherSlug> = {
    1: 'praketa', // Mon
    2: 'vihaan',  // Tue
    3: 'adhvara', // Wed
    4: 'harini',  // Thu
    5: 'anika',   // Fri
    6: 'amita',   // Sat
    0: 'praketa', // Sun fallback
  };
  return map[new Date().getDay()] ?? 'praketa';
}
function teacherSlugForCode(code: string): TeacherSlug {
  const map: Record<string, TeacherSlug> = {
    MATHS: 'praketa', SCIENCE: 'vihaan', SOCIAL: 'adhvara',
    KANNADA: 'harini', ENGLISH: 'anika', HINDI: 'amita',
  };
  return map[code] ?? 'praketa';
}
