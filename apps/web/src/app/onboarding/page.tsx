'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { isSignedIn } from '@/lib/auth';
import type { StudentOnboardingInput } from '@ananta/types';

export default function OnboardingPage() {
  const router = useRouter();
  const [form, setForm] = useState<StudentOnboardingInput>({
    fullName: '',
    grade: 'GRADE_10',
    medium: 'ENGLISH',
    school: '',
    city: '',
  });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (typeof window !== 'undefined' && !isSignedIn()) {
    router.replace('/signup');
    return null;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setBusy(true);
    try {
      await api.onboard(form);
      router.push('/dashboard');
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Could not save profile');
    } finally { setBusy(false); }
  }

  function set<K extends keyof StudentOnboardingInput>(k: K, v: StudentOnboardingInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-10">
      <div className="paper-card-strong rounded-3xl p-8 w-full max-w-lg">
        <div className="mono text-xs tracking-widest mb-2" style={{ color: 'var(--ink-soft)' }}>— TELL US A LITTLE</div>
        <h1 className="serif text-3xl font-bold">Set up your profile.</h1>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field label="FULL NAME">
            <input
              required maxLength={80}
              value={form.fullName}
              onChange={(e) => set('fullName', e.target.value)}
              className="input"
              placeholder="Priya R."
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="GRADE">
              <select className="input" value={form.grade} onChange={(e) => set('grade', e.target.value as StudentOnboardingInput['grade'])}>
                <option value="GRADE_10">Grade 10</option>
                <option value="GRADE_11">Grade 11 (PUC)</option>
                <option value="GRADE_12">Grade 12 (PUC)</option>
              </select>
            </Field>
            <Field label="MEDIUM">
              <select className="input" value={form.medium} onChange={(e) => set('medium', e.target.value as StudentOnboardingInput['medium'])}>
                <option value="ENGLISH">English-medium</option>
                <option value="KANNADA">Kannada-medium (Kanglish)</option>
              </select>
            </Field>
          </div>

          <Field label="SCHOOL (optional)">
            <input
              value={form.school ?? ''}
              onChange={(e) => set('school', e.target.value)}
              className="input"
              placeholder="St. Joseph's Boys' High School"
            />
          </Field>

          <Field label="CITY (optional)">
            <input
              value={form.city ?? ''}
              onChange={(e) => set('city', e.target.value)}
              className="input"
              placeholder="Bengaluru"
            />
          </Field>

          <Field label="REFERRAL CODE (optional)">
            <input
              value={form.referralCode ?? ''}
              onChange={(e) => set('referralCode', e.target.value.toUpperCase())}
              className="input mono uppercase"
              placeholder="PRIYA-RX42"
            />
          </Field>

          {err && <p className="text-sm" style={{ color: '#9F1239' }}>{err}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 rounded-full font-semibold text-sm disabled:opacity-50"
            style={{ background: 'var(--ink)', color: 'var(--bg)' }}
          >
            {busy ? 'Saving…' : 'Continue to dashboard →'}
          </button>
        </form>
      </div>
      <style jsx>{`
        .input {
          width: 100%;
          padding: 11px 14px;
          border-radius: 12px;
          border: 1px solid var(--line);
          background: #fff;
          outline: none;
          font-size: 14px;
        }
        .input:focus { border-color: var(--amber); }
      `}</style>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mono text-[10px] tracking-widest mb-1" style={{ color: 'var(--ink-soft)' }}>{label}</div>
      {children}
    </label>
  );
}
