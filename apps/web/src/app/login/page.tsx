'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { saveSession } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [stage, setStage] = useState<'phone' | 'code'>('phone');
  const [debugCode, setDebugCode] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setBusy(true);
    try {
      const r = await api.requestOtp({ phone, purpose: 'login' });
      if (r.debug) setDebugCode(r.debug);
      setStage('code');
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Failed to send code');
    } finally { setBusy(false); }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setBusy(true);
    try {
      const r = await api.verifyOtp({ phone, code, purpose: 'login' });
      saveSession(r.token, r.userId);
      router.push('/dashboard');
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Wrong code, try again');
    } finally { setBusy(false); }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="paper-card-strong rounded-3xl p-8 w-full max-w-md">
        <div className="mono text-xs tracking-widest mb-2" style={{ color: 'var(--ink-soft)' }}>— SIGN IN</div>
        <h1 className="serif text-3xl font-bold">Welcome back.</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--ink-soft)' }}>
          We'll send a 6-digit code to your phone.
        </p>

        {stage === 'phone' && (
          <form onSubmit={sendCode} className="mt-6 space-y-3">
            <label className="block">
              <div className="mono text-[10px] tracking-widest mb-1" style={{ color: 'var(--ink-soft)' }}>PHONE</div>
              <div className="flex items-center rounded-xl border overflow-hidden" style={{ borderColor: 'var(--line)' }}>
                <span className="px-3 text-sm" style={{ color: 'var(--ink-soft)' }}>+91</span>
                <input
                  inputMode="numeric"
                  pattern="[6-9]\d{9}"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 py-3 outline-none bg-transparent text-sm"
                  placeholder="9XXXXXXXXX"
                  required
                />
              </div>
            </label>
            {err && <p className="text-sm" style={{ color: '#9F1239' }}>{err}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 rounded-full font-semibold text-sm disabled:opacity-50"
              style={{ background: 'var(--ink)', color: 'var(--bg)' }}
            >
              {busy ? 'Sending…' : 'Send code'}
            </button>
          </form>
        )}

        {stage === 'code' && (
          <form onSubmit={verify} className="mt-6 space-y-3">
            <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
              We sent a code to +91 {phone}.
              {debugCode && <em className="block mt-1">[dev] code is {debugCode}</em>}
            </p>
            <input
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full py-3 px-4 rounded-xl border outline-none text-center tracking-[.5em] text-xl font-bold mono"
              style={{ borderColor: 'var(--line)' }}
              placeholder="••••••"
              required
              autoFocus
            />
            {err && <p className="text-sm" style={{ color: '#9F1239' }}>{err}</p>}
            <button
              type="submit"
              disabled={busy || code.length !== 6}
              className="w-full py-3 rounded-full font-semibold text-sm disabled:opacity-50"
              style={{ background: 'var(--ink)', color: 'var(--bg)' }}
            >
              {busy ? 'Verifying…' : 'Sign in'}
            </button>
            <button type="button" onClick={() => setStage('phone')} className="w-full text-xs underline" style={{ color: 'var(--ink-soft)' }}>
              Use a different phone
            </button>
          </form>
        )}

        <p className="text-xs mt-6 text-center" style={{ color: 'var(--ink-soft)' }}>
          New here? <Link href="/signup" className="underline" style={{ color: 'var(--ink)' }}>Create an account</Link>
        </p>
      </div>
    </main>
  );
}
