/**
 * @ananta/types — Shared type definitions (zod schemas + TS types)
 *
 * Both frontend and backend import from here so wire shapes stay in sync.
 */

import { z } from 'zod';

// ============================================================
// Auth
// ============================================================

export const PhoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'Must be a valid Indian phone number');

export const RequestOtpSchema = z.object({
  phone: PhoneSchema,
  purpose: z.enum(['login', 'signup']),
});
export type RequestOtpInput = z.infer<typeof RequestOtpSchema>;

export const VerifyOtpSchema = z.object({
  phone: PhoneSchema,
  code: z.string().length(6).regex(/^\d{6}$/),
  purpose: z.enum(['login', 'signup']),
});
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;

// ============================================================
// Student onboarding
// ============================================================

export const GradeSchema = z.enum(['GRADE_10', 'GRADE_11', 'GRADE_12']);
export const MediumSchema = z.enum(['ENGLISH', 'KANNADA']);

export const StudentOnboardingSchema = z.object({
  fullName: z.string().min(2).max(80),
  displayName: z.string().max(40).optional(),
  grade: GradeSchema,
  medium: MediumSchema,
  school: z.string().max(120).optional(),
  city: z.string().max(60).optional(),
  pincode: z
    .string()
    .regex(/^\d{6}$/, 'Pincode must be 6 digits')
    .optional(),
  referralCode: z.string().max(20).optional(),
});
export type StudentOnboardingInput = z.infer<typeof StudentOnboardingSchema>;

// ============================================================
// Doubts (live class chat)
// ============================================================

export const SubmitDoubtSchema = z.object({
  classSessionId: z.string().uuid(),
  source: z.enum(['TYPED', 'VOICE']),
  question: z.string().min(2).max(2000),
  questionAudioUrl: z.string().url().optional(),
});
export type SubmitDoubtInput = z.infer<typeof SubmitDoubtSchema>;

// ============================================================
// Quiz
// ============================================================

export const QuizSubmitSchema = z.object({
  attemptId: z.string().uuid(),
  responses: z.array(
    z.object({
      questionId: z.string().uuid(),
      answer: z.unknown(),
    }),
  ),
});
export type QuizSubmitInput = z.infer<typeof QuizSubmitSchema>;

// ============================================================
// Payments
// ============================================================

export const CreateSubscriptionSchema = z.object({
  planId: z.string().uuid(),
  referralCode: z.string().max(20).optional(),
});
export type CreateSubscriptionInput = z.infer<typeof CreateSubscriptionSchema>;

// ============================================================
// API envelope
// ============================================================

export type ApiSuccess<T> = {
  ok: true;
  data: T;
};

export type ApiError = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ============================================================
// Pacing
// ============================================================

export type PacingProgress = {
  totalDays: 180;
  completedDays: number;
  currentDayIndex: number;
  daysRemaining: number;
  estimatedCompletionDate: string; // ISO
};
