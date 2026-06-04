/**
 * SM-2 (SuperMemo 2) spaced-repetition algorithm.
 *
 * Pure function — no Prisma, no I/O. Easy to unit-test against the canonical
 * SuperMemo reference: https://www.supermemo.com/en/blog/the-true-history-of-spaced-repetition
 *
 * Inputs are the card's current state. Output is the new state plus the next
 * due date. The caller persists it.
 */
import type { CardState } from '@prisma/client';

/** Self-rated recall quality after a review. */
export type Quality = 0 | 1 | 2 | 3 | 4 | 5;

export interface Sm2State {
  /** Multiplier applied to the interval on each successful repetition. */
  easeFactor: number;
  /** Days until the next review. */
  intervalDays: number;
  /** Number of consecutive successful repetitions. */
  repetitions: number;
}

export interface Sm2Step extends Sm2State {
  nextDueAt: Date;
}

/** Floor for the ease factor — below this, the card cycles too quickly. */
export const MIN_EASE = 1.3;

/** Advance an SM-2 card by one review. */
export function sm2Step(state: Sm2State, quality: Quality, now: Date = new Date()): Sm2Step {
  let { easeFactor, intervalDays, repetitions } = state;

  if (quality < 3) {
    // Failed — reset interval and repetitions, but keep ease (will be lowered below).
    repetitions = 0;
    intervalDays = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) intervalDays = 1;
    else if (repetitions === 2) intervalDays = 6;
    else intervalDays = Math.round(intervalDays * easeFactor);
  }

  // Standard SM-2 ease update — applied even on failures so a hard streak is punished.
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < MIN_EASE) easeFactor = MIN_EASE;

  const nextDueAt = new Date(now.getTime() + intervalDays * 24 * 60 * 60_000);
  return { easeFactor, intervalDays, repetitions, nextDueAt };
}

/**
 * Maps the new {repetitions, quality} back to a Prisma CardState enum so the
 * dashboard widgets can show meaningful buckets (LEARNING / REVIEWING / MASTERED).
 */
export function nextStateFor(quality: Quality, newRepetitions: number): CardState {
  if (quality < 3) return 'LEARNING';
  if (newRepetitions >= 4) return 'MASTERED';
  if (newRepetitions >= 2) return 'REVIEWING';
  return 'LEARNING';
}
