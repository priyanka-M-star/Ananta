import Link from 'next/link';
import { TeacherPortrait, type TeacherSlug } from '@/components/TeacherPortrait';
import { LaunchGatePill } from './LaunchGatePill';

const TEACHERS: TeacherSlug[] = ['praketa', 'vihaan', 'adhvara', 'harini', 'anika', 'amita'];

/**
 * Landing page — server-rendered for SEO. The Three.js 3D moments from
 * Ananta_Landing_3D.html will be brought in as client components in a
 * follow-up; this skeleton focuses on the content + auth-flow entry point.
 */
export default function HomePage() {
  return (
    <main className="min-h-screen px-6 lg:px-10 pt-10 pb-20" style={{ background: 'var(--bg)' }}>
      <nav className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--ink)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M3 12 Q12 3 21 12 Q12 21 3 12Z" stroke="#FEF3C7" strokeWidth="2" />
              <circle cx="12" cy="12" r="3" fill="#D97706" />
            </svg>
          </div>
          <div>
            <div className="serif font-bold text-lg leading-none">Ananta</div>
            <div className="mono text-[10px] tracking-widest font-medium mt-1" style={{ color: 'var(--ink-soft)' }}>
              FOR KARNATAKA STATE BOARD
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-semibold" style={{ color: 'var(--ink-soft)' }}>
            Sign in
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 rounded-full font-semibold text-sm"
            style={{ background: 'var(--ink)', color: 'var(--bg)' }}
          >
            Join the waitlist
          </Link>
        </div>
      </nav>

      <section className="max-w-5xl mx-auto pt-20 text-center">
        <LaunchGatePill />

        <h1 className="serif font-bold leading-[1.04] text-4xl md:text-6xl lg:text-7xl mt-5">
          A tutoring website for the Karnataka syllabus,
          <br />
          <span style={{ color: 'var(--terracotta)' }} className="italic">
            taught entirely by AI
          </span>
          .
        </h1>

        <p className="mt-7 max-w-2xl mx-auto text-base md:text-lg" style={{ color: 'var(--ink-soft)' }}>
          Daily one-hour live classes for Grades 10, 11 and 12. Each subject has its own AI teacher who
          explains lessons through interactive 3D scenes. ₹299 a month.
        </p>

        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Link
            href="/signup"
            className="px-6 py-3 rounded-full font-semibold text-sm"
            style={{ background: 'var(--ink)', color: 'var(--bg)' }}
          >
            Reserve your seat
          </Link>
          <Link
            href="/sample-lesson"
            className="px-6 py-3 rounded-full font-semibold text-sm border"
            style={{ borderColor: 'var(--ink)', color: 'var(--ink)' }}
          >
            Watch a sample lesson
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto mt-28">
        <div className="mono text-xs tracking-widest mb-3" style={{ color: 'var(--ink-soft)' }}>
          — THE TEACHERS
        </div>
        <h2 className="serif text-3xl md:text-4xl font-semibold leading-tight max-w-3xl">
          Six teachers, one for each subject.
        </h2>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TEACHERS.map((t) => (
            <TeacherCard key={t} slug={t} />
          ))}
        </div>
      </section>
    </main>
  );
}

function TeacherCard({ slug }: { slug: TeacherSlug }) {
  return (
    <div className="paper-card-strong rounded-3xl p-5 flex items-center gap-4">
      <TeacherPortrait slug={slug} size={64} />
      <div className="min-w-0">
        <div className="mono text-[10px] tracking-widest" style={{ color: 'var(--ink-soft)' }}>
          {slugMeta(slug).subject.toUpperCase()} · {slugMeta(slug).day}
        </div>
        <div className="serif text-xl font-semibold mt-0.5">{slugMeta(slug).name}</div>
      </div>
    </div>
  );
}

function slugMeta(slug: TeacherSlug) {
  // mirror TeacherPortrait's metadata
  const map = {
    praketa: { name: 'Praketa', subject: 'Mathematics', day: 'Monday' },
    vihaan: { name: 'Vihaan', subject: 'Science', day: 'Tuesday' },
    adhvara: { name: 'Adhvara', subject: 'Social', day: 'Wednesday' },
    harini: { name: 'Harini', subject: 'Kannada', day: 'Thursday' },
    anika: { name: 'Anika', subject: 'English', day: 'Friday' },
    amita: { name: 'Amita', subject: 'Hindi', day: 'Saturday' },
  };
  return map[slug];
}
