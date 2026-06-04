/**
 * Typed API client. Single fetch wrapper that:
 *   - prepends the base URL
 *   - attaches the JWT from localStorage
 *   - unwraps { ok: true, data: ... } responses
 *   - throws ApiError with the server's code/message on failure
 */
import type {
  ApiResponse,
  RequestOtpInput,
  VerifyOtpInput,
  StudentOnboardingInput,
  QuizSubmitInput,
  CreateSubscriptionInput,
  SubmitDoubtInput,
} from '@ananta/types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export class ApiError extends Error {
  constructor(public code: string, message: string, public status: number, public details?: unknown) {
    super(message);
  }
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('ananta_token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...init, headers, cache: 'no-store' });
  const json = (await res.json().catch(() => ({}))) as ApiResponse<T> | { error?: { code: string; message: string; details?: unknown } };

  if (!res.ok || ('ok' in json && !json.ok)) {
    const err = ('error' in json ? json.error : undefined) ?? { code: 'http_error', message: res.statusText };
    throw new ApiError(err.code, err.message, res.status, (err as { details?: unknown }).details);
  }
  return (json as { ok: true; data: T }).data;
}

export const api = {
  // ---------- Auth ----------
  requestOtp: (body: RequestOtpInput) =>
    call<{ sent: true; debug?: string }>('/auth/request-otp', { method: 'POST', body: JSON.stringify(body) }),

  verifyOtp: (body: VerifyOtpInput) =>
    call<{ token: string; userId: string; isNew: boolean }>('/auth/verify-otp', { method: 'POST', body: JSON.stringify(body) }),

  // ---------- Students ----------
  onboard: (body: StudentOnboardingInput) =>
    call<unknown>('/students/onboard', { method: 'POST', body: JSON.stringify(body) }),

  me: () => call<{ id: string; fullName: string; grade: string; medium: string; currentStreakDays: number; totalXp: number }>('/students/me'),

  myProgress: () =>
    call<{
      classesAttended: number;
      averageQuizPercent: number | null;
      quizzesTaken: number;
      memoryDeck: { total: number; mastered: number; learning: number; reviewing: number; new: number };
      subjects: { id: string; code: string; nameEn: string; teacherName: string }[];
    }>('/students/me/progress'),

  // ---------- Launch gate ----------
  launchGate: () =>
    call<{ reservations: number; minMembers: number; targetLaunchDate: string; isLaunched: boolean; canLaunch: boolean; seatsLeft: number }>('/launch-gate'),

  // ---------- Classes ----------
  classesToday: (grade = 'GRADE_10', medium = 'ENGLISH') =>
    call<unknown>(`/classes/today?grade=${grade}&medium=${medium}`),

  classesThisWeek: (grade = 'GRADE_10', medium = 'ENGLISH') =>
    call<unknown[]>(`/classes/this-week?grade=${grade}&medium=${medium}`),

  joinClass: (classSessionId: string) =>
    call<unknown>(`/classes/${classSessionId}/join`, { method: 'POST' }),

  // ---------- Quizzes ----------
  getQuiz: (quizId: string) =>
    call<QuizForStudent>(`/quizzes/${quizId}`),

  getQuizForLesson: (lessonId: string) =>
    call<QuizForStudent | null>(`/lessons/${lessonId}/quiz`),

  startQuiz: (quizId: string) =>
    call<{ id: string; quizId: string }>(`/quizzes/${quizId}/start`, { method: 'POST' }),

  submitQuiz: (body: QuizSubmitInput) =>
    call<QuizResult>('/quizzes/submit', { method: 'POST', body: JSON.stringify(body) }),

  // ---------- Doubts ----------
  submitDoubt: (body: SubmitDoubtInput) =>
    call<{ id: string; status: string }>('/doubts', { method: 'POST', body: JSON.stringify(body) }),

  // ---------- Payments ----------
  createSubscription: (body: CreateSubscriptionInput) =>
    call<{ subscription: { id: string }; razorpayShortUrl?: string }>('/payments/subscriptions', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // ---------- Notes ----------
  notes: {
    list: (opts?: { subjectCode?: string; limit?: number }) => {
      const q = new URLSearchParams();
      if (opts?.subjectCode) q.set('subjectCode', opts.subjectCode);
      if (opts?.limit) q.set('limit', String(opts.limit));
      const qs = q.toString();
      return call<NoteListItem[]>(`/notes${qs ? `?${qs}` : ''}`);
    },
    get: (id: string) => call<NoteFull>(`/notes/${id}`),
    markDownloaded: (id: string) =>
      call<{ ok: true }>(`/notes/${id}/mark-downloaded`, { method: 'POST' }),
  },

  // ---------- Materials ----------
  materials: {
    list: (opts?: { subjectCode?: string; type?: string; chapterId?: string; search?: string; limit?: number }) => {
      const q = new URLSearchParams();
      if (opts?.subjectCode) q.set('subjectCode', opts.subjectCode);
      if (opts?.type) q.set('type', opts.type);
      if (opts?.chapterId) q.set('chapterId', opts.chapterId);
      if (opts?.search) q.set('search', opts.search);
      if (opts?.limit) q.set('limit', String(opts.limit));
      const qs = q.toString();
      return call<MaterialItem[]>(`/materials${qs ? `?${qs}` : ''}`);
    },
    libraryStats: () =>
      call<{ total: number; byType: Record<string, number> }>('/materials/library-stats'),
    trending: (limit = 4) =>
      call<(MaterialItem & { weeklyDownloads: number })[]>(`/materials/trending?limit=${limit}`),
    download: (id: string) =>
      call<{ fileUrl: string }>(`/materials/${id}/download`, { method: 'POST' }),
  },

  // ---------- Memory Deck ----------
  memoryDeck: {
    summary: () =>
      call<{ total: number; dueToday: number; NEW: number; LEARNING: number; REVIEWING: number; MASTERED: number }>(
        '/memory-deck/summary',
      ),
    due: (limit = 50) => call<MemoryCard[]>(`/memory-deck/due?limit=${limit}`),
    review: (id: string, quality: 0 | 1 | 2 | 3 | 4 | 5) =>
      call<MemoryCard>(`/memory-deck/cards/${id}/review`, {
        method: 'POST',
        body: JSON.stringify({ quality }),
      }),
    create: (body: { front: string; back: string; tags?: string[]; lessonId?: string }) =>
      call<MemoryCard>('/memory-deck/cards', { method: 'POST', body: JSON.stringify(body) }),
  },
};

// ---------- Response shapes ----------
export interface NoteListItem {
  id: string;
  language: 'ENGLISH' | 'KANNADA';
  pageCount: number | null;
  wordCount: number | null;
  generatedAt: string;
  lesson: {
    id: string;
    titleEn: string;
    titleKn: string | null;
    durationMin: number;
    subject: { code: string; nameEn: string; teacherName: string; themeColor: string };
    chapter: { number: number; titleEn: string };
  };
}
export interface NoteFull extends NoteListItem {
  contentHtml: string;
  contentMarkdown: string | null;
  pdfUrl: string | null;
}
export interface MaterialItem {
  id: string;
  type: 'WORKSHEET' | 'PYQ' | 'REFERENCE' | 'SYLLABUS' | 'BLUEPRINT' | 'ANSWER_KEY';
  titleEn: string;
  titleKn: string | null;
  description: string | null;
  fileUrl: string;
  fileSizeBytes: number;
  pageCount: number | null;
  year: number | null;
  isFree: boolean;
  downloadCount: number;
  subject: { code: string; nameEn: string; themeColor: string };
  chapter: { number: number; titleEn: string } | null;
}
export interface QuizQuestionForStudent {
  id: string;
  orderIndex: number;
  type: 'MCQ_SINGLE' | 'MCQ_MULTI' | 'TRUE_FALSE' | 'FILL_BLANK' | 'NUMERIC';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  textEn: string;
  textKn: string | null;
  options: { id: string; textEn: string; textKn?: string }[];
  points: number;
}
export interface QuizForStudent {
  id: string;
  titleEn: string;
  titleKn: string | null;
  durationMin: number;
  passPercentage: number;
  questions: QuizQuestionForStudent[];
}
export interface QuizResultExplanation {
  questionId: string;
  explanationEn: string | null;
  correctAnswer: unknown;
}
export interface QuizResult {
  id: string;
  scorePoints: number;
  scorePercent: number;
  passed: boolean;
  durationSec: number | null;
  responses: { questionId: string; studentAnswer: unknown; isCorrect: boolean; pointsEarned: number }[];
  explanations: QuizResultExplanation[];
}
export interface MemoryCard {
  id: string;
  front: string;
  back: string;
  tags: string[];
  state: 'NEW' | 'LEARNING' | 'REVIEWING' | 'MASTERED';
  easeFactor: string;        // Decimal as string from JSON
  intervalDays: number;
  repetitions: number;
  dueAt: string;
  lastReviewedAt: string | null;
}
