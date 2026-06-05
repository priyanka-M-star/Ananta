/**
 * @ananta/types — Shared type definitions (zod schemas + TS types)
 *
 * Both frontend and backend import from here so wire shapes stay in sync.
 */
import { z } from 'zod';
export declare const PhoneSchema: z.ZodString;
export declare const RequestOtpSchema: z.ZodObject<{
    phone: z.ZodString;
    purpose: z.ZodEnum<["login", "signup"]>;
}, "strip", z.ZodTypeAny, {
    phone: string;
    purpose: "login" | "signup";
}, {
    phone: string;
    purpose: "login" | "signup";
}>;
export type RequestOtpInput = z.infer<typeof RequestOtpSchema>;
export declare const VerifyOtpSchema: z.ZodObject<{
    phone: z.ZodString;
    code: z.ZodString;
    purpose: z.ZodEnum<["login", "signup"]>;
}, "strip", z.ZodTypeAny, {
    phone: string;
    purpose: "login" | "signup";
    code: string;
}, {
    phone: string;
    purpose: "login" | "signup";
    code: string;
}>;
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;
export declare const GradeSchema: z.ZodEnum<["GRADE_10", "GRADE_11", "GRADE_12"]>;
export declare const MediumSchema: z.ZodEnum<["ENGLISH", "KANNADA"]>;
export declare const StudentOnboardingSchema: z.ZodObject<{
    fullName: z.ZodString;
    displayName: z.ZodOptional<z.ZodString>;
    grade: z.ZodEnum<["GRADE_10", "GRADE_11", "GRADE_12"]>;
    medium: z.ZodEnum<["ENGLISH", "KANNADA"]>;
    school: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    pincode: z.ZodOptional<z.ZodString>;
    referralCode: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    fullName: string;
    grade: "GRADE_10" | "GRADE_11" | "GRADE_12";
    medium: "ENGLISH" | "KANNADA";
    displayName?: string | undefined;
    school?: string | undefined;
    city?: string | undefined;
    pincode?: string | undefined;
    referralCode?: string | undefined;
}, {
    fullName: string;
    grade: "GRADE_10" | "GRADE_11" | "GRADE_12";
    medium: "ENGLISH" | "KANNADA";
    displayName?: string | undefined;
    school?: string | undefined;
    city?: string | undefined;
    pincode?: string | undefined;
    referralCode?: string | undefined;
}>;
export type StudentOnboardingInput = z.infer<typeof StudentOnboardingSchema>;
export declare const SubmitDoubtSchema: z.ZodObject<{
    classSessionId: z.ZodString;
    source: z.ZodEnum<["TYPED", "VOICE"]>;
    question: z.ZodString;
    questionAudioUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    classSessionId: string;
    source: "TYPED" | "VOICE";
    question: string;
    questionAudioUrl?: string | undefined;
}, {
    classSessionId: string;
    source: "TYPED" | "VOICE";
    question: string;
    questionAudioUrl?: string | undefined;
}>;
export type SubmitDoubtInput = z.infer<typeof SubmitDoubtSchema>;
export declare const QuizSubmitSchema: z.ZodObject<{
    attemptId: z.ZodString;
    responses: z.ZodArray<z.ZodObject<{
        questionId: z.ZodString;
        answer: z.ZodUnknown;
    }, "strip", z.ZodTypeAny, {
        questionId: string;
        answer?: unknown;
    }, {
        questionId: string;
        answer?: unknown;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    attemptId: string;
    responses: {
        questionId: string;
        answer?: unknown;
    }[];
}, {
    attemptId: string;
    responses: {
        questionId: string;
        answer?: unknown;
    }[];
}>;
export type QuizSubmitInput = z.infer<typeof QuizSubmitSchema>;
export declare const CreateSubscriptionSchema: z.ZodObject<{
    planId: z.ZodString;
    referralCode: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    planId: string;
    referralCode?: string | undefined;
}, {
    planId: string;
    referralCode?: string | undefined;
}>;
export type CreateSubscriptionInput = z.infer<typeof CreateSubscriptionSchema>;
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
export type PacingProgress = {
    totalDays: 180;
    completedDays: number;
    currentDayIndex: number;
    daysRemaining: number;
    estimatedCompletionDate: string;
};
//# sourceMappingURL=index.d.ts.map