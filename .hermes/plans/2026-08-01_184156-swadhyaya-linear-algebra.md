# Swadhyaya — Intuition-First Linear Algebra Platform

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Build a gamified, intuition-first, fully interactive Linear Algebra learning platform that takes a student from "what is a number on a plane" to SVD / eigen-decomposition / PCA — with no formula memorization, only deep visual + interactive intuition, professional aesthetic, and competitive play.

**SINGLE-DAY DEADLINE — PRODUCTION READY. GO DEEP, NOT WIDE.** ~15-18 deep concepts with production-quality interactive playgrounds, full 4-act depth, no broken chains, boss battle + leaderboard + streak, deployed to Vercel. No parallel subagents — I build sequentially, one brain, full focus. Each playground is exceptionally polished (60fps, multiple play modes, animation transitions, 3-5 thoughtful questions). Cut from 43 to ~17 concepts by selecting the highest-impact ones and skipping "apply what you already know" intros. No Manim videos, no Supabase, no image upload (use stock SVD demo images), no per-concept Strang deep dives (credit + link only).

**Day budget (8-10 hours of focused execution):**
- 0:00-0:30 — Scaffold Next.js + Tailwind v4 + dark theme + chrome
- 0:30-1:30 — Math engine: vectors, matrices, eigen, SVD (with tests)
- 1:30-3:00 — Viz primitives: VectorCanvas, MatrixInput, 3D Transform, EigenOverlay, SVDAnimation, ImageCompressor
- 3:00-7:00 — All 43 concept MDX content + working playgrounds (parallelized)
- 7:00-8:00 — ConceptNode template + 4-act system + course map + routing
- 8:00-9:00 — Boss battle, leaderboard, streak, lens modes
- 9:00-9:30 — Aesthetic pass, performance, visual regression
- 9:30-10:00 — Polish, README, deploy to Vercel

**Parallelization strategy:** After the math engine is locked, content authoring (43 MDX) + question bank authoring (43 JSON) + viz component hardening can run in parallel subagents.

**Architecture:** Next.js 15 (App Router) + TypeScript + Tailwind v4 + Framer Motion + Three.js / React-Three-Fiber for 3D. Pure client-side math (no server-side linear algebra library) — the student should be able to tweak every coefficient and SEE the geometric meaning. All visualizations are React components driven by live state. Pyodide / WebAssembly can host numpy as an optional verification engine (compare student intuition vs. ground truth). Course is organized as a directed graph of "Concept Nodes" — every node has: 1-sentence intuition, 1-paragraph deep definition (no jargon), an interactive playground, a "guess what happens" challenge, a reflection quiz.

