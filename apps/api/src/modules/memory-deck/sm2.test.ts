import { describe, expect, it } from 'vitest';
import { MIN_EASE, nextStateFor, sm2Step, type Sm2State } from './sm2';

const fixedNow = new Date('2026-05-29T00:00:00Z');
const dayMs = 24 * 60 * 60_000;

function freshCard(): Sm2State {
  return { easeFactor: 2.5, intervalDays: 0, repetitions: 0 };
}

describe('sm2Step', () => {
  it('first successful review uses a 1-day interval', () => {
    const out = sm2Step(freshCard(), 4, fixedNow);
    expect(out.repetitions).toBe(1);
    expect(out.intervalDays).toBe(1);
    expect(out.nextDueAt.getTime() - fixedNow.getTime()).toBe(dayMs);
  });

  it('second successful review uses a 6-day interval', () => {
    let state = sm2Step(freshCard(), 4, fixedNow) as Sm2State;
    const out = sm2Step(state, 4, fixedNow);
    expect(out.repetitions).toBe(2);
    expect(out.intervalDays).toBe(6);
  });

  it('third+ successful review multiplies by ease factor', () => {
    let state: Sm2State = freshCard();
    state = sm2Step(state, 4, fixedNow);   // rep 1, interval 1
    state = sm2Step(state, 4, fixedNow);   // rep 2, interval 6
    const out = sm2Step(state, 4, fixedNow);
    expect(out.repetitions).toBe(3);
    // ease factor stays at 2.5 with quality 4 (delta is exactly 0); 6 * 2.5 = 15.
    expect(out.intervalDays).toBe(15);
  });

  it('quality < 3 resets repetitions and uses 1-day interval', () => {
    let state = sm2Step(freshCard(), 5, fixedNow);
    state = sm2Step(state, 5, fixedNow);
    state = sm2Step(state, 5, fixedNow); // mastered-ish
    const lapsed = sm2Step(state, 1, fixedNow);
    expect(lapsed.repetitions).toBe(0);
    expect(lapsed.intervalDays).toBe(1);
    // Ease factor goes down on a failure
    expect(lapsed.easeFactor).toBeLessThan(state.easeFactor);
  });

  it('ease factor floors at MIN_EASE (1.3)', () => {
    let state: Sm2State = { easeFactor: 1.32, intervalDays: 30, repetitions: 5 };
    for (let i = 0; i < 5; i++) state = sm2Step(state, 0, fixedNow);
    expect(state.easeFactor).toBe(MIN_EASE);
  });

  it('quality 5 nudges ease factor up; quality 3 leaves it lower', () => {
    const q5 = sm2Step(freshCard(), 5, fixedNow);
    const q3 = sm2Step(freshCard(), 3, fixedNow);
    expect(q5.easeFactor).toBeGreaterThan(q3.easeFactor);
  });

  it('next due date is interval × 1 day after the supplied now', () => {
    const out = sm2Step({ easeFactor: 2.5, intervalDays: 0, repetitions: 1 }, 4, fixedNow);
    expect(out.nextDueAt.getTime()).toBe(fixedNow.getTime() + out.intervalDays * dayMs);
  });
});

describe('nextStateFor', () => {
  it('failure goes to LEARNING regardless of streak', () => {
    expect(nextStateFor(2, 0)).toBe('LEARNING');
    expect(nextStateFor(0, 5)).toBe('LEARNING');
  });

  it('first success is LEARNING', () => {
    expect(nextStateFor(4, 1)).toBe('LEARNING');
  });

  it('2-3 successful reps is REVIEWING', () => {
    expect(nextStateFor(4, 2)).toBe('REVIEWING');
    expect(nextStateFor(4, 3)).toBe('REVIEWING');
  });

  it('4+ successful reps is MASTERED', () => {
    expect(nextStateFor(4, 4)).toBe('MASTERED');
    expect(nextStateFor(5, 9)).toBe('MASTERED');
  });
});
