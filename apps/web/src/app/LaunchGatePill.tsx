'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

/**
 * Live "X of 10 students reserved" chip at the top of the landing page.
 * Client component because it hits the live API; falls back gracefully.
 */
export function LaunchGatePill() {
  const [data, setData] = useState<{ reservations: number; minMembers: number } | null>(null);

  useEffect(() => {
    api.launchGate()
      .then((d) => setData({ reservations: d.reservations, minMembers: d.minMembers }))
      .catch(() => setData({ reservations: 0, minMembers: 10 }));
  }, []);

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium mb-4 border"
      style={{ background: '#fff', color: 'var(--ink)', borderColor: 'var(--line)' }}
    >
      <span className="w-2 h-2 rounded-full" style={{ background: 'var(--emerald)' }} />
      {data
        ? `Live classes begin July 2026, once ${data.minMembers} students have joined (${data.reservations} so far).`
        : 'Live classes begin July 2026 — reservations open now.'}
    </div>
  );
}
