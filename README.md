# Swadhyaya

Intuition-first Linear Algebra. Learn by playing, not by formula.

A gamified, story-first, fully interactive learning platform for the full
linear algebra curriculum — from "what is a number on a line" to SVD,
eigen-decomposition, and PCA. **44 concepts** across 6 phases, each with
its own dedicated interactive playground.

## Quick start

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

Build, lint, typecheck:

```bash
pnpm build
pnpm typecheck
pnpm lint
```

## Architecture

- **`app/`** — Next.js App Router. Server components for static pages,
  client components for interactive concept flows.
  - `app/page.tsx` — landing
  - `app/learn/page.tsx` — full curriculum map
  - `app/learn/[id]/page.tsx` — single-concept view (story → playground →
    test → why-care → formal-layer → connect)
  - `app/leaderboard/page.tsx` — progress + export/import/reset
  - `app/about/page.tsx` — credits
  - `app/not-found.tsx`, `app/error.tsx`, `app/loading.tsx` — graceful failures
  - `app/sitemap.ts` — auto-generated from curriculum.ts
- **`components/playground/`** — 41 dedicated widgets, one per concept.
  Question-driven widgets live alongside (prefix `Q`).
- **`components/question/`** — shared `QuestionCard` + `QuestionNav`,
  used by every test question across every concept.
- **`components/chrome/`** — TopNav, SideRail (desktop), MobileNav (phone
  bottom bar), AuthButton.
- **`lib/curriculum.ts`** — 44 concepts, phases, prereqs, XP. The single
  source of truth.
- **`lib/questions.ts`** — 60 questions across 44 concepts. Optional
  per-question `playground` field links to question-specific widgets.
- **`lib/progress.ts`** — Zustand store, localStorage-persisted (XP,
  streak, completed concepts, lens modes).
- **`lib/math.ts`** — hand-rolled linear algebra engine (RREF, eigen, SVD,
  PCA). No third-party math dependency in the hot path.