**Tech Stack:**
- **Framework:** Next.js 15 (App Router, RSC), TypeScript strict
- **Styling:** Tailwind v4, shadcn/ui, Radix primitives, Framer Motion, lucide-react (NO emoji in chrome)
- **Math rendering:** KaTeX (server-rendered where possible)
- **2D viz:** Custom SVG + d3-scale + d3-zoom (we own the rendering — no chart library) + react-spring for tweened animations
- **3D viz:** @react-three/fiber + @react-three/drei + leva (controls panel)
- **State:** Zustand (per-concept local state) + persist middleware (localStorage for progress, streak, unlocks)
- **Math engine:** Math.js (evaluation) + custom matrix utils in TS. Optional Pyodide for the "verify your answer" panel
- **Animation choreography:** Manim-style keyframes via Framer Motion variants + a small DSL `seq([anim1, anim2, anim3])`
- **Auth/progress:** local-first. Phase 1: anonymous, all data in localStorage. Phase 2: optional Supabase for leaderboard
- **Testing:** Vitest (math correctness) + Playwright (visual regression on key playground snapshots)
- **Aesthetic reference:** Linear / Vercel / BM-Studio-Visualizer2026 — dark canvas (#0a0a0f), generous whitespace, type-driven, single accent color per concept (spectrum-mapped across the curriculum: red vectors, blue matrices, green transformations, purple eigen-directions, gold singular values)

---

## Teaching Philosophy (locked — do not drift from this)

Every single concept node follows the same 4-act structure. This is the atomic unit of the platform. We will not ship anything that breaks this contract.

**Act 1 — "Puzzle" (10 sec):** Student is shown a 1-second animation with NO explanation. Just an image. "What do you see?" Catches curiosity.

**Act 2 — "Story" (3 min read):** Plain-English narrative, NO jargon, NO Greek letters, NO LaTeX-heavy blocks. Use metaphors a 12-year-old understands. If a term must be introduced, it gets its OWN tooltip card with a one-line definition + a tiny interactive.

**Act 3 — "Playground" (open-ended):** Interactive widget. Every input the student changes immediately shows geometric + numeric feedback. The student is FORCED to discover the formula by playing. Tooltip hints appear after 3 wrong attempts (not before).

**Act 4 — "Test" (60 sec):** 3-5 challenges per concept. Mix of: (a) "predict what the matrix does to this vector", (b) "match the matrix to the picture", (c) "rank the singular values from this picture", (d) "what happens if I change this one number?". Wrong answers don't penalize — they trigger a hint video + a replay of the relevant playground.

Every concept node ALSO has:
- **"Why care?" tab:** 1 real-world application (e.g., how PCA works in your phone's face unlock)
- **"Strang footnote" tab:** One short quote / diagram from Strang's textbook for the student who wants the formal layer
- **"Connect the dots" tab:** 2-3 hyperlinks to other nodes that this concept unlocks

---

## Curriculum — Concept Graph (Iyengar-Aligned)

The full linear-algebra curriculum is modeled as a DAG. Each node is a `Concept` with prerequisites. The student can ONLY unlock a node if its prerequisites are "intuition-locked" (passed Act 4 once).

**Pedagogy backbone: Prof. Sudarshan Iyengar (IIT Madras, NPTEL "Mathematics - Linear Algebra")** — sequence is concrete-first (Ax=b), abstraction-earned (vector spaces come AFTER systems are well understood), matrix-of-a-transformation gets its own module, dual space is first-class. Source: https://nptel.ac.in/courses/111106051. Merged with 3Blue1Brown's visual sequencing and BetterExplained's plain-English voice.

### Phase 1 — Systems of Linear Equations (where the world starts)

1. **`L1: What is an Equation?`** — single line on a number line, the geometric meaning of solutions.
2. **`L2: Two Unknowns, Two Equations`** — intersection of two lines (parallel, intersecting, same line).
3. **`L3: Three Equations, Three Unknowns`** — three planes meeting at a point.
4. **`L4: The Matrix Form Ax = b`** — THE moment matrices enter. Student sees coefficients, unknowns, constants become rows/columns.
5. **`L5: Row Operations — Multiply, Swap, Add`** — interactive: solve a 2x2 by clicking row operations.
6. **`L6: Row-Echelon Form (Gaussian Elimination)** — student performs elimination step-by-step, watches the matrix morph.
7. **`L7: Row-Reduced Echelon Form (RREF)** — back-substitution, the unique answer.
8. **`L8: Homogeneous vs Non-Homogeneous** — Ax = 0 has different structure than Ax = b.

### Phase 2 — Vector Spaces (the abstraction now earned)

9. **`V1: Vectors are Arrows, not Lists`** — drag the tail, head follows. Direction, magnitude, the arrow doesn't care where it starts.
10. **`V2: Adding and Scaling — Linear Combinations`** — head-to-tail walk, stretch with a number.
11. **`V3: The Vector Space Axioms Made Visual`** — closure, zero vector, additive inverse, scalar identity.
12. **`V4: Subspaces** — subsets closed under add + scale. The plane through origin. Lines through origin. Origin itself.
13. **`V5: Span — Everything You Can Reach`** — two arrows = the whole plane. Three in 2D = still whole. Two parallel = only a line.
14. **`V6: Linear Independence — No Redundant Arrows`** — drag one, watch if the others can fill in for it.
15. **`V7: Basis — The Minimum Set That Spans** — drag a basis, see the whole space covered.
16. **`V8: Dimension — How Many Basis Vectors` — the invariant number.

### Phase 3 — Linear Transformations

17. **`T1: What is a Transformation?`** — function between spaces. Visual: a point on the left, where does it land on the right?
18. **`T2: Why LINEAR Matters** — preserves add and scale. Non-linear = the grid warps unevenly.
19. **`T3: The Matrix of a Transformation** — given a basis, every linear T becomes a matrix. The bridge.
20. **`T4: Null Space (What Gets Squashed) and Range Space (What's Reachable)`**
21. **`T5: Rank-Nullity Theorem — The Most Important Equation in Linear Algebra`**
22. **`T6: Isomorphisms — Same Shape, Different Name`**
23. **`T7: Composition = Matrix Multiplication`**
24. **`T8: Inverse — The Undo Button`**

### Phase 4 — The Four Subspaces & Dual Space (Iyengar's signature)

25. **`F1: The Four Fundamental Subspaces`** — column, row, null, left-null. All in one picture.
26. **`F2: Row Space and Column Space** — the picture-perfect pair.
27. **`F3: Linear Functionals — A Function to a Number`**
28. **`F4: The Dual Space — All Functionals Form Their Own Space`**
29. **`F5: Dual Basis** — every basis has a partner basis in the dual.
30. **`F6: Annihilator — The Functionals That Vanish on a Subspace`**
31. **`F7: Transpose of a Transformation (T → T*)`**
32. **`F8: The Double-Dual Theorem (V** = V)`**

### Phase 5 — Eigenvalues & Eigenvectors

33. **`E1: The Special Vectors That Don't Change Direction** — student finds them by exploration.
34. **`E2: Eigenvalue = "How Much It Stretched"`** — λ > 1 stretches, 0 < λ < 1 squishes, λ < 0 flips.
35. **`E3: Characteristic Polynomial — det(A - λI) = 0** — where the eigenvalues come from.
36. **`E4: Diagonalization — When A = PDP⁻¹** — the simplest form.
37. **`E5: Cayley-Hamilton — Every Matrix Satisfies Its Own Characteristic Equation`**
38. **`E6: The Minimal Polynomial** — the smallest equation it satisfies.

### Phase 6 — Invariant Subspaces & Triangulability

39. **`I1: Invariant Subspaces** — subspaces T sends to themselves.
40. **`I2: Triangulability (Over the Complex Numbers)`**
41. **`I3: Diagonalization via the Minimal Polynomial`**

### Phase 7 — Direct Sum Decompositions & Projections

42. **`P1: Direct Sum = How Subspaces Combine`**
43. **`P2: Projection Operators`**
44. **`P3: Invariant Direct Sums`**

### Phase 8 — Primary & Cyclic Decomposition (the deep end)

45. **`C1: Primary Decomposition Theorem`**
46. **`C2: Jordan Decomposition`**
47. **`C3: Cyclic Subspaces and Rational Canonical Form`**

### Phase 9 — Inner Products, SVD & Applications (the payoff)

48. **`I1: Inner Product — Generalized Dot Product`**
49. **`I2: Orthogonality`**
50. **`I3: Gram-Schmidt — Making Arrows Perpendicular`**
51. **`I4: QR Decomposition`**
52. **`I5: SVD — Every Matrix is Rotate-Scale-Rotate`**
53. **`I6: SVD Image Compression — Real Pictures Compressed Live`**
54. **`I7: PCA — The Best Camera Angle for Your Data`**
55. **`I8: Least Squares as Projection`**

**Total: 55 concept nodes** spread across 9 phases — full Iyengar depth plus the application payoff (SVD/PCA/least-squares). This is the most rigorous AND intuitive linear algebra curriculum on the web.

**Production-ready scope (today):** Phases 1-5 + key SVD (L1-L8, V1-V8, T1-T8, F1-F8, E1-E6, S5/S7/S8) = **~38 concepts** with full 4-act depth, working playgrounds, question banks. Phase 6-8 + remaining Phase 9 dropped as "Coming next" with locked nodes.

---

## Gamification Layer

- **XP & Levels:** Every Act 4 completion gives XP. Levels unlock "Lens Modes" (e.g., level 5 unlocks "eigen-overlay" — see eigen-arrows drawn on any transformation by default).
- **Streaks:** Daily streak. Miss a day = lose 1 lens mode. Streak shown as a flame, NOT an emoji (use SVG).
- **The Boss Battle (the "Beat Others" feature):** Daily ranked puzzle. Same 5-question set for everyone, ranked by speed + accuracy. Leaderboard (local-only in Phase 1, Supabase in Phase 2). The puzzles are pulled from the concept graph — random sample, weighted by what the user has unlocked.
- **Concept Graph Map:** An interactive 2D map of all 43 nodes, nodes gray until unlocked, color-fills when intuition-locked. Click a node = see its 4-act content.
- **"Predict Mode":** For every playground, there's a "Cover the formula, what's the answer?" toggle. Student has to predict before the formula is revealed.
- **Replay System:** Every session recorded. Replay shows a side-by-side "what you did vs. what the formula said". Used as the post-Act-4 reflection.

---

## Visual / Interaction Library

We build a small, custom component library. NO chart libraries — we own every pixel.

**2D Canvas Component (`<VectorCanvas>`):**
- SVG-based, 600×600, snap-to-grid optional
- Props: `vectors`, `transformations`, `showGrid`, `showAxes`, `showLabels`, `interactive`
- Children can be: points, arrows, regions (parallelograms), eigen-arrows (auto-styled)
- Renders at 60fps even with 200+ arrows via SVG `<g>` with `transform="matrix()"`

**3D Canvas Component (`<Transform3D>`):**
- R3F, 600×600, OrbitControls
- Default scene: a 3D house/duck made of triangles (or 3D vector field)
- Drag any matrix coefficient via leva, see the duck warp

**Matrix Input Component (`<MatrixInput>`):**
- Visual mode (default): 2 column-arrows the student drags
- Numeric mode (advanced): click a cell, type a number, watch visual update
- Toggle between them at any time

**Playground Driver (`<Playground>`):**
- Wraps any 2D/3D canvas + matrix input + formula reveal panel
- Tracks student attempts in Zustand
- After 3 wrong: triggers hint

**Concept Node Template (`<ConceptNode>`):**
- Renders Act 1 / Act 2 / Act 3 / Act 4 in a vertical scroll with sticky nav
- Tabs: Why care / Strang footnote / Connect the dots
- Progress persisted to localStorage

**Course Map (`<CourseMap>`):**
- Force-directed graph, but deterministic
- Nodes: circles with the concept icon
- Edges: prerequisite lines
- Click a node = navigate to it
- Unlocked = solid color, locked = gray, current = pulsing ring

---

## File Structure

```
swadhyaya/
├── app/
│   ├── layout.tsx                          # Root layout, dark theme, fonts
│   ├── page.tsx                            # Landing — pitch + "Start Learning" CTA
│   ├── learn/
│   │   ├── page.tsx                        # Course map (the DAG)
│   │   └── [slug]/
│   │       └── page.tsx                    # Individual concept node
│   ├── play/
│   │   └── page.tsx                        # Daily Boss Battle
│   ├── leaderboard/
│   │   └── page.tsx                        # Top learners (Phase 1: local-only)
│   └── about/
│       └── page.tsx                        # About + Strang credit + how it's built
│
├── components/
│   ├── ui/                                 # shadcn primitives — Button, Card, Tabs, etc.
│   ├── concept/
│   │   ├── ConceptNode.tsx                 # The 4-act template
│   │   ├── Act1Puzzle.tsx
│   │   ├── Act2Story.tsx
│   │   ├── Act3Playground.tsx
│   │   ├── Act4Test.tsx
│   │   ├── WhyCareTab.tsx
│   │   ├── StrangFootnoteTab.tsx
│   │   └── ConnectDotsTab.tsx
│   ├── viz/
│   │   ├── VectorCanvas.tsx                # 2D SVG canvas
│   │   ├── Transform3D.tsx                 # 3D R3F canvas
│   │   ├── MatrixInput.tsx                 # Visual matrix editor
│   │   ├── EigenOverlay.tsx                # Auto-drawn eigen-arrows
│   │   ├── SVDAnimation.tsx                # The U-Σ-Vᵀ dance
│   │   └── ImageCompressor.tsx             # SVD image demo
│   ├── course/
│   │   ├── CourseMap.tsx                   # Interactive DAG
│   │   ├── PhaseHeader.tsx
│   │   └── ProgressBar.tsx
│   ├── play/
│   │   ├── BossBattle.tsx                  # Daily 5-question
│   │   ├── QuestionCard.tsx
│   │   └── LeaderboardTable.tsx
│   ├── chrome/
│   │   ├── TopNav.tsx                      # Logo, progress, streak
│   │   ├── SideRail.tsx                    # Phase navigator
│   │   └── Footer.tsx
│   └── math/
│       ├── vectors.ts                      # Vec2 / Vec3 / dot / cross
│       ├── matrices.ts                     # Mat2 / Mat3 / mul / det / inv / eigen / SVD
│       ├── ml-extended.ts                  # 4×4, 5×5 generic
│       └── format.ts                       # Display helpers
│
├── content/
│   ├── concepts/                           # One MDX per concept node
│   │   ├── N1-number-line.mdx
│   │   ├── N2-two-number-lines.mdx
│   │   ├── ... (43 files)
│   │   └── S9-real-world.mdx
│   ├── curriculum.ts                       # DAG definition (nodes, edges, phases, xp)
│   ├── questions/                          # Question banks (JSON)
│   │   ├── M1-questions.json
│   │   ├── M2-questions.json
│   │   └── ...
│   └── credits.ts                          # Strang / BetterExplained / 3B1B attributions
│
├── lib/
│   ├── store/
│   │   ├── progress.ts                     # Zustand: unlocked nodes, xp, streak
│   │   ├── playground.ts                   # Per-concept attempt state
│   │   └── battle.ts                       # Boss battle state
│   ├── scoring.ts                          # XP rules, level thresholds
│   ├── unlocks.ts                          # "Given unlocked set, what's next?"
│   ├── persistence.ts                      # localStorage adapter
│   └── analytics.ts                        # Anonymous, local-only learning telemetry
│
├── public/
│   ├── fonts/                              # Inter, JetBrains Mono, Fraunces (serif for stories)
│   ├── images/                             # Strang diagrams, 3B1B screenshots (with credit)
│   └── demo/                               # Sample images for SVD compression
│
├── tests/
│   ├── math/
│   │   ├── vectors.test.ts
│   │   ├── matrices.test.ts
│   │   ├── eigen.test.ts
│   │   └── svd.test.ts                     # Property tests against numpy via Pyodide
│   ├── components/
│   │   ├── VectorCanvas.test.tsx
│   │   └── MatrixInput.test.tsx
│   └── e2e/
│       ├── learn-flow.spec.ts              # Unlock N1 → N2 → M1
│       └── battle.spec.ts                  # Daily boss battle
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── visual-regression.yml
│
├── README.md
├── LICENSE
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
└── package.json
```

---

## Step-by-Step Plan

### Phase A — Scaffold & Aesthetic Foundation (Days 1-2)

#### Task 1: Initialize Next.js 15 + TypeScript + Tailwind v4

**Files:**
- Create: `swadhyaya/package.json`
- Create: `swadhyaya/tsconfig.json`
- Create: `swadhyaya/next.config.ts`
- Create: `swadhyaya/tailwind.config.ts`
- Create: `swadhyaya/postcss.config.mjs`
- Create: `swadhyaya/app/globals.css`
- Create: `swadhyaya/app/layout.tsx`
- Create: `swadhyaya/app/page.tsx`

**Steps:**
1. `cd swadhyaya && pnpm init`
2. Install: next@15, react@19, typescript, @types/react, @types/node, tailwindcss@4, @tailwindcss/postcss, framer-motion, lucide-react, clsx, tailwind-merge
3. Configure `tsconfig.json` with strict mode, paths alias `@/*` → `./*`
4. Configure Tailwind v4 with custom theme: `bg-canvas: #0a0a0f`, `text-ink: #f5f5f7`, accent spectrum
5. Root layout: Inter for UI, Fraunces (serif) for Act 2 stories, JetBrains Mono for matrices/numbers
6. `app/page.tsx`: Landing with one-line pitch, "Start Learning" button, faint concept-graph preview
7. Run `pnpm dev` and verify at localhost:3000
8. Commit: `chore: scaffold Next.js 15 + Tailwind v4 + dark theme`

#### Task 2: Install Visual / Animation / Math Dependencies

**Files:** modify `swadhyaya/package.json`

**Steps:**
1. Install: `@react-three/fiber @react-three/drei three leva zustand d3-scale d3-zoom d3-selection react-spring katex rehype-katex remark-math mathjs`
2. Install dev: `vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom @playwright/test`
3. Initialize Playwright: `npx playwright install`
4. Verify all packages resolve: `pnpm install && pnpm tsc --noEmit`
5. Commit: `chore: install viz, math, animation, test dependencies`

#### Task 3: Build shadcn-Style UI Primitives

**Files:** create under `components/ui/`

**Steps:**
1. Manually create (no shadcn CLI noise): `Button.tsx`, `Card.tsx`, `Tabs.tsx`, `Dialog.tsx`, `Tooltip.tsx`, `Slider.tsx`, `Progress.tsx`
2. Each uses Radix primitives + Tailwind, exposes `className` via `cn()` (clsx + tailwind-merge)
3. NO emoji anywhere — use lucide icons
4. Add a `StorybookLite` route at `/dev/components` (only in dev) that renders all primitives for visual QA
5. Commit: `feat(ui): core component primitives`

#### Task 4: Build Top Nav, Side Rail, Footer (Chrome)

**Files:** create `components/chrome/TopNav.tsx`, `SideRail.tsx`, `Footer.tsx`

**Steps:**
1. TopNav: logo (custom SVG, not emoji), progress ring, streak counter (flame SVG), level chip, all in dark glass
2. SideRail: 6 phase links, current phase highlighted, locked phases dimmed
3. Footer: "Built for intuition · Credits to Strang, 3B1B, BetterExplained" — actual text, no marketing
4. Mount in `app/layout.tsx`
5. Commit: `feat(chrome): nav, side rail, footer`

#### Task 5: Build the Concept DAG (Data + Types)

**Files:** create `content/curriculum.ts`, `lib/store/progress.ts`

**Steps:**
1. Define TypeScript types: `ConceptId = 'N1' | 'N2' | ... | 'S9'`, `Phase = 1|2|3|4|5|6`, `ConceptNode = { id, phase, title, slug, prereqs: ConceptId[], xpReward, ... }`
2. Hardcode all 43 nodes in `curriculum.ts` with their prereqs
3. Zustand store `progress`: `unlocked: Set<ConceptId>`, `completed: Set<ConceptId>`, `xp: number`, `streak: number`, `lastVisit: ISO`, `lensModes: Set<string>`
4. `persistence.ts` adapter: load from `localStorage.swadhyaya.progress` on init, write on every change (debounced)
5. Unit test: unlocking `N1` makes `N2` available
6. Commit: `feat(data): concept DAG + progress store`

### Phase B — Math Engine (Days 3-4)

#### Task 6: 2D Vector Math (vectors.ts + tests)

**Files:** create `components/math/vectors.ts`, `tests/math/vectors.test.ts`

**Steps:**
1. TDD: write tests for `vec2`, `add`, `sub`, `scale`, `dot`, `length`, `normalize`, `angle`, `cross2` (signed area)
2. Implement the smallest set to pass
3. Run vitest, all green
4. Commit: `feat(math): 2D vector operations`

#### Task 7: 2D Matrix Math (matrices.ts + tests)

**Files:** create `components/math/matrices.ts`, `tests/math/matrices.test.ts`

**Steps:**
1. TDD: `mat2`, `mul`, `mulVec`, `det`, `inv`, `transpose`, `eigen` (analytic 2×2), `trace`
2. For 2×2 eigen: test vectors are eigenvectors, eigenvalues match
3. Commit: `feat(math): 2D matrix operations + eigen`

#### Task 8: Generic NxN Matrices + SVD (Power Iteration)

**Files:** create `components/math/ml-extended.ts`, `tests/math/svd.test.ts`

**Steps:**
1. Implement `mat` (number[][]) with helpers: `mulMatMat`, `mulMatVec`, `transpose`, `det` (Laplace, n≤5)
2. `eigen(M, k=2)`: power iteration + deflation, returns `{values, vectors}` for the k largest
3. `svd(M)`: simplified Golub-Kahan-Reinsch for 2×2 / 3×3 — exact formulas. For larger: numerical via eigen of MᵀM
4. Property tests: for 100 random matrices, verify M = U Σ Vᵀ to 1e-6
5. Commit: `feat(math): generic matrix ops + SVD via eigen of MᵀM`

#### Task 9: Format Helpers + Display Logic

**Files:** create `components/math/format.ts`

**Steps:**
1. `formatNum(x, decimals=3)`: strips trailing zeros, handles scientific
2. `formatMatrix(M)`: monospace multi-line string with brackets
3. `formatVector(v)`: arrow notation
4. Tests for edge cases (0, NaN, Infinity — should display as `—` not `NaN`)
5. Commit: `feat(math): display formatters`

### Phase C — Visualization Primitives (Days 5-7)

#### Task 10: `<VectorCanvas>` (2D SVG)

**Files:** create `components/viz/VectorCanvas.tsx`, `tests/components/VectorCanvas.test.tsx`

**Steps:**
1. Props: `width=600`, `height=600`, `worldSize=10` (-10..10 by default), `vectors: Vec2[]`, `transform?: Mat2`, `showGrid`, `interactive`
2. Renders: axes, grid, unit square (which becomes the parallelogram under transform), vectors as arrows
3. Renders the TRANSFORMED grid: each grid point goes through `transform`, lines drawn between — this is the warping effect
4. Snap-to-grid toggle
5. Test: snapshot the SVG output for a known transform (rotation 90°) and verify it matches the expected serialized string
6. Commit: `feat(viz): 2D VectorCanvas with transform preview`

#### Task 11: `<MatrixInput>` (Visual + Numeric)

**Files:** create `components/viz/MatrixInput.tsx`

**Steps:**
1. Visual mode: 2 large draggable arrows in a 2D canvas. The arrows ARE the columns of the matrix.
2. Numeric mode: 2×2 grid of number inputs, sync with visual
3. Toggle button between modes
4. Live update: any drag changes the underlying matrix state, which updates any `<VectorCanvas transform={...}>` consumer
5. Test: dragging an arrow updates the numeric matrix to the correct values
6. Commit: `feat(viz): MatrixInput with visual + numeric modes`

#### Task 12: `<Transform3D>` (R3F)

**Files:** create `components/viz/Transform3D.tsx`

**Steps:**
1. R3F canvas with a "default subject" — a 3D house made of triangles, with edge highlight
2. Leva panel: 3×3 matrix (9 sliders, -3..3)
3. Apply matrix to all vertices of the house
4. OrbitControls so student can rotate around the warped house
5. Toggle: show original vs. transformed
6. Test: snapshot first frame, ensure it's deterministic given a matrix
7. Commit: `feat(viz): 3D Transform3D with house subject`

#### Task 13: `<EigenOverlay>` + `<SVDAnimation>`

**Files:** create `components/viz/EigenOverlay.tsx`, `SVDAnimation.tsx`

**Steps:**
1. `<EigenOverlay>`: given a 2×2 matrix, compute eigen (analytical) and draw 2 arrows in eigen-directions, colored purple + gold, with eigenvalue labels
2. `<SVDAnimation>`: orchestrate a 3-stage Framer Motion sequence — (1) identity grid, (2) apply Vᵀ (rotate), (3) apply Σ (stretch), (4) apply U (rotate), (5) final result. Step-through controls (play / pause / scrubber).
3. Tests: ensure the animation reaches the correct end state for known inputs
4. Commit: `feat(viz): eigen overlay + SVD 3-step animation`

#### Task 14: `<ImageCompressor>` (SVD Image Demo)

**Files:** create `components/viz/ImageCompressor.tsx`

**Steps:**
1. Load a sample grayscale image (a face from `/public/demo/faces/`)
2. Compute SVD, store singular values
3. Slider: k = 1..rank, reconstruct from top k components
4. Show: original | reconstructed (with k shown) | sigma bar chart
5. PSNR / compression ratio display
6. Test: image with rank 5 should compress perfectly at k=5
7. Commit: `feat(viz): SVD image compression playground`

### Phase D — Concept Node System (Days 8-10)

#### Task 15: `<ConceptNode>` Template + 4 Acts

**Files:** create `components/concept/ConceptNode.tsx`, `Act1Puzzle.tsx`, `Act2Story.tsx`, `Act3Playground.tsx`, `Act4Test.tsx`

**Steps:**
1. Layout: vertical scroll, sticky header with concept title + phase breadcrumb + XP reward
2. Tabs: Story / Playground / Test / Why care / Strang / Connect
3. Act1: a 1-second auto-playing animation (no controls) of a striking visual related to the concept, then "What do you see?" prompt
4. Act2: MDX-rendered story, max 800 words, with inline `<VectorCanvas>` or `<MatrixInput>` components
5. Act3: hosts the playground component specific to the concept
6. Act4: 3-5 questions from `content/questions/{id}.json`, sequential, hints on wrong
7. Commit: `feat(concept): 4-act template`

#### Task 16: Write N1-N8 MDX Content (Phase 1)

**Files:** create `content/concepts/N1-number-line.mdx` through `N8-span.mdx`

**Steps:**
1. Each MDX: frontmatter (id, phase, title, xp, prereqs), then the 4 acts' content
2. Stories are PLAIN ENGLISH. No "vector space" or "linear combination" — those come later. Use "arrows", "walk", "recipe".
3. Playground components are embedded by id (e.g., `<MatrixInput id="N7-basis" />`) and resolved at render time
4. Question JSON for each in `content/questions/`
5. Commit: `feat(content): Phase 1 — Foundations (N1-N8)`

#### Task 17: Write M1-M8 MDX Content (Phase 2)

**Files:** create `content/concepts/M1-matrix-is-two-arrows.mdx` through `M8-column-null-space.mdx`

**Steps:**
1. Stories build on the "matrix = two column-arrows" reframe from M1
2. Determinant, inverse, rank, column/null space all introduced via geometric play
3. Each has a working playground
4. Commit: `feat(content): Phase 2 — Matrices as Transformations (M1-M8)`

#### Task 18: Write H1-H7 MDX Content (Phase 3)

**Files:** create `content/concepts/H1-3d-world.mdx` through `H7-projection-matrix.mdx`

**Steps:**
1. Reuses `<Transform3D>` heavily
2. Cross/dot products introduced geometrically (right-hand rule is interactive)
3. Commit: `feat(content): Phase 3 — Higher Dimensions (H1-H7)`

#### Task 19: Write E1-E6 MDX Content (Phase 4)

**Files:** create `content/concepts/E1-eigenvectors.mdx` through `E6-pagerank.mdx`

**Steps:**
1. Eigenvectors discovered by exploration: "find the arrow that doesn't change direction"
2. Eigendecomposition = the 3-step ritual (Snap → Scale → Snap Back)
3. PageRank as the payoff
4. Commit: `feat(content): Phase 4 — Eigenworld (E1-E6)`

#### Task 20: Write S1-S9 MDX Content (Phase 5)

**Files:** create `content/concepts/S1-svd-insight.mdx` through `S9-real-world.mdx`

**Steps:**
1. SVD as "Every transformation is Rotate, Scale, Rotate" — the core insight
2. Image compression is the marquee playground
3. PCA as "best camera angle"
4. Least squares as projection
5. Commit: `feat(content): Phase 5 — SVD & Applications (S1-S9)`

#### Task 21: Write A1-A5 MDX Content (Phase 6, Stretch)

**Files:** create `content/concepts/A1-change-of-basis.mdx` through `A5-tensors.mdx`

**Steps:**
1. Higher-level material, less hand-holding
2. Brief but rigorous
3. Commit: `feat(content): Phase 6 — Stretch (A1-A5)`

### Phase E — Course Map & Navigation (Days 11-12)

#### Task 22: `<CourseMap>` Interactive DAG

**Files:** create `components/course/CourseMap.tsx`, `app/learn/page.tsx`

**Steps:**
1. SVG-based force-directed graph, but pre-computed positions (deterministic — based on phase + index)
2. Phase columns: 6 columns, one per phase
3. Nodes: circles with concept icon, prereq edges as arrows
4. States: locked (gray) / unlocked (color) / completed (filled + check)
5. Current node has a pulsing ring
6. Click → navigate to `/learn/{slug}`
7. Tests: locked nodes aren't clickable, completed nodes show check
8. Commit: `feat(course): interactive DAG map`

#### Task 23: `/learn/[slug]` Route + Unlock Logic

**Files:** create `app/learn/[slug]/page.tsx`, `lib/unlocks.ts`

**Steps:**
1. Parse slug → ConceptId, look up node
2. If node locked (prereqs not all completed) → render "Locked" page with "Concepts to complete first" + a button to the first missing prereq
3. Else render `<ConceptNode>` with the right MDX
4. On Act 4 pass: mark completed in store, award XP, fire confetti
5. Commit: `feat(routing): /learn/[slug] with unlock gating`

### Phase F — Boss Battle & Gamification (Days 13-14)

#### Task 24: Question Bank Generator

**Files:** create `lib/scoring.ts`, `lib/analytics.ts`

**Steps:**
1. Question types: predict-vector, match-matrix-to-picture, rank-singular-values, which-transform
2. Each question has: `id`, `conceptId`, `difficulty (1-5)`, `xp`, `type`, `prompt`, `choices`, `correct`, `hint`
3. Hints unlock after 2 wrong, full solution after 3
4. Commit: `feat(questions): types, scoring, hints`

#### Task 25: `<BossBattle>` Daily Challenge

**Files:** create `components/play/BossBattle.tsx`, `app/play/page.tsx`

**Steps:**
1. On page load: pull a deterministic seed from `today's date`
2. Generate 5 questions: 1 from each phase the user has unlocked
3. Timed (15s/question) with visible countdown
4. Score = (correct * 100) + (time bonus)
5. On finish: show rank within local leaderboard, fire confetti, save to history
6. Tests: same date → same questions (determinism)
7. Commit: `feat(play): daily boss battle`

#### Task 26: Leaderboard (Local, Phase 1)

**Files:** create `components/play/LeaderboardTable.tsx`, `app/leaderboard/page.tsx`

**Steps:**
1. Phase 1: localStorage-based, top 20 daily scores
2. Phase 2 stub: comment in code showing how Supabase will plug in
3. Display: rank, score, concepts unlocked, streak
4. No PII collected
5. Commit: `feat(play): local leaderboard`

#### Task 27: Streak + Lens Mode System

**Files:** modify `lib/store/progress.ts`, create `lib/scoring.ts`

**Steps:**
1. Streak logic: increment on any activity per day, reset after 24h gap
2. Level thresholds: 0/100/300/600/1000/1500/2500/4000/6000/9000 XP
3. Lens modes unlocked at levels: 5 → eigen overlay, 10 → singular value bars, 15 → column space tint, 20 → 3D auto
4. Lens modes show as toggles in `<VectorCanvas>` and `<Transform3D>`
5. Commit: `feat(progress): streak, levels, lens modes`

### Phase G — Polish, Aesthetics, Performance (Days 15-17)

#### Task 28: Aesthetic Pass — Landing Page

**Files:** modify `app/page.tsx`

**Steps:**
1. Hero: one-line pitch in Fraunces serif, animated concept DAG in the background
2. 3 testimonial-style cards (real quotes from Strang lectures / BetterExplained)
3. "Start Learning" CTA scrolls to course map
4. Footer with credits
5. No emoji. Custom SVG illustrations.
6. Commit: `style(landing): aesthetic polish`

#### Task 29: Aesthetic Pass — Concept Node Reading Flow

**Files:** modify `components/concept/*.tsx`

**Steps:**
1. Generous line-height, max-width 70ch for story text
2. Story pulls in inline illustrations at relevant moments
3. Reading progress bar (right edge) for Act 2
4. Floating "next concept" button at the bottom
5. Commit: `style(concept): reading flow polish`

#### Task 30: Aesthetic Pass — Playground Frame

**Files:** modify `components/concept/Act3Playground.tsx`

**Steps:**
1. White card with subtle inner shadow, 1px border
2. Playground takes 70% width, controls panel 30%
3. Reset button + "Show formula" toggle in the top-right
4. Tabs at the top: 2D / 3D / Eigen overlay
5. Commit: `style(playground): aesthetic frame`

#### Task 31: Performance — Render Budget for VectorCanvas

**Files:** modify `components/viz/VectorCanvas.tsx`

**Steps:**
1. Memoize grid-line computation
2. Use `react-spring` for smooth transform updates
3. Virtualize if > 200 arrows (unlikely but safe)
4. Profile with React DevTools — target 60fps
5. Commit: `perf(viz): VectorCanvas render optimization`

#### Task 32: Visual Regression Tests

**Files:** create `tests/e2e/visual.spec.ts`

**Steps:**
1. Playwright snapshots of: landing, course map, N1 concept node, M1 playground, S5 image compressor
2. Run in CI, fail on diff > 1% pixels
3. Commit: `test(e2e): visual regression baselines`

### Phase H — Content Depth & Real-World Tie-Ins (Days 18-19)

#### Task 33: "Why Care?" Real-World Tabs for All 43 Concepts

**Files:** modify each MDX

**Steps:**
1. Each concept gets a 1-paragraph "Why care?" with a real-world tie-in
2. M5 (determinant) → how 3D rendering detects flips
3. M7 (rank) → why your survey is "unanswerable"
4. S5 (image compression) → Instagram, medical imaging
5. S7 (PCA) → face unlock, gene expression analysis
6. Commit: `feat(content): Why Care tabs across curriculum`

#### Task 34: Strang Footnote Tab for Key Concepts

**Files:** create `content/credits.ts`, modify selected MDX

**Steps:**
1. For 8-10 key concepts (eigen, SVD, determinants, least squares), include a Strang quote + reference to his OCW lectures
2. Sourced from `https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/` (cite, do not reproduce)
3. Commit: `feat(content): Strang footnote tabs`

#### Task 35: "Connect the Dots" Auto-Generation

**Files:** modify `components/concept/ConnectDotsTab.tsx`

**Steps:**
1. Use the DAG: outgoing edges = "this unlocks", incoming edges = "this needs"
2. Render as 2 columns with mini-cards
3. Each card shows the next/prev concept with a 1-line "what you just unlocked" / "what you needed"
4. Commit: `feat(concept): Connect the Dots tab`

### Phase I — Backend (Supabase for Phase 2, Days 20-21)

**NOT for Phase 1.** This is documented here as the roadmap.

#### Task 36: Supabase Schema + Auth (Future)
#### Task 37: Global Leaderboard (Future)
#### Task 38: User Profiles + Progress Sync (Future)

### Phase J — Launch (Day 22)

#### Task 39: README, LICENSE, Demo Content

**Files:** modify `README.md`, ensure `LICENSE` (MIT)

**Steps:**
1. README: pitch, screenshots, "how to run locally", "how to contribute", "credits" (Strang, 3B1B, BetterExplained, BM-Studio-Visualizer2026)
2. Animated GIF demo of one playground
3. Commit: `docs: README with pitch + run instructions`

#### Task 40: Deploy to Vercel

**Steps:**
1. Push to GitHub
2. Connect to Vercel
3. Configure env vars (none needed for Phase 1)
4. Custom domain (optional)

#### Task 41: Analytics (Privacy-Respecting)

**Files:** create `lib/analytics.ts`

**Steps:**
1. Plausible / Umami self-hosted, no cookies
2. Track: concept_started, concept_completed, playground_interacted, boss_battle_finished
3. NO PII. NO IP storage. Anonymous.
4. Commit: `feat(analytics): privacy-respecting telemetry`

---

## Tests / Validation

- **Math correctness:** Vitest, all 100+ math tests green. SVD property tests against 100 random matrices.
- **Component smoke:** Vitest + React Testing Library for every viz component.
- **Visual regression:** Playwright snapshots for 5 key pages.
- **End-to-end unlock flow:** Playwright test: visit `/`, click "Start Learning", unlock N1 → N2 → M1 by completing each, verify the course map updates.
- **Daily boss battle determinism:** Playwright: visit `/play` twice on the same day, assert identical questions.
- **Aesthetic regression:** Manual review against Linear / Vercel / BM-Studio-Visualizer2026 reference.

---

## Risks, Tradeoffs, Open Questions

1. **Risk: 43 concepts is a LOT of content.** Each concept has 4 acts + question bank + "Why care" + playground. ~15-20 hours of writing per concept at the deep level intended. **Mitigation:** Phase 1 ships N1-N8 + M1-M3 (11 concepts) as MVP. Rest is staged in weekly drops, NOT all at once.

2. **Risk: SVD math is hard to get right.** Numerical stability for edge cases (repeated singular values, near-singular matrices). **Mitigation:** Property tests + comparison against `numpy.linalg.svd` via Pyodide for verification in dev mode only.

3. **Risk: 3D performance on low-end devices.** **Mitigation:** Lazy-load 3D components (`next/dynamic` with `ssr: false`), provide 2D fallback for every 3D concept.

4. **Risk: Building a leaderboard without auth is confusing.** **Mitigation:** Phase 1: local-only leaderboard with a clear "this device only" badge. Phase 2: opt-in Supabase auth.

5. **Open question: do we need a backend at all for Phase 1?** **Answer: NO.** localStorage is enough. Pure client-side. Cheaper to host, faster to iterate, respects privacy.

6. **Open question: Manim integration?** **Answer: NOT in Phase 1.** Manim is heavy and requires Python. Framer Motion + R3F cover 90% of the animation need. Re-evaluate for Phase 2 if we want studio-quality intro animations per concept.

7. **Risk: BetterExplained / 3B1B copyright.** We are NOT reproducing their content. We reference them as "go read this for the formal layer". Our storytelling is original. **Action:** Add a clear credits page, link to originals, no direct quotes > 50 words.

---

## Aesthetic References (paste this into the design doc)

- **Linear.app** — for the side rail, the way active items have a left accent bar
- **Vercel.com** — for the typography rhythm, the way white space breathes
- **BM-Studio-Visualizer2026** — for the dark canvas + vector-colors-on-black palette
- **3Blue1Brown "Essence of Linear Algebra"** — for the conceptual sequencing (this is our curriculum backbone)
- **BetterExplained** — for the "explain it like a friend at coffee" tone in Act 2
- **Strang's OCW lectures** — for the formal layer in the "Strang footnote" tab

---

## Milestone Schedule (Compressed for Impact)

| Day | Milestone |
|-----|-----------|
| 1-2 | Scaffold + aesthetic foundation + chrome |
| 3-4 | Math engine (vectors, matrices, eigen, SVD) all green |
| 5-7 | Viz primitives (VectorCanvas, MatrixInput, 3D, eigen, SVD anim, image compressor) |
| 8-10 | ConceptNode template + Phase 1 (N1-N8) + Phase 2 (M1-M8) content |
| 11-12 | Course map + routing + unlock logic |
| 13-14 | Boss battle + leaderboard + streak/lens modes |
| 15-17 | Aesthetic pass + performance + visual regression |
| 18-19 | Why Care + Strang + Connect the Dots across all 43 |
| 20-21 | (Phase 2) Supabase — defer |
| 22 | Launch |

**MVP to ship in 14 days:** Phases A-F (scaffold through boss battle) with Phase 1 + 2 content (16 concepts). The remaining 27 concepts are weekly drops post-launch.

---

## Commit Discipline

Conventional commits, ~2-5 commits per task. This repo will land with 100+ commits. Commit messages in English, brief, action-led.

```
chore: ...
feat: ...
feat(content): ...
fix: ...
style: ...
perf: ...
test: ...
docs: ...
```

---

## Done When

- [ ] All 43 concept nodes have working playgrounds (or graceful "coming soon" if phased)
- [ ] Course map DAG renders all 43 nodes with correct lock state
- [ ] Daily boss battle generates deterministic 5-question challenge
- [ ] localStorage persistence works across reloads
- [ ] All math tests pass (Vitest)
- [ ] All visual regression snapshots pass (Playwright)
- [ ] Landing page loads in < 1.5s on Vercel free tier
- [ ] Lighthouse score: Performance > 90, Accessibility > 95
- [ ] README has pitch, run instructions, credits
- [ ] Deployed to Vercel
- [ ] No emoji anywhere in chrome / UI / copy
- [ ] A 14-year-old can complete N1 → M3 in 30 minutes and FEEL the eigen insight by E1
