"use strict";
/**
 * @ananta/types — Shared type definitions (zod schemas + TS types)
 *
 * Both frontend and backend import from here so wire shapes stay in sync.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateSubscriptionSchema = exports.QuizSubmitSchema = exports.SubmitDoubtSchema = exports.StudentOnboardingSchema = exports.MediumSchema = exports.GradeSchema = exports.VerifyOtpSchema = exports.RequestOtpSchema = exports.PhoneSchema = void 0;
const zod_1 = require("zod");
// ============================================================
// Auth
// ============================================================
exports.PhoneSchema = zod_1.z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Must be a valid Indian phone number');
exports.RequestOtpSchema = zod_1.z.object({
    phone: exports.PhoneSchema,
    purpose: zod_1.z.enum(['login', 'signup']),
});
exports.VerifyOtpSchema = zod_1.z.object({
    phone: exports.PhoneSchema,
    code: zod_1.z.string().length(6).regex(/^\d{6}$/),
    purpose: zod_1.z.enum(['login', 'signup']),
});
// ============================================================
// Student onboarding
// ============================================================
exports.GradeSchema = zod_1.z.enum(['GRADE_10', 'GRADE_11', 'GRADE_12']);
exports.MediumSchema = zod_1.z.enum(['ENGLISH', 'KANNADA']);
exports.StudentOnboardingSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2).max(80),
    displayName: zod_1.z.string().max(40).optional(),
    grade: exports.GradeSchema,
    medium: exports.MediumSchema,
    school: zod_1.z.string().max(120).optional(),
    city: zod_1.z.string().max(60).optional(),
    pincode: zod_1.z
        .string()
        .regex(/^\d{6}$/, 'Pincode must be 6 digits')
        .optional(),
    referralCode: zod_1.z.string().max(20).optional(),
});
// ============================================================
// Doubts (live class chat)
// ============================================================
exports.SubmitDoubtSchema = zod_1.z.object({
    classSessionId: zod_1.z.string().uuid(),
    source: zod_1.z.enum(['TYPED', 'VOICE']),
    question: zod_1.z.string().min(2).max(2000),
    questionAudioUrl: zod_1.z.string().url().optional(),
});
// ============================================================
// Quiz
// ============================================================
exports.QuizSubmitSchema = zod_1.z.object({
    attemptId: zod_1.z.string().uuid(),
    responses: zod_1.z.array(zod_1.z.object({
        questionId: zod_1.z.string().uuid(),
        answer: zod_1.z.unknown(),
    })),
});
// ============================================================
// Payments
// ============================================================
exports.CreateSubscriptionSchema = zod_1.z.object({
    planId: zod_1.z.string().uuid(),
    referralCode: zod_1.z.string().max(20).optional(),
});
//# sourceMappingURL=index.js.map