- **`lib/auth.ts`** — **deferred**. Returns `{ status: 'disabled' }` until
  samagama.in credentials land. See [Auth](#auth) below.

## Teaching philosophy

No formula memorization. Every concept is a 6-act experience:

1. **Story** — a real-world narrative (Ram & Lakshman's pocket money, Atul
   walking to Bala's house, the Hill cipher). No jargon. No Greek letters.
2. **Playground** — an interactive widget built specifically for THIS
   concept. Drag controls, see the math live. **No two concepts share a
   playground.** The 3D transformations live in their own R3F component,
   the SVD lives in its own, etc.
3. **Test** — 1-2 challenges that prove the intuition stuck. Many questions
   also have a **question-driven mini-playground** embedded above the
   options — the student manipulates the math directly and watches which
   answer becomes correct (L1-q1's weighing scale, E5-q1's live Cayley-
   Hamilton verifier).
4. **Why care** — Sudarshan-style real-world application (PageRank, MRI,
   face unlock, etc.)
5. **Formal layer** — Strang's framing in formal notation.
6. **Connect** — what concepts this one unlocks, and what unlocked it.
   Makes the chain visible.
7. **Lock-in** — passing the test fires confetti, awards XP, and unlocks
   the next concept. The chain never breaks.

## Curriculum

44 concepts across 6 phases, following **Prof. Sudarshan Iyengar's NPTEL
sequence** (concrete first, abstraction earned, matrix-of-transformation
gets its own module, dual space is first-class):

1. **Systems of Linear Equations** (L1–L8) — what is an equation → Ax=b →
   row operations → RREF → homogeneous vs non-homogeneous
2. **Vector Spaces** (V1–V8) — arrows → linear combinations → subspaces →
   span → independence → basis → dimension
3. **Linear Transformations** (T1–T8, +T2b for 3D) — what they are → why
   linearity matters → the matrix of a transformation → null/range →
   rank-nullity → isomorphism → composition → inverse
4. **Four Subspaces & Dual Space** (F1–F8) — the four fundamental subspaces,
   row vs column space, linear functionals, the dual space V*, dual basis,
   annihilator, transpose T*, the double-dual theorem V** = V
5. **Eigenvalues & Eigenvectors** (E1–E6) — discovery, eigenvalue,
   characteristic polynomial, diagonalization, Cayley-Hamilton, minimal poly
6. **SVD & Applications** (S1–S5) — A = UΣVᵀ decomposition, SVD image
   compression, PCA, least squares as projection

Every concept has its own dedicated playground. The playground renders
live math (eigenvectors, SVD, RREF, PCA axes, etc.) computed in the
browser via `lib/math.ts`.

## Keyboard shortcuts

On any concept page:

| Key | Action |
| --- | --- |
| `1` | Story tab |
| `2` | Playground tab |
| `3` | Test tab |
| `4` | Why-care tab (if present) |
| `5` | Formal-layer tab (if present) |
| `6` | Connect tab (if prereqs) |
| `Esc` | Browser back |

Shortcuts are suppressed when an input is focused or modifier keys are
held. On mobile, the bottom nav (Home / Map / Progress / Credits)
replaces the desktop SideRail.

## Deploying

The app is a standard Next.js 15 production build:

```bash
pnpm build && pnpm start --port 3000
```

Deploys cleanly to Vercel, Netlify, Cloudflare Pages, any Node host, or
a Docker container. The build output is a self-contained `.next/`
directory.

Environment variables (see `.env.example`):

```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_APP_NAME=Swadhyaya

# Auth (only needed when you flip AUTH_ENABLED in lib/auth.ts)
NEXT_PUBLIC_SAMAGAMA_AUTH_URL=***
NEXT_PUBLIC_SAMAGAMA_CLIENT_ID=your_client_id
NEXT_PUBLIC_SAMAGAMA_REDIRECT_URI=https://your-domain.com/auth/callback
SAMAGAMA_CLIENT_SECRET=***
```

## Auth

The platform runs **fully without authentication**. Progress is saved to
localStorage in the browser. No account, no login, no fake user.

`samagama.in` is the planned identity provider, but the OAuth client
credentials and JS SDK aren't wired yet. Until they are, `lib/auth.ts`
returns `{ status: 'disabled', user: null }` and the TopNav shows a
muted "Sign-in is paused" indicator with a hover popover explaining the
state.

To enable:

1. Set the `NEXT_PUBLIC_SAMAGAMA_AUTH_URL`, `NEXT_PUBLIC_SAMAGAMA_CLIENT_ID`,
   `NEXT_PUBLIC_SAMAGAMA_REDIRECT_URI`, and `SAMAGAMA_CLIENT_SECRET` env vars.
2. Set `AUTH_ENABLED = true` in `lib/auth.ts`.
3. Implement the OAuth round-trip in the `login()` function (popup →
   callback → token exchange → profile fetch → persist to localStorage).

The `.env.example` documents the env vars; the `// TODO` comments in
`login()` walk through the standard OAuth flow.

## Stack

- **Next.js 15** (App Router) + **TypeScript** strict
- **Tailwind CSS** with a custom warm-dark theme (aligned with
  [Tenali](https://github.com/vicharanashala/tenali))
- Custom **SVG vector canvas** (`components/viz/VectorCanvas.tsx`) — we own
  every pixel, no chart library
- **@react-three/fiber + drei** for the two 3D playgrounds (transform-3d,
  planes-3d), lazy-loaded with `next/dynamic` + `{ ssr: false }`
- **Zustand** with localStorage persistence for progress, XP, streak
- **Math.js** for general parsing where needed
- **canvas-confetti** for the lock-in celebration
- **No emoji in chrome** — lucide-react SVG icons only
- **Dark theme** by default: warm brown canvas (#1a1614) + warm orange
  accent (#e8864a) + serif headlines (Source Serif 4) + DM Sans body

## Credits

The platform is a synthesis of four teaching traditions:

- **[Prof. Sudarshan Iyengar](https://nptel.ac.in/courses/111106051)** — IIT
  Madras NPTEL "Mathematics: Linear Algebra". The rigorous sequence.
- **[Sudarshan's Codershigh Matrix Mystics](https://sudarshansudarshan.github.io/codershigh/matrixmystics/)**
  — the story-first problem style. Hill cipher, PageRank, etc.
- **[3Blue1Brown](https://www.3blue1brown.com/topics/linear-algebra)** —
  the visual sequencing. "Matrix = where i-hat and j-hat go."
- **[Kalid Azad / BetterExplained](https://betterexplained.com/articles/linear-algebra-guide/)**
  — the "explain it like a friend at coffee" voice.
- **[Gilbert Strang](https://math.mit.edu/~gs)** — the formal layer (cited,
  not reproduced).

Theme inspired by [Tenali](https://github.com/vicharanashala/tenali)'s
warm dark palette.

## License

MIT
