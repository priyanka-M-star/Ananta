'use client';

import { useEffect, useState } from 'react';

/**
 * Decides whether to render Three.js or the 2D fallback.
 *
 * Per the 3D Strategy doc, we drop to Lite when ANY of these is true:
 *   - OS-level reduced motion is on
 *   - WebGL2 isn't available
 *   - Reported device memory is under 2 GB
 *   - Effective network is slow-2g or 2g
 *   - User explicitly toggled it (localStorage 'ananta_lite' = '1')
 *
 * SSR-safe: returns 'three' on the server, then re-checks in useEffect on the
 * client. That avoids hydration mismatches while still routing low-end devices
 * to Lite on first interaction.
 */
export type ThreeDMode = 'three' | 'lite';

const STORAGE_KEY = 'ananta_lite';

function detect(): ThreeDMode {
  if (typeof window === 'undefined') return 'three';

  // Manual override always wins
  if (localStorage.getItem(STORAGE_KEY) === '1') return 'lite';

  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return 'lite';
  if (!('WebGL2RenderingContext' in window)) return 'lite';

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { effectiveType?: string };
  };
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory < 2) return 'lite';

  const eff = nav.connection?.effectiveType;
  if (eff === 'slow-2g' || eff === '2g') return 'lite';

  return 'three';
}

export function use3dMode(): ThreeDMode {
  const [mode, setMode] = useState<ThreeDMode>('three');
  useEffect(() => {
    setMode(detect());
  }, []);
  return mode;
}

export function setLiteMode(on: boolean): void {
  if (typeof window === 'undefined') return;
  if (on) localStorage.setItem(STORAGE_KEY, '1');
  else localStorage.removeItem(STORAGE_KEY);
}
