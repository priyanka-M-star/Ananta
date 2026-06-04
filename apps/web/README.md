# @ananta/web

Next.js 14 (App Router). The student/parent-facing web app.

Talks to the NestJS API (`apps/api`). Pulls types from `@ananta/types` and
Tailwind tokens from `@ananta/config`.

---

## Run locally

```bash
# from monorepo root: bring up Postgres + Redis + LiveKit
docker compose -f infra/docker-compose.yml up -d
pnpm db:generate && pnpm db:migrate && pnpm db:seed

# start the API
pnpm --filter @ananta/api dev    # http://localhost:4000/v1

# this app
cd apps/web
cp .env.example .env.local       # NEXT_PUBLIC_API_URL defaults to localhost:4000
pnpm dev                         # http://localhost:3000
```

The full sign-up flow works end-to-end against the local API: phone → OTP
(printed to API console in dev) → onboarding → dashboard.

---

## Folder layout

```
src/
├── middleware.ts                 soft auth gate for protected routes
├── lib/
│   ├── api.ts                    typed API client (uses @ananta/types)
│   └── auth.ts                   token storage helpers (localStorage Phase 1)
├── components/
│   └── TeacherPortrait.tsx       the six anime SVG portraits, as a component
└── app/
    ├── layout.tsx                root layout, fonts, TeacherPortraitDefs
    ├── globals.css               Tailwind + Ananta CSS variables
    ├── page.tsx                  landing
    ├── LaunchGatePill.tsx        client component — live "X of 10 reserved"
    ├── signup/page.tsx           phone → OTP → onboarding
    ├── login/page.tsx            phone → OTP → dashboard
    ├── onboarding/page.tsx       name, grade, medium, school, referral
    └── dashboard/page.tsx        live data: greeting, countdown, stats,
                                  tonight's class card, 6 subjects, memory deck
```

---

## Pages still to add (follow the same pattern)

Each maps directly to one of the HTML mockups in the repo root — copy the
markup, convert `class` → `className`, replace mock data with API calls.

- `app/live/page.tsx`         from `Ananta_Live_Class.html` (Maths) and `Ananta_Live_Class_Social.html`
- `app/post-class/page.tsx`   from `Ananta_Post_Class.html`
- `app/profile/page.tsx`      from `Ananta_Student_Profile.html`
- `app/parent/page.tsx`       from `Ananta_Parent_Dashboard.html`
- `app/admin/page.tsx`        from `Ananta_Admin_Panel.html`

All of them use the same `TeacherPortrait` component, hit the `api` client,
share the Tailwind preset.

---

## Three.js

The 3D scenes in the HTML mockups load Three.js r128 from CDN. In the React
app we'll move to `react-three-fiber` + `@react-three/drei`. The plan is
documented in the upcoming `Ananta_3D_Strategy.html`.
