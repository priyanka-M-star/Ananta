'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { use3dMode, setLiteMode } from '@/three/use-3d-mode';
import { TeacherPortrait, TEACHER_META, type TeacherSlug } from '@/components/TeacherPortrait';

/**
 * Per-subject live class demo route. Each subject loads only its own scene
 * — three.js code splits perfectly, so a student watching Maths never
 * downloads the Bastille's geometry.
 *
 * Routes:
 *   /live-demo/maths   → ExplodingCube (Praketa)
 *   /live-demo/social  → Bastille (Adhvara)
 *
 * Add a new subject by:
 *   1. Building <Name> and <NameLite> in src/three/scenes/<name>.tsx
 *   2. Registering it in SUBJECTS below
 */

const ExplodingCube = dynamic(
  () => import('@/three/scenes/exploding-cube').then((m) => ({ default: m.ExplodingCube })),
  { ssr: false, loading: () => <SceneSkeleton /> },
);
const ExplodingCubeLite = dynamic(
  () => import('@/three/scenes/exploding-cube').then((m) => ({ default: m.ExplodingCubeLite })),
  { ssr: false, loading: () => <SceneSkeleton /> },
);
const Bastille = dynamic(
  () => import('@/three/scenes/bastille').then((m) => ({ default: m.Bastille })),
  { ssr: false, loading: () => <SceneSkeleton /> },
);
const BastilleLite = dynamic(
  () => import('@/three/scenes/bastille').then((m) => ({ default: m.BastilleLite })),
  { ssr: false, loading: () => <SceneSkeleton /> },
);

interface Subject {
  teacher: TeacherSlug;
  chapter: string;
  caption: string;
  description: string;
  ThreeD: React.ComponentType<{ className?: string }>;
  Lite: React.ComponentType<{ className?: string }>;
}

const SUBJECTS: Record<string, Subject> = {
  maths: {
    teacher: 'praketa',
    chapter: 'Ch.12 · Surface Areas and Volumes',
    caption: 'The cube has six identical square faces. SA = 6 × a².',
    description:
      "Praketa explodes a cube into its six square faces, then puts it back together. By the end you'll know why surface area is 6a² and be able to derive it yourself.",
    ThreeD: ExplodingCube,
    Lite: ExplodingCubeLite,
  },
  social: {
    teacher: 'adhvara',
    chapter: 'Ch.1 · Rise of Nationalism in Europe',
    caption: 'On 14 July 1789, Parisians stormed the Bastille. The Revolution had begun.',
    description:
      "Adhvara stages the fall of the Bastille in 3D — the fortress that symbolised royal tyranny crumbling, the tricolour rising in its place. Then she traces the echo to India's own freedom movement.",
    ThreeD: Bastille,
    Lite: BastilleLite,
  },
};

export default function LiveDemoSubjectPage({ params }: { params: { subject: string } }) {
  const subject = SUBJECTS[params.subject];
  if (!subject) notFound();
  const mode = use3dMode();
  const Scene = mode === 'three' ? subject.ThreeD : subject.Lite;
  const teacher = TEACHER_META[subject.teacher];

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <header className="max-w-7xl mx-auto px-6 lg:px-10 pt-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--ink)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M3 12 Q12 3 21 12 Q12 21 3 12Z" stroke="#FEF3C7" strokeWidth="2" />
              <circle cx="12" cy="12" r="3" fill="#D97706" />
            </svg>
          </div>
          <div>
            <div className="serif font-bold text-lg leading-none">Ananta</div>
            <div className="mono text-[10px] tracking-widest mt-1" style={{ color: 'var(--ink-soft)' }}>
              {teacher.subject.toUpperCase()} · LIVE DEMO
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/live-demo/maths" className="text-xs px-3 py-1.5 rounded-full border" style={{ borderColor: 'var(--line)', color: 'var(--ink-soft)' }}>
            Maths
          </Link>
          <Link href="/live-demo/social" className="text-xs px-3 py-1.5 rounded-full border" style={{ borderColor: 'var(--line)', color: 'var(--ink-soft)' }}>
            Social
          </Link>
          <span
            className="text-xs px-3 py-1.5 rounded-full mono"
            style={{
              background: mode === 'three' ? '#ECFDF5' : '#FEF3C7',
              color: mode === 'three' ? '#047857' : '#B45309',
            }}
          >
            {mode === 'three' ? '3D MODE' : 'LITE MODE'}
          </span>
          <button
            onClick={() => { setLiteMode(mode === 'three'); location.reload(); }}
            className="text-xs px-3 py-1.5 rounded-full border"
            style={{ borderColor: 'var(--line)', color: 'var(--ink-soft)' }}
          >
            Switch
          </button>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 lg:px-10 mt-6">
        <div className="grid lg:grid-cols-[1fr_300px] gap-5">
          <div
            className="rounded-3xl overflow-hidden border relative"
            style={{
              borderColor: 'var(--line)',
              background: '#fff',
              height: 560,
              boxShadow: '0 6px 16px -8px rgba(31,22,17,.07), 0 22px 60px -28px rgba(31,22,17,.14)',
            }}
          >
            <Scene className="w-full h-full" />

            {/* Teacher PiP */}
            <div
              className="absolute bottom-4 left-4 flex items-center gap-3 rounded-full pl-1.5 pr-4 py-1.5 border"
              style={{ background: 'rgba(255,255,255,.92)', borderColor: 'var(--line)' }}
            >
              <TeacherPortrait slug={subject.teacher} size={40} />
              <div>
                <div className="serif text-sm font-bold leading-none">{teacher.name}</div>
                <div className="text-[11px]" style={{ color: 'var(--ink-soft)' }}>
                  {teacher.subject} · live
                </div>
              </div>
            </div>

            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl serif text-base font-medium text-center max-w-md"
              style={{ background: 'rgba(31,22,17,.88)', color: '#FEF3C7', backdropFilter: 'blur(8px)' }}
            >
              {subject.caption}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border p-5" style={{ background: '#fff', borderColor: 'var(--line)' }}>
              <div className="mono text-[10px] tracking-widest" style={{ color: 'var(--ink-soft)' }}>
                — TONIGHT&apos;S CHAPTER
              </div>
              <h2 className="serif font-semibold text-lg mt-1">{subject.chapter}</h2>
              <p className="text-sm mt-2" style={{ color: 'var(--ink-soft)' }}>
                {subject.description}
              </p>
            </div>

            <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-2)', borderColor: 'var(--line)' }}>
              <div className="mono text-[10px] tracking-widest" style={{ color: 'var(--ink-soft)' }}>
                — RENDERING
              </div>
              <ul className="text-xs mt-2 space-y-1" style={{ color: 'var(--ink-2)' }}>
                <li>{mode === 'three' ? '✓ WebGL2 + react-three-fiber' : '✓ SVG + CSS fallback'}</li>
                <li>{mode === 'three' ? '✓ Soft PCF shadows' : '✓ No GPU required'}</li>
                <li>≤ 320 KB JS budget per route</li>
                <li>Auto Lite on low-end / 2G</li>
              </ul>
            </div>

            <Link
              href="/dashboard"
              className="block text-center py-3 rounded-full font-semibold text-sm"
              style={{ background: 'var(--ink)', color: 'var(--bg)' }}
            >
              Back to dashboard
            </Link>
          </aside>
        </div>
      </section>
    </main>
  );
}

function SceneSkeleton() {
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #FAF5EB, #F5EDD8)' }}
    >
      <div className="mono text-xs" style={{ color: 'var(--ink-soft)' }}>
        Loading scene…
      </div>
    </div>
  );
}
