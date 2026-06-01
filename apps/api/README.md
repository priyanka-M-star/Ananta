# @ananta/api

NestJS application. The transactional brain of Ananta — auth, students/parents, classes, quizzes, doubts, payments, notifications.

The AI worker (`apps/ai-worker`) handles the slow / GPU stuff and is a separate process.

---

## Run locally

```bash
# from monorepo root
docker compose -f infra/docker-compose.yml up -d   # Postgres, Redis, LiveKit, MinIO, MailHog
pnpm db:generate                                    # generate Prisma client
pnpm db:migrate                                     # run migrations
pnpm db:seed                                        # seed subjects, plans, launch-gate, achievements

# this app
cd apps/api
cp .env.example .env                                # fill in real values for prod use
pnpm dev                                            # http://localhost:4000/v1
```

Health probes:
```bash
curl http://localhost:4000/v1/health
curl http://localhost:4000/v1/health/ready
```

---

## Folder layout

```
src/
├── main.ts                     bootstrap, global pipes, CORS
├── app.module.ts               root module — wires everything
├── common/
│   ├── prisma.module.ts        global Prisma client provider
│   ├── api-response.interceptor.ts
│   ├── zod-validation.pipe.ts  validates body/query against @ananta/types schemas
│   ├── decorators/current-user.decorator.ts
│   └── health.controller.ts    /v1/health, /v1/health/ready
└── modules/
    ├── auth/                   OTP via MSG91, JWT issuance, JwtAuthGuard
    ├── students/               profile, progress aggregates
    ├── launch-gate/            the ≥10-members + July-2026 rule + daily cron
    ├── classes/                today, this-week, join
    ├── quizzes/                start, submit, auto-grade
    ├── doubts/                 submit, list, receive-answer-from-ai-worker
    ├── payments/               Razorpay subscriptions + webhook
    └── notifications/          MSG91 (SMS OTP) + WhatsApp Cloud API
```

Every module follows the same shape: `<name>.module.ts` + `<name>.service.ts` + `<name>.controller.ts`. Add new modules in `src/modules/<name>/` and register them in `app.module.ts`.

---

## Auth flow

```
1) POST /v1/auth/request-otp     { phone, purpose }
   → MSG91 sends a 6-digit code; in dev the code is logged + returned

2) POST /v1/auth/verify-otp      { phone, code, purpose }
   → returns { token, userId, isNew }

3) POST /v1/students/onboard     (with Authorization: Bearer <token>)
   → creates the Student row, fills referral code

4) GET  /v1/students/me/progress (with Bearer token)
   → returns the dashboard aggregates
```

The student is created lazily on first verify when `purpose=signup`.

---

## Modules still to add (follow the same pattern)

- **notes** — auto-generated lesson notes (read; AI worker creates them)
- **materials** — PYQs, worksheets, syllabus
- **memory-deck** — flashcard CRUD + due-today queue + SM-2 review
- **weekly-test** — Sunday paper + attempt
- **parents** — link parent → child, fetch reports
- **admin** — founder-side: lesson queue, doubt review, launch-gate config

Each goes in `src/modules/<name>/`, gets registered in `app.module.ts`, and reuses the `PRISMA` provider + `JwtAuthGuard` patterns.

---

## Conventions

- All write endpoints validate body with `new ZodValidationPipe(SomeSchema)` and the schema lives in `@ananta/types`.
- Every protected endpoint uses `@UseGuards(JwtAuthGuard)` + `@CurrentUser() user`.
- Responses are wrapped in `{ ok: true, data: ... }` by `ApiResponseInterceptor` so the frontend can rely on a consistent envelope.
- Throttling: 120 req/min/IP globally, with stricter limits on OTP endpoints.
