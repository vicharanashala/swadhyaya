// Question bank. For each concept, 5 questions. Each has a unique id.
// Types: "predict" (predict output), "match" (which picture), "rank" (order), "identify" (which property)

export type QuestionType = "predict" | "match" | "rank" | "identify" | "truefalse" | "fill";

export interface Question {
  id: string;
  conceptId: string;
  type: QuestionType;
  prompt: string;
  hint: string;
  xp: number;
  // Optional: a question-specific interactive playground. When set, the
  // question UI embeds this widget above the options, so the student
  // can manipulate the math directly and observe which option becomes
  // correct. Falls back to text-only options if absent.
  playground?: string;
  options: Array<{ id: string; label: string; correct?: boolean }>;
  explanation: string;
}

// Each concept's unique interactive playground. New questions reuse
// the concept-level playground so every story has its own bespoke
// interactive widget — one per concept, distinct across concepts.
const CONCEPT_PLAYGROUND: Record<string, string> = {
  L1: "lines-2d-one",
  L2: "lines-2d-two",
  L3: "planes-3d",
  L4: "matrix-times-vec",
  L5: "row-ops",
  L6: "gaussian",
  L7: "rref",
  L8: "homogeneous",
  V1: "vector-arrow",
  V2: "linear-combination",
  V3: "add-scale",
  V4: "subspace",
  V5: "span",
  V6: "independence",
  V7: "basis",
  V8: "dimension",
  T1: "transformation",
  T2: "linear-matters",
  T2b: "transform-3d",
  T3: "matrix-cols",
  T4: "null-range",
  T5: "rank-nullity",
  T6: "isomorphism",
  T7: "matrix-times-mat",
  T8: "inverse",
  F1: "four-subspaces",
  F2: "row-col",
  F3: "functional",
  F4: "dual",
  F5: "dual-basis",
  F6: "annihilator",
  F7: "transpose",
  F8: "double-dual",
  E1: "eigen-discover-v2",
  E2: "eigenvalue",
  E3: "characteristic-2",
  E4: "diagonalize",
  E5: "cayley-hamilton",
  E6: "minimal-poly",
  S1: "svd-animate",
  S2: "svd-image",
  S3: "pca",
  S4: "least-squares",
  S5: "pca",
};

// Helper: build a question
let _qid = 0;
const q = (
  conceptId: string,
  type: QuestionType,
  prompt: string,
  options: Array<{ id: string; label: string; correct?: boolean }>,
  explanation: string,
  hint: string = "Re-read the playground carefully.",
  xp: number = 10,
  playground?: string,
): Question => {
  // Build-time validation: every question must have at least one option
  // and exactly one option flagged as correct.
  const correctCount = options.filter((o) => o.correct).length;
  if (options.length < 2) {
    throw new Error(
      `Question for ${conceptId} needs at least 2 options, got ${options.length}`,
    );
  }
  if (correctCount !== 1) {
    throw new Error(
      `Question for ${conceptId} must have exactly 1 correct option, got ${correctCount}`,
    );
  }
  // Default playground: each concept's unique widget. Pass an explicit
  // playground string to override (used by bespoke per-question widgets).
  const pg = playground ?? CONCEPT_PLAYGROUND[conceptId];
  return {
    id: `${conceptId}-${++_qid}`,
    conceptId,
    type,
    prompt,
    options,
    explanation,
    hint,
    xp,
    playground: pg,
  };
};

export const QUESTIONS: Question[] = [
  // L1
  q("L1", "predict",
    "If 2x + 3 = 11, what is x?",
    [
      { id: "a", label: "x = 4", correct: true },
      { id: "b", label: "x = 3" },
      { id: "c", label: "x = 5" },
      { id: "d", label: "x = 8" },
    ],
    "2x = 8, so x = 4. The two sides of the equation agree at x = 4.",
    "Drag the slider on the weighing scale until both pans balance.",
    10,
    "q-L1-q1"),
  q("L1", "truefalse",
    "The equation y = 2x + 1 is satisfied at the point (0, 0).",
    [
      { id: "a", label: "True" },
      { id: "b", label: "False", correct: true },
    ],
    "At x = 0, y = 1, not 0. (0, 0) does not satisfy the equation."),

  // L2
  q("L2", "predict",
    "Two lines y = 2x + 1 and y = -x + 4. Where do they meet?",
    [
      { id: "a", label: "(1, 3)", correct: true },
      { id: "b", label: "(2, 5)" },
      { id: "c", label: "(0, 4)" },
      { id: "d", label: "Never" },
    ],
    "Set equal: 2x + 1 = -x + 4, so 3x = 3, x = 1. y = 2(1) + 1 = 3.",
    "Drag the line slopes and intercepts in the playground — watch the meeting point slide.",
    10,
    "q-L2-q1"),
  q("L2", "truefalse",
    "If two lines have the same slope, they meet at exactly one point.",
    [
      { id: "a", label: "True" },
      { id: "b", label: "False", correct: true },
    ],
    "Parallel lines (same slope, different intercept) never meet. They have no point in common.",
    "Drag the two slopes in the playground below — make them equal.",
    10,
    "q-L2-q2"),

  // L3
  q("L3", "predict",
    "Three equations in three unknowns usually have…",
    [
      { id: "a", label: "Always one solution" },
      { id: "b", label: "One solution, sometimes none, sometimes infinite", correct: true },
      { id: "c", label: "Always infinite solutions" },
      { id: "d", label: "Never a solution" },
    ],
    "Three planes in 3D can meet at a point (one solution), be inconsistent (none), or share a line/plane (infinite).",
    "Re-read the playground carefully.",
    10,
    "q-L3-q1"),

  // L4
  q("L4", "predict",
    "A = [[1,2],[3,4]], x = [1,1]. What is Ax?",
    [
      { id: "a", label: "[3, 7]", correct: true },
      { id: "b", label: "[1, 1]" },
      { id: "c", label: "[4, 6]" },
      { id: "d", label: "[2, 3]" },
    ],
    "First component: 1·1 + 2·1 = 3. Second: 3·1 + 4·1 = 7. So Ax = [3, 7].",
    "Each row of A is dotted with x. Row 1: 1·1 + 2·1. Row 2: 3·1 + 4·1.",
    10,
    "q-L4-q1"),
  q("L4", "truefalse",
    "Matrix multiplication Ax is the same as applying the linear transformation A to the vector x.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — the matrix of a transformation is the operator, and Ax IS the transformation applied to x."),

  // L5
  q("L5", "match",
    "Which row operation keeps the answer the same?",
    [
      { id: "a", label: "Add a multiple of one row to another", correct: true },
      { id: "b", label: "Change the first entry of a row to 0" },
      { id: "c", label: "Multiply a row by 0" },
      { id: "d", label: "Reorder the unknowns" },
    ],
    "Swap, scale (by non-zero), and add-multiple are the three valid row operations.",
    "Try each operation in the playground below — green ones preserve the solution.",
    10,
    "q-L5-q1"),

  // L6
  q("L6", "predict",
    "In row-echelon form, where are the leading non-zero entries?",
    [
      { id: "a", label: "On the diagonal, each strictly to the right of the one above", correct: true },
      { id: "b", label: "All in column 1" },
      { id: "c", label: "Random" },
      { id: "d", label: "All in the last row" },
    ],
    "Echelon = staircase. Pivots go right as you go down, all entries below each pivot are zero.",
    "Edit the matrix in the playground below — pivots light up in the echelon form.",
    10,
    "q-L6-q1"),
  q("L6", "truefalse",
    "Every system of linear equations has a unique row-echelon form.",
    [
      { id: "a", label: "True" },
      { id: "b", label: "False", correct: true },
    ],
    "Echelon form is NOT unique — you can swap rows. RREF is unique, but plain echelon is not."),

  // L7
  q("L7", "truefalse",
    "RREF is unique for every matrix.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — RREF is the unique reduced form. Two different paths to RREF will give the same final matrix.",
    "Try the two paths in the playground below — they always agree.",
    10,
    "q-L7-q1"),

  // L8
  q("L8", "predict",
    "Ax = 0 (homogeneous) always has which solution?",
    [
      { id: "a", label: "x = 0", correct: true },
      { id: "b", label: "x = [1, 1]" },
      { id: "c", label: "No solution" },
      { id: "d", label: "It depends on A" },
    ],
    "x = 0 always satisfies Ax = 0. The question is whether OTHER (non-trivial) solutions exist.",
    "Drop probes in the playground below — green ones are in the null space.",
    10,
    "q-L8-q1"),
  q("L8", "truefalse",
    "A non-homogeneous system Ax = b with b ≠ 0 always has exactly one solution.",
    [
      { id: "a", label: "True" },
      { id: "b", label: "False", correct: true },
    ],
    "No — it might have 0, 1, or infinitely many depending on whether b is in the column space and whether A has a null space."),

  // V1
  q("V1", "predict",
    "Two arrows are the SAME vector if…",
    [
      { id: "a", label: "They have the same length and direction (regardless of position)", correct: true },
      { id: "b", label: "They start at the origin" },
      { id: "c", label: "They look the same" },
      { id: "d", label: "They end at the same point" },
    ],
    "Vectors are about direction and magnitude, not position. Slide them around — same vector.",
    "Drag the two arrows in the playground below — make them the same vector.",
    10,
    "q-V1-q1"),
  q("V1", "truefalse",
    "The vector from (1,1) to (3,5) is the same as the vector (2,4).",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "(3-1, 5-1) = (2, 4). Same arrow, different starting point."),

  // V2
  q("V2", "predict",
    "v = (1, 2) and w = (3, 1). What is v + w?",
    [
      { id: "a", label: "(4, 3)", correct: true },
      { id: "b", label: "(3, 2)" },
      { id: "c", label: "(1, 1)" },
      { id: "d", label: "(4, 2)" },
    ],
    "Add components: (1+3, 2+1) = (4, 3). Head-to-tail: walk v then walk w.",
    "Drag the tips of v and w in the playground below — see the sum update.",
    10,
    "q-V2-q1"),
  q("V2", "predict",
    "3 × (1, 2) = ?",
    [
      { id: "a", label: "(3, 6)", correct: true },
      { id: "b", label: "(4, 5)" },
      { id: "c", label: "(1, 6)" },
      { id: "d", label: "(3, 2)" },
    ],
    "Scale each component: (3·1, 3·2) = (3, 6).",
    "Drag the scalar slider in the playground below.",
    10,
    "q-V2-q2"),

  // V3
  q("V3", "truefalse",
    "A single point is a vector space.",
    [
      { id: "a", label: "True" },
      { id: "b", label: "False", correct: true },
    ],
    "A single point is the zero-dimensional space {0} — but only the ORIGIN alone is a vector space. A non-origin point is not."),

  // V4
  q("V4", "predict",
    "Which of these is a subspace of R²?",
    [
      { id: "a", label: "A line through the origin", correct: true },
      { id: "b", label: "A line not through the origin" },
      { id: "c", label: "A circle" },
      { id: "d", label: "A square" },
    ],
    "A line through origin: closed under add and scale. A line not through origin: scaling by 0 takes you to origin, but the line doesn't contain origin, so not closed.",
    "Pick each shape in the playground below — see which one passes the closure test.",
    10,
    "q-V4-q1"),

  // V5
  q("V5", "predict",
    "Three vectors in R² that are not all parallel — what is their span?",
    [
      { id: "a", label: "All of R²", correct: true },
      { id: "b", label: "A line" },
      { id: "c", label: "Just the origin" },
      { id: "d", label: "A plane in R³" },
    ],
    "Two non-parallel vectors in R² already span all of R². Adding a third (in R²) doesn't expand it.",
    "Drag the test point — green if it's in span, red if not.",
    10,
    "q-V5-q1"),

  // V6
  q("V6", "predict",
    "Two vectors v, w in R² are linearly independent if and only if…",
    [
      { id: "a", label: "They are not parallel", correct: true },
      { id: "b", label: "They have the same length" },
      { id: "c", label: "They point the same way" },
      { id: "d", label: "They both pass through origin" },
    ],
    "If they're parallel, one is a scalar multiple of the other → dependent. If not, independent.",
    "Drag the two vectors in the playground below — watch the parallelogram area.",
    10,
    "q-V6-q1"),

  // V7
  q("V7", "truefalse",
    "A basis must be a linearly independent set that also spans the space.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Both conditions. Span = cover the space. Independence = no redundancy. Together = basis."),

  // V8
  q("V8", "predict",
    "If a vector space has a basis of 4 vectors, its dimension is…",
    [
      { id: "a", label: "4", correct: true },
      { id: "b", label: "It depends on the basis" },
      { id: "c", label: "At least 4" },
      { id: "d", label: "Could be anything" },
    ],
    "Dimension is the size of any basis. All bases have the same size. So dimension = 4.",
    "Add vectors in the playground below — the dimension counts independent ones only.",
    10,
    "q-V8-q1"),

  // T1
  q("T1", "truefalse",
    "Every function is a linear transformation.",
    [
      { id: "a", label: "True" },
      { id: "b", label: "False", correct: true },
    ],
    "Most functions are NOT linear. Linear means preserving add and scale — most functions don't."),

  // T2
  q("T2", "predict",
    "If T is linear, what is T(2v)?",
    [
      { id: "a", label: "2T(v)", correct: true },
      { id: "b", label: "T(v) + 1" },
      { id: "c", label: "T(v)²" },
      { id: "d", label: "T(v)/2" },
    ],
    "T(cv) = cT(v) is one of the two linearity rules. Scaling the input scales the output by the same amount.",
    "Drag v and the scalar slider in the playground below — both paths give the same answer.",
    10,
    "q-T2-q1"),

  // T3
  q("T3", "predict",
    "If T(i) = (2, 0) and T(j) = (0, 3), what is the matrix of T?",
    [
      { id: "a", label: "[[2, 0], [0, 3]]", correct: true },
      { id: "b", label: "[[2, 3], [0, 0]]" },
      { id: "c", label: "[[0, 2], [3, 0]]" },
      { id: "d", label: "[[3, 0], [0, 2]]" },
    ],
    "The columns of the matrix ARE T(i) and T(j). So col 1 = (2, 0), col 2 = (0, 3).",
    "Drag î and ĵ to wherever T sends them — the matrix updates.",
    10,
    "q-T3-q1"),

  // T4
  q("T4", "predict",
    "For T: R² → R² given by T(x, y) = (x + 2y, 2x + 4y), what is in the null space?",
    [
      { id: "a", label: "The line 2y + x = 0", correct: true },
      { id: "b", label: "All of R²" },
      { id: "c", label: "Just the origin" },
      { id: "d", label: "Nothing" },
    ],
    "Setting T(x,y) = 0: x + 2y = 0 → x = -2y → all vectors (-2y, y) = y(-2, 1). The line 2y + x = 0.",
    "Drag the probe in the playground below — green when T sends it to 0.",
    10,
    "q-T4-q1"),

  // T5
  q("T5", "predict",
    "If T: R⁵ → R⁵ and the null space has dimension 2, what is the rank?",
    [
      { id: "a", label: "3", correct: true },
      { id: "b", label: "5" },
      { id: "c", label: "2" },
      { id: "d", label: "10" },
    ],
    "rank + nullity = 5. nullity = 2, so rank = 3.",
    "Drag the nullity slider in the playground below — rank updates live.",
    10,
    "q-T5-q1"),

  // T6
  q("T6", "truefalse",
    "R² and the space of polynomials of degree ≤ 1 are isomorphic.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Both are 2-dimensional over R. Map (a, b) ↔ a + bx. Same shape, different labels."),

  // T7
  q("T7", "predict",
    "If A = [[1, 1], [0, 1]] and B = [[2, 0], [0, 2]], what is BA?",
    [
      { id: "a", label: "[[2, 2], [0, 2]]", correct: true },
      { id: "b", label: "[[2, 2], [0, 2]]" },
      { id: "c", label: "[[2, 0], [2, 2]]" },
      { id: "d", label: "[[2, 0], [0, 2]]" },
    ],
    "BA = [[2·1+0·0, 2·1+0·1], [0·1+2·0, 0·1+2·1]] = [[2, 2], [0, 2]].",
    "Step through BA cell by cell in the playground below.",
    10,
    "q-T7-q1"),
  q("T7", "truefalse",
    "Matrix multiplication is commutative: AB = BA always.",
    [
      { id: "a", label: "True" },
      { id: "b", label: "False", correct: true },
    ],
    "Almost never. AB ≠ BA in general. Order matters — composition is right-to-left."),

  // T8
  q("T8", "predict",
    "If A = [[1, 2], [2, 4]], what is A⁻¹?",
    [
      { id: "a", label: "It doesn't exist", correct: true },
      { id: "b", label: "[[1, -2], [-2, 4]]" },
      { id: "c", label: "[[4, -2], [-2, 1]]" },
      { id: "d", label: "Identity" },
    ],
    "det(A) = 1·4 - 2·2 = 0. det = 0 means A collapses a dimension — no inverse exists.",
    "Drag î and ĵ in the playground until they line up — the determinant goes to zero.",
    10,
    "q-T8-q1"),
  q("T8", "truefalse",
    "If A is invertible, then A collapses no dimensions.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Invertible = one-to-one = no information lost = no dimension collapsed. det ≠ 0."),

  // F1
  q("F1", "predict",
    "The four fundamental subspaces of an m×n matrix A live in which spaces?",
    [
      { id: "a", label: "Rⁿ and Rᵐ", correct: true },
      { id: "b", label: "All in Rᵐ" },
      { id: "c", label: "All in Rⁿ" },
      { id: "d", label: "Rᵐ⁺ⁿ" },
    ],
    "Col space ⊂ Rᵐ, row space ⊂ Rⁿ, null space ⊂ Rⁿ, left-null space ⊂ Rᵐ."),
  q("F1", "truefalse",
    "dim(C(A)) + dim(N(A)) = n.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — column space + null space dimensions = n. This is the rank-nullity theorem."),

  // F3
  q("F3", "truefalse",
    "The dot product f(v) = v · w is a linear functional for any fixed w.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — f(v + u) = (v+u)·w = v·w + u·w = f(v) + f(u), and f(cv) = c·f(v). Linear."),

  // F4
  q("F4", "predict",
    "If V is 5-dimensional, what is the dimension of V*?",
    [
      { id: "a", label: "5", correct: true },
      { id: "b", label: "10" },
      { id: "c", label: "25" },
      { id: "d", label: "1" },
    ],
    "V* has the same dimension as V. They're different kinds of objects but the same size."),

  // F6
  q("F6", "predict",
    "If W is a 3D subspace of a 5D space, what is dim(W°)?",
    [
      { id: "a", label: "2", correct: true },
      { id: "b", label: "3" },
      { id: "c", label: "5" },
      { id: "d", label: "8" },
    ],
    "dim(W) + dim(W°) = dim(V). 3 + dim(W°) = 5. dim(W°) = 2."),

  // F7
  q("F7", "truefalse",
    "If T has matrix A, then T* has matrix Aᵀ.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes. The transpose of a transformation is the matrix transpose."),

  // F8
  q("F8", "truefalse",
    "For finite-dimensional V, V** is naturally isomorphic to V.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — the double-dual theorem. Each vector in V corresponds to a unique functional on V*."),

  // E1
  q("E1", "predict",
    "For matrix [[2, 0], [0, 3]], which vector is an eigenvector?",
    [
      { id: "a", label: "(1, 0)", correct: true },
      { id: "b", label: "(1, 1)" },
      { id: "c", label: "(1, 2)" },
      { id: "d", label: "(0, 1)" },
    ],
    "A·(1,0) = (2, 0) = 2·(1, 0). Yes, (1, 0) is an eigenvector with eigenvalue 2.",
    "Drag v until it stops rotating (Mv lines up with v).",
    10,
    "q-E1-q1"),
  q("E1", "truefalse",
    "Every vector is an eigenvector of some matrix.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — the identity matrix has EVERY non-zero vector as an eigenvector (with eigenvalue 1)."),

  // E2
  q("E2", "predict",
    "If Av = -2v, what is the eigenvalue?",
    [
      { id: "a", label: "-2", correct: true },
      { id: "b", label: "2" },
      { id: "c", label: "0" },
      { id: "d", label: "1" },
    ],
    "λ = -2. The vector is flipped and stretched by 2.",
    "Drag λ in the playground below — see what negative does to v.",
    10,
    "q-E2-q1"),

  // E3
  q("E3", "predict",
    "The characteristic polynomial of a 3×3 matrix has degree…",
    [
      { id: "a", label: "3", correct: true },
      { id: "b", label: "6" },
      { id: "c", label: "9" },
      { id: "d", label: "1" },
    ],
    "Degree = n for an n×n matrix. So degree 3.",
    "Pick 2×2, 3×3, 4×4 in the playground below — the polynomial degree changes with size.",
    10,
    "q-E3-q1"),

  // E4
  q("E4", "truefalse",
    "A matrix is diagonalizable if and only if it has n linearly independent eigenvectors.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes. n independent eigenvectors → can form P → A = PDP⁻¹."),

  // S1
  q("S1", "predict",
    "Every m×n matrix A can be decomposed as…",
    [
      { id: "a", label: "U Σ Vᵀ", correct: true },
      { id: "b", label: "QR" },
      { id: "c", label: "LU" },
      { id: "d", label: "AB" },
    ],
    "SVD: A = U Σ Vᵀ. Always, for any matrix.",
    "Drag the rotation and scale sliders in the playground below — the unit circle is rotated, stretched, and rotated again, becoming the ellipse A maps it to.",
    10,
    "q-S1-q1"),

  // S2
  q("S2", "predict",
    "In SVD, the columns of U and V are…",
    [
      { id: "a", label: "Orthonormal vectors", correct: true },
      { id: "b", label: "Any basis" },
      { id: "c", label: "The same vectors" },
      { id: "d", label: "Eigenvectors of A" },
    ],
    "U and V are orthogonal matrices. Their columns are orthonormal — perpendicular unit vectors.",
    "Slide k in the image preview — see how few columns capture most of the image.",
    10,
    "q-S2-q1"),

  // S3
  q("S3", "predict",
    "Singular values are always…",
    [
      { id: "a", label: "Non-negative", correct: true },
      { id: "b", label: "Integers" },
      { id: "c", label: "Either -1 or +1" },
      { id: "d", label: "Complex" },
    ],
    "Singular values are √(eigenvalues of AᵀA) — and eigenvalues of positive semi-definite matrices are non-negative.",
    "Drag the matrix in the playground below — singular values stay non-negative.",
    10,
    "q-S3-q1"),

  // S4
  q("S4", "truefalse",
    "The rank-k SVD approximation minimizes ||A - Aₖ||_F for any k.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — the Eckart-Young theorem. The top-k singular value approximation is the best rank-k approximation in Frobenius norm."),

  // S5
  q("S5", "predict",
    "PageRank ranks pages by…",
    [
      { id: "a", label: "The dominant eigenvector of the link matrix", correct: true },
      { id: "b", label: "Number of words" },
      { id: "c", label: "Alphabetical order" },
      { id: "d", label: "Random choice" },
    ],
    "PageRank: pages are states, links are transitions, importance = dominant eigenvector of the link matrix. The eigenvector for eigenvalue 1."),

  // ════════════════════════════════════════════════════════════
  // FILL IN THE MISSING 5 — T2b, F2, F5, E5, E6
  // Each concept gets 2 questions: one concrete (numeric/algebraic),
  // one conceptual (true/false or property identification).
  // ════════════════════════════════════════════════════════════

  // T2b — 3D transformations (3x3 matrices warping space)
  q("T2b", "predict",
    "The 3x3 matrix [[1,0,0],[0,2,0],[0,0,3]] sends the unit cube to…",
    [
      { id: "a", label: "A box of side lengths 1, 2, 3 (along x, y, z)", correct: true },
      { id: "b", label: "The same unit cube" },
      { id: "c", label: "A sphere" },
      { id: "d", label: "A tetrahedron" },
    ],
    "Diagonal entries scale each axis: x unchanged, y doubled, z tripled. The unit cube stretches into a 1×2×3 box."),
  q("T2b", "truefalse",
    "A 3x3 matrix can express any 3D linear transformation — including rotations, scalings, shears, and reflections — but NOT translations.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Linear maps must fix the origin, so translations (which move it) are not representable by a single 3x3 matrix. You need a 4x4 with the translation in the last column to handle translations — that's the affine trick used in computer graphics."),

  // F2 — Row space and column space
  q("F2", "predict",
    "For A (3x4), the row space is a subspace of… and the column space is a subspace of…",
    [
      { id: "a", label: "Row ⊂ R⁴, Column ⊂ R³", correct: true },
      { id: "b", label: "Row ⊂ R³, Column ⊂ R⁴" },
      { id: "c", label: "Both ⊂ R³" },
      { id: "d", label: "Both ⊂ R⁴" },
    ],
    "Rows of a 3x4 matrix are length-4 vectors → row space lives in R⁴. Columns are length-3 → column space lives in R³. Always: row space ⊂ Rⁿ, column space ⊂ Rᵐ for an m×n matrix."),
  q("F2", "truefalse",
    "The row space and the column space of a matrix always have the same dimension.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — both have dimension equal to the rank of A. They're different spaces (live in Rⁿ vs Rᵐ) but always the same size. This is the content of the rank theorem."),

  // F5 — Dual basis
  q("F5", "predict",
    "In R² with the standard basis {e₁, e₂}, the dual basis is {f₁, f₂} where…",
    [
      { id: "a", label: "fᵢ(v) = the i-th coordinate of v", correct: true },
      { id: "b", label: "fᵢ(v) = the magnitude of v" },
      { id: "c", label: "fᵢ(v) = the angle of v" },
      { id: "d", label: "fᵢ(v) = 1 for every v" },
    ],
    "The dual basis functionals 'pick out' coordinates: f₁(3, 7) = 3, f₂(3, 7) = 7. That's the bookkeeping job of the dual basis."),
  q("F5", "truefalse",
    "Every basis of V has exactly one dual basis of V*.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — uniqueness follows from the defining equations fᵢ(vⱼ) = δᵢⱼ. Given {v₁, …, vₙ}, there is a UNIQUE {f₁, …, fₙ} satisfying these n² equations."),

  // E5 — Cayley-Hamilton
  q("E5", "predict",
    "For A = [[2, 1], [0, 2]], the characteristic polynomial is p(λ) = λ² - 4λ + 4. What is p(A)?",
    [
      { id: "a", label: "The 2x2 zero matrix", correct: true },
      { id: "b", label: "A = [[2, 1], [0, 2]]" },
      { id: "c", label: "The identity" },
      { id: "d", label: "A - 2I" },
    ],
    "Cayley-Hamilton: p(A) = A² - 4A + 4I. A² = [[4, 4], [0, 4]], so A² - 4A + 4I = [[4-8+4, 4-4+0], [0, 0-8+4]] = [[0, 0], [0, 0]]. Always zero — that's the theorem.",
    "Watch the live computation in the playground below — every term is computed and summed, ending at the zero matrix.",
    10,
    "q-E5-q1"),
  q("E5", "truefalse",
    "Cayley-Hamilton says: every matrix is a root of its own characteristic polynomial.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — p(A) = 0 (the zero matrix) for ANY square A. Strang calls it 'the most remarkable theorem in linear algebra.' It powers matrix exponentiation: exp(At) can be computed via Cayley-Hamilton without ever forming a Taylor series."),

  // E6 — Minimal polynomial
  q("E6", "predict",
    "If A is diagonalizable with distinct eigenvalues λ₁, λ₂, λ₃, what is the minimal polynomial of A?",
    [
      { id: "a", label: "(λ - λ₁)(λ - λ₂)(λ - λ₃), with no repeated roots", correct: true },
      { id: "b", label: "Always (λ - λ₁)³" },
      { id: "c", label: "λ itself" },
      { id: "d", label: "A constant, like 7" },
    ],
    "For a diagonalizable matrix with distinct eigenvalues, the minimal polynomial equals the characteristic polynomial, with each factor appearing only once (degree 1 in each (λ - λᵢ)). Repeated eigenvalues in a diagonalizable matrix don't increase the minimal polynomial's degree."),
  q("E6", "truefalse",
    "The minimal polynomial always divides the characteristic polynomial.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — the minimal polynomial divides EVERY polynomial that vanishes on A, including the characteristic polynomial. Same roots (over the algebraic closure), but possibly with lower multiplicities. A matrix is diagonalizable iff its minimal polynomial has no repeated roots."),

  // ════════════════════════════════════════════════════════════════
  // BULK FILL — every concept now has 5 questions.
  // Each new question reuses the concept's unique playground, so every
  // story has its own bespoke interactive widget and every question is
  // hands-on. Question types rotate (predict, truefalse, identify, match)
  // to keep the test varied.
  // ════════════════════════════════════════════════════════════════

  // ── L1 — What is an Equation? (target 5; have 2 → add 3) ──
  q("L1", "truefalse",
    "The equation x² = 4 has exactly one solution.",
    [
      { id: "a", label: "True" },
      { id: "b", label: "False", correct: true },
    ],
    "x² = 4 has two solutions: x = 2 and x = -2. Equations can have zero, one, or many solutions."),
  q("L1", "predict",
    "If 5x - 7 = 3x + 1, what is x?",
    [
      { id: "a", label: "x = 4", correct: true },
      { id: "b", label: "x = 3" },
      { id: "c", label: "x = -4" },
      { id: "d", label: "x = 1/2" },
    ],
    "5x - 7 = 3x + 1 → 2x = 8 → x = 4. Bring unknowns to one side, constants to the other."),
  q("L1", "identify",
    "Which of these is NOT an equation?",
    [
      { id: "a", label: "y = 2x + 1" },
      { id: "b", label: "3 + 4 = 7" },
      { id: "c", label: "f(x) = x²", correct: true },
      { id: "d", label: "2x = 10" },
    ],
    "An equation has TWO sides joined by '='. 'f(x) = x²' is a definition, not a question to solve."),

  // ── L2 — Two Unknowns, Two Equations (target 5; have 2 → add 3) ──
  q("L2", "predict",
    "Lines y = x + 1 and y = 2x - 2 meet at…",
    [
      { id: "a", label: "(3, 4)", correct: true },
      { id: "b", label: "(1, 2)" },
      { id: "c", label: "(2, 3)" },
      { id: "d", label: "(0, 1)" },
    ],
    "Set equal: x + 1 = 2x - 2 → x = 3. Then y = 3 + 1 = 4."),
  q("L2", "truefalse",
    "Two lines that are parallel can never meet, so they have no common point.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Parallel lines (same slope, different intercept) have NO intersection. The system has zero solutions."),
  q("L2", "predict",
    "Lines y = 3x + 1 and y = 3x - 4 meet at…",
    [
      { id: "a", label: "They never meet", correct: true },
      { id: "b", label: "(0, 1)" },
      { id: "c", label: "(1, 4)" },
      { id: "d", label: "(2, 7)" },
    ],
    "Same slope (3) and different intercepts → parallel lines → no intersection."),

  // ── L3 — Three Equations, Three Unknowns (target 5; have 1 → add 4) ──
  q("L3", "identify",
    "When three planes in 3D share a single common line, the system has…",
    [
      { id: "a", label: "Exactly one solution" },
      { id: "b", label: "No solution" },
      { id: "c", label: "Infinitely many solutions (a whole line)", correct: true },
      { id: "d", label: "Two solutions" },
    ],
    "If all three planes contain the same line, every point on that line is a solution. Infinitely many — parameterized by a single parameter."),
  q("L3", "truefalse",
    "Three planes that are pairwise parallel can still intersect at a single point.",
    [
      { id: "a", label: "True" },
      { id: "b", label: "False", correct: true },
    ],
    "Parallel planes never meet — pairwise parallel planes have NO common point, ever. No intersection at all."),
  q("L3", "match",
    "Which 3D configuration gives 'no solution'?",
    [
      { id: "a", label: "Three planes all meeting at one point" },
      { id: "b", label: "Two parallel planes and a third cutting both", correct: true },
      { id: "c", label: "Three planes all sharing one line" },
      { id: "d", label: "Three coincident planes" },
    ],
    "Two parallel planes + a third crossing them at different lines → no common point. The system is inconsistent."),
  q("L3", "predict",
    "x + y + z = 6, x + y + z = 7, x + y + z = 8 — this system has…",
    [
      { id: "a", label: "One solution" },
      { id: "b", label: "No solution", correct: true },
      { id: "c", label: "Infinitely many" },
      { id: "d", label: "Two solutions" },
    ],
    "Three parallel planes in 3D. No triple (x,y,z) can satisfy all three at once. Inconsistent."),

  // ── L4 — Matrix Form Ax = b (target 5; have 2 → add 3) ──
  q("L4", "predict",
    "A = [[2, 0], [0, 5]], x = [3, 4]. What is Ax?",
    [
      { id: "a", label: "[6, 20]", correct: true },
      { id: "b", label: "[12, 9]" },
      { id: "c", label: "[5, 15]" },
      { id: "d", label: "[6, 4]" },
    ],
    "Row 1: 2·3 + 0·4 = 6. Row 2: 0·3 + 5·4 = 20. So Ax = [6, 20]."),
  q("L4", "truefalse",
    "The matrix A in Ax = b contains the coefficients of the unknowns.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — A's i-th row is the coefficients of the i-th equation. The unknowns x carry the variable, the right-hand side b carries the constants."),
  q("L4", "predict",
    "For the system 4x = 8, what is the matrix form Ax = b?",
    [
      { id: "a", label: "A = [4], x = [x], b = [8]", correct: true },
      { id: "b", label: "A = [8], x = [4], b = [x]" },
      { id: "c", label: "A = [x], x = [4], b = [8]" },
      { id: "d", label: "A = [4, 8], x = [x, 1]" },
    ],
    "1×1 matrix form: a single equation is [4] · [x] = [8]. The matrix is the coefficient, x is the unknown column, b is the right-hand side."),

  // ── L5 — Row Operations (target 5; have 1 → add 4) ──
  q("L5", "identify",
    "Which operation is NOT a valid row operation (it changes the solution)?",
    [
      { id: "a", label: "Swap two rows" },
      { id: "b", label: "Multiply a row by a non-zero scalar" },
      { id: "c", label: "Multiply a row by 0", correct: true },
      { id: "d", label: "Add a multiple of one row to another" },
    ],
    "Multiplying by 0 collapses the equation to 0 = b, losing all information. The other three are the canonical valid moves."),
  q("L5", "predict",
    "Apply R2 → R2 - 2·R1 to the matrix [[1, 2, 5], [2, 4, 10]]. The new second row is…",
    [
      { id: "a", label: "[0, 0, 0]", correct: true },
      { id: "b", label: "[2, 4, 10]" },
      { id: "c", label: "[0, 4, 5]" },
      { id: "d", label: "[1, 2, 5]" },
    ],
    "R2 - 2·R1 = [2-2·1, 4-2·2, 10-2·5] = [0, 0, 0]. The original R2 was 2×R1, so the operation zeros it out."),
  q("L5", "truefalse",
    "Swapping two rows of a matrix changes the system but keeps the same solution set.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Swapping reorders the equations — the same equations still hold, just written in a different order. The solution set is identical."),
  q("L5", "identify",
    "Why are row operations useful?",
    [
      { id: "a", label: "They simplify the system into a form where the answer is obvious", correct: true },
      { id: "b", label: "They change the answer to something easier" },
      { id: "c", label: "They work for non-linear systems too" },
      { id: "d", label: "They make matrices smaller" },
    ],
    "Row operations preserve the solution set. Their power is in REWRITING the system into echelon / RREF where you can read off the answer bottom-up."),

  // ── L6 — Row-Echelon Form (target 5; have 2 → add 3) ──
  q("L6", "identify",
    "In row-echelon form, every leading entry (pivot) is…",
    [
      { id: "a", label: "Strictly to the right of the pivot above it", correct: true },
      { id: "b", label: "In column 1" },
      { id: "c", label: "Equal to 1" },
      { id: "d", label: "Always 0" },
    ],
    "Echelon = staircase. Each pivot lies strictly to the right of the pivot in the row above. That's the 'stair' shape."),
  q("L6", "truefalse",
    "Every matrix has a unique row-echelon form.",
    [
      { id: "a", label: "True" },
      { id: "b", label: "False", correct: true },
    ],
    "Echelon form is NOT unique — you can swap rows and scale them differently. RREF is unique, plain echelon is not."),
  q("L6", "predict",
    "Apply Gaussian elimination to [[1, 2], [2, 3]]. After R2 → R2 - 2·R1, the matrix is…",
    [
      { id: "a", label: "[[1, 2], [0, -1]]", correct: true },
      { id: "b", label: "[[1, 2], [2, 3]]" },
      { id: "c", label: "[[3, 5], [0, 0]]" },
      { id: "d", label: "[[0, 0], [1, 2]]" },
    ],
    "R2 - 2·R1 = [2-2, 3-4] = [0, -1]. The result is echelon — pivot 1 in row 1, pivot -1 in row 2, no work below."),

  // ── L7 — RREF (target 5; have 1 → add 4) ──
  q("L7", "identify",
    "Which property distinguishes RREF from plain echelon form?",
    [
      { id: "a", label: "Every pivot is 1", correct: true },
      { id: "b", label: "Every pivot is 0" },
      { id: "c", label: "There are no zeros below the pivots" },
      { id: "d", label: "The matrix is square" },
    ],
    "RREF requires: pivots are 1, zeros above and below each pivot, and pivot columns are unit columns. Echelon only requires zeros below the pivots."),
  q("L7", "truefalse",
    "RREF is unique: every matrix has exactly one RREF.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — RREF is the canonical form. Two different paths to RREF always give the same final matrix. That's what makes it the 'fingerprint'."),
  q("L7", "predict",
    "The RREF of the identity matrix I is…",
    [
      { id: "a", label: "The identity matrix I itself", correct: true },
      { id: "b", label: "The zero matrix" },
      { id: "c", label: "A diagonal of zeros" },
      { id: "d", label: "Anything you want" },
    ],
    "I is already in RREF — pivots are 1, zeros everywhere else, pivot columns are unit columns. So its RREF is itself."),
  q("L7", "match",
    "If A and B are row-equivalent (one comes from the other by row operations), their RREFs are…",
    [
      { id: "a", label: "Different — RREF depends on the matrix, not its history" },
      { id: "b", label: "Identical", correct: true },
      { id: "c", label: "Always the identity" },
      { id: "d", label: "Transposes of each other" },
    ],
    "Row-equivalent matrices share the same RREF. That's why RREF is a perfect invariant for the solution set."),

  // ── L8 — Homogeneous vs Non-Homogeneous (target 5; have 2 → add 3) ──
  q("L8", "truefalse",
    "If Ax = 0 has only the trivial solution x = 0, then Ax = b has exactly one solution for any b.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — if the null space is {0} only, A is invertible, and Ax = b has the unique solution x = A⁻¹b for any b in the column space (which is everything)."),
  q("L8", "predict",
    "Ax = 0 has a 1-dimensional null space. Then Ax = b can have…",
    [
      { id: "a", label: "Zero or one solution" },
      { id: "b", label: "Exactly one solution" },
      { id: "c", label: "Zero or infinitely many solutions", correct: true },
      { id: "d", label: "Always infinitely many solutions" },
    ],
    "Non-trivial null space (1D) means: either no solution (if b is outside the column space) or infinitely many (one particular + the null space line)."),
  q("L8", "identify",
    "Why does Ax = 0 always have x = 0 as a solution?",
    [
      { id: "a", label: "Because A · 0 = 0 by definition", correct: true },
      { id: "b", label: "Because matrices always send 0 somewhere special" },
      { id: "c", label: "It's a coincidence" },
      { id: "d", label: "Only square matrices have this property" },
    ],
    "Linear maps fix the origin: A · 0 = 0. So x = 0 is ALWAYS a solution to Ax = 0, no matter what A is. The question is whether OTHER solutions exist."),

  // ── V1 — Vectors are Arrows (target 5; have 2 → add 3) ──
  q("V1", "predict",
    "The vector from (0, 0) to (3, 4) has length…",
    [
      { id: "a", label: "5", correct: true },
      { id: "b", label: "7" },
      { id: "c", label: "12" },
      { id: "d", label: "√(12)" },
    ],
    "Length = √(3² + 4²) = √25 = 5. The classic 3-4-5 right triangle."),
  q("V1", "truefalse",
    "Two arrows with the same length and direction are the same vector, even if they are at different positions.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — vectors are direction + magnitude. Slide them anywhere: still the same vector. Position doesn't matter."),
  q("V1", "predict",
    "The vector from (2, 1) to (5, 5) equals…",
    [
      { id: "a", label: "(3, 4)", correct: true },
      { id: "b", label: "(5, 5)" },
      { id: "c", label: "(2, 1)" },
      { id: "d", label: "(7, 6)" },
    ],
    "(5-2, 5-1) = (3, 4). Subtract tail coordinates from head coordinates."),

  // ── V2 — Adding and Scaling (target 5; have 2 → add 3) ──
  q("V2", "predict",
    "v = (2, 3), w = (-1, 4). What is v - w?",
    [
      { id: "a", label: "(3, -1)", correct: true },
      { id: "b", label: "(1, 7)" },
      { id: "c", label: "(3, 7)" },
      { id: "d", label: "(-3, 1)" },
    ],
    "v - w = (2-(-1), 3-4) = (3, -1). Subtraction = add the negative."),
  q("V2", "predict",
    "What is -2 × (3, -1)?",
    [
      { id: "a", label: "(-6, 2)", correct: true },
      { id: "b", label: "(6, -2)" },
      { id: "c", label: "(1, 3)" },
      { id: "d", label: "(-6, -2)" },
    ],
    "Multiply each component by -2: (-2·3, -2·(-1)) = (-6, 2). The arrow flips and doubles in length."),
  q("V2", "truefalse",
    "Scaling a vector by -1 keeps the same length but flips its direction.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — multiplying by -1 reverses the direction. Length = |−1| × original length = original length."),

  // ── V3 — Vector Space Axioms (target 5; have 1 → add 4) ──
  q("V3", "identify",
    "Which axiom requires that adding two arrows gives another arrow in the same space?",
    [
      { id: "a", label: "Closure under addition", correct: true },
      { id: "b", label: "Commutativity" },
      { id: "c", label: "Associativity" },
      { id: "d", label: "Existence of zero" },
    ],
    "Closure: the sum of any two vectors in V is also in V. Without this, V isn't a vector space."),
  q("V3", "truefalse",
    "A single non-origin point (say, {(1, 2)}) is a vector space.",
    [
      { id: "a", label: "True" },
      { id: "b", label: "False", correct: true },
    ],
    "No — not closed under addition or scaling. (1,2) + (1,2) = (2,4) which is NOT in {(1,2)}. So {origin} is a vector space, but any other single point is not."),
  q("V3", "predict",
    "The set of all 2D vectors with integer components {(m, n) : m, n ∈ Z} — is this a vector space over R?",
    [
      { id: "a", label: "Yes — it's closed under addition and scaling" },
      { id: "b", label: "No — 0.5 × (1, 2) = (0.5, 1) is not in the set", correct: true },
      { id: "c", label: "Yes — it contains the zero vector" },
      { id: "d", label: "No — it has no zero vector" },
    ],
    "Closed under add (integers + integers = integers), but not closed under scaling by real numbers. 0.5 × (1, 2) = (0.5, 1) is not integer. So over R, not a vector space."),
  q("V3", "truefalse",
    "Every vector space contains exactly one zero vector.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — uniqueness follows from the axioms. If 0 and 0' were both zeros, then 0 = 0 + 0' = 0' (using the additive inverse axiom). So 0 = 0'."),

  // ── V4 — Subspaces (target 5; have 1 → add 4) ──
  q("V4", "identify",
    "Which is a subspace of R³?",
    [
      { id: "a", label: "The plane z = 0 (the xy-plane)", correct: true },
      { id: "b", label: "The plane z = 1" },
      { id: "c", label: "The sphere of radius 1" },
      { id: "d", label: "A line through (0, 0, 1)" },
    ],
    "The xy-plane contains origin, closed under add and scale. z = 1 doesn't contain origin. Sphere is curved. Line through (0,0,1) doesn't contain origin."),
  q("V4", "truefalse",
    "Any line through the origin is a subspace of R².",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — contains origin, closed under add and scale. The line {t·(a, b) : t ∈ R} is a 1D subspace."),
  q("V4", "predict",
    "Which of these is the zero-dimensional subspace of R⁴?",
    [
      { id: "a", label: "{0} = {(0, 0, 0, 0)}", correct: true },
      { id: "b", label: "{(1, 0, 0, 0)}" },
      { id: "c", label: "{(0, 0, 0, 0), (1, 1, 1, 1)}" },
      { id: "d", label: "All of R⁴" },
    ],
    "{0} is the unique 0-dimensional subspace. The others are non-trivial: 1D, not closed, full space."),
  q("V4", "truefalse",
    "A subspace must contain the origin.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — scaling by 0 sends every vector to 0, so 0 must be in any closed-under-scale subspace. No origin → not a subspace."),

  // ── V5 — Span (target 5; have 1 → add 4) ──
  q("V5", "identify",
    "Two parallel arrows in R² have a span equal to…",
    [
      { id: "a", label: "A single line", correct: true },
      { id: "b", label: "All of R²" },
      { id: "c", label: "Just the origin" },
      { id: "d", label: "A plane in R³" },
    ],
    "Parallel arrows are scalar multiples of each other — span = the line through them. Same direction = same span."),
  q("V5", "predict",
    "The span of {(1, 0), (0, 1)} in R² is…",
    [
      { id: "a", label: "All of R²", correct: true },
      { id: "b", label: "The x-axis only" },
      { id: "c", label: "A single point" },
      { id: "d", label: "A line at 45°" },
    ],
    "Any (x, y) = x·(1, 0) + y·(0, 1). These two arrows span the entire plane."),
  q("V5", "truefalse",
    "Adding a third arrow to a 2D span can NEVER increase the span.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Correct — once you've spanned all of R² with two non-parallel arrows, no third arrow can extend it further. The span is already the whole plane."),
  q("V5", "identify",
    "If v is in the span of {w₁, w₂, w₃}, then v can be written as…",
    [
      { id: "a", label: "A linear combination c₁w₁ + c₂w₂ + c₃w₃", correct: true },
      { id: "b", label: "A product of the three vectors" },
      { id: "c", label: "One of the three vectors exactly" },
      { id: "d", label: "The zero vector" },
    ],
    "Span = all linear combinations. If v is in span, there exist scalars c₁, c₂, c₃ such that v = c₁w₁ + c₂w₂ + c₃w₃."),

  // ── V6 — Linear Independence (target 5; have 1 → add 4) ──
  q("V6", "identify",
    "Three vectors in R² are always…",
    [
      { id: "a", label: "Linearly dependent", correct: true },
      { id: "b", label: "Linearly independent" },
      { id: "c", label: "Orthogonal" },
      { id: "d", label: "A basis of R³" },
    ],
    "R² is 2-dimensional. You can have at most 2 independent vectors. Any third is a combination of the first two → dependent."),
  q("V6", "truefalse",
    "The zero vector 0 is linearly independent by itself.",
    [
      { id: "a", label: "True" },
      { id: "b", label: "False", correct: true },
    ],
    "No — {0} is the textbook example of a dependent set. 1·0 = 0 is a non-trivial relation. Dependence comes from having any zero vector in the set."),
  q("V6", "predict",
    "v₁ = (1, 0), v₂ = (0, 1), v₃ = (1, 1). The relation among them is…",
    [
      { id: "a", label: "v₁ + v₂ - v₃ = 0", correct: true },
      { id: "b", label: "v₁ + v₂ + v₃ = 0" },
      { id: "c", label: "2v₃ = v₁" },
      { id: "d", label: "There is no relation" },
    ],
    "(1, 0) + (0, 1) - (1, 1) = (0, 0). So v₁ + v₂ - v₃ = 0, meaning v₃ depends on v₁ and v₂."),
  q("V6", "identify",
    "Why does the parallelogram test work for independence in R²?",
    [
      { id: "a", label: "Two vectors are independent iff the parallelogram they form has non-zero area", correct: true },
      { id: "b", label: "Two vectors are independent iff they are equal" },
      { id: "c", label: "Two vectors are independent iff they form a circle" },
      { id: "d", label: "Two vectors are independent iff they are perpendicular" },
    ],
    "Area = |v₁ × v₂| (in 2D, |a·d - b·c|). Zero area = one is a multiple of the other = dependent. Non-zero area = independent."),

  // ── V7 — Basis (target 5; have 1 → add 4) ──
  q("V7", "predict",
    "How many vectors are in a basis of R⁵?",
    [
      { id: "a", label: "5", correct: true },
      { id: "b", label: "Any number ≥ 5" },
      { id: "c", label: "Any number ≤ 5" },
      { id: "d", label: "10" },
    ],
    "Rⁿ has dimension n. A basis has exactly n vectors. So R⁵ → basis of 5 vectors."),
  q("V7", "truefalse",
    "Any linearly independent set of n vectors in Rⁿ is automatically a basis.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — in an n-dimensional space, n linearly independent vectors must span (there's no room for any redundancy). So independent + n = basis."),
  q("V7", "identify",
    "Which set is a basis for R²?",
    [
      { id: "a", label: "{(1, 1), (1, -1)}", correct: true },
      { id: "b", label: "{(1, 0), (2, 0)}" },
      { id: "c", label: "{(1, 2), (2, 4), (3, 6)}" },
      { id: "d", label: "{(1, 0)} alone" },
    ],
    "(1, 1) and (1, -1) are not parallel — determinant of [[1,1],[1,-1]] = -2 ≠ 0. Independent and 2 of them in R² = basis."),
  q("V7", "truefalse",
    "A basis of R³ can have 4 vectors.",
    [
      { id: "a", label: "True" },
      { id: "b", label: "False", correct: true },
    ],
    "No — R³ has dimension 3. A basis has exactly 3 vectors. 4 vectors in R³ → at least one is dependent."),

  // ── V8 — Dimension (target 5; have 1 → add 4) ──
  q("V8", "identify",
    "The dimension of the span of {(1, 0, 0), (0, 1, 0)} in R³ is…",
    [
      { id: "a", label: "2", correct: true },
      { id: "b", label: "3" },
      { id: "c", label: "1" },
      { id: "d", label: "0" },
    ],
    "Two non-parallel vectors → span a 2D plane (the xy-plane). Dimension of span = number of independent vectors = 2."),
  q("V8", "truefalse",
    "Every basis of the same vector space has the same number of vectors.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — this is the key fact. All bases of a space have the same size. That common size is the dimension."),
  q("V8", "predict",
    "If dim(U) = 3, dim(W) = 5, and U ⊂ W, then the minimum dim(W/U) is…",
    [
      { id: "a", label: "2", correct: true },
      { id: "b", label: "5" },
      { id: "c", label: "3" },
      { id: "d", label: "8" },
    ],
    "If U ⊂ W and dim(U) = 3, dim(W) = 5, then U takes 3 dimensions of W's 5. The complementary subspace W/U has at least 5 - 3 = 2 dimensions."),
  q("V8", "identify",
    "A polynomial of degree ≤ 4 has dimension…",
    [
      { id: "a", label: "5", correct: true },
      { id: "b", label: "4" },
      { id: "c", label: "Infinite" },
      { id: "d", label: "1" },
    ],
    "Basis: {1, x, x², x³, x⁴} — 5 vectors. So polynomials of degree ≤ 4 form a 5D space."),

  // ── T1 — What is a Transformation? (target 5; have 1 → add 4) ──
  q("T1", "identify",
    "Which of these is a transformation (in the math sense)?",
    [
      { id: "a", label: "T(x, y) = (x + y, x - y)", correct: true },
      { id: "b", label: "A list of points" },
      { id: "c", label: "A matrix by itself" },
      { id: "d", label: "A number" },
    ],
    "A transformation maps inputs to outputs. T takes a 2D vector and returns another 2D vector. The other options don't map anything."),
  q("T1", "truefalse",
    "Every linear transformation is a function between vector spaces.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — every linear transformation IS a function. The reverse isn't true (most functions aren't linear)."),
  q("T1", "predict",
    "T(x, y) = (2x, y). Where does T send (3, 5)?",
    [
      { id: "a", label: "(6, 5)", correct: true },
      { id: "b", label: "(3, 5)" },
      { id: "c", label: "(5, 3)" },
      { id: "d", label: "(8, 5)" },
    ],
    "T(3, 5) = (2·3, 5) = (6, 5). Doubles the x-coordinate, leaves y alone."),
  q("T1", "identify",
    "Why study LINEAR transformations and not all transformations?",
    [
      { id: "a", label: "Linear ones preserve structure — they compose easily and have matrices", correct: true },
      { id: "b", label: "Non-linear ones don't exist" },
      { id: "c", label: "Linear ones are easier to draw" },
      { id: "d", label: "Linear ones are rarer" },
    ],
    "Linear transformations preserve add and scale — so they have matrices, compose by matrix multiplication, and are the tractable class. Non-linear ones are wild (Möbius, fractals)."),

  // ── T2 — Why LINEAR Matters (target 5; have 1 → add 4) ──
  q("T2", "truefalse",
    "Every transformation between vector spaces is linear.",
    [
      { id: "a", label: "True" },
      { id: "b", label: "False", correct: true },
    ],
    "No — most are NOT linear. Linear is the special class that preserves add and scale. T(x, y) = x² is non-linear (additivity fails)."),
  q("T2", "predict",
    "If T is linear and T(1, 0) = (3, 1), T(0, 1) = (2, -1), then T(2, 5) = ?",
    [
      { id: "a", label: "(16, -3)", correct: true },
      { id: "b", label: "(5, 0)" },
      { id: "c", label: "(7, 6)" },
      { id: "d", label: "(4, 10)" },
    ],
    "T(2, 5) = 2·T(1,0) + 5·T(0,1) = 2·(3, 1) + 5·(2, -1) = (6, 2) + (10, -5) = (16, -3). Linearity in action."),
  q("T2", "identify",
    "Geometrically, a linear transformation preserves…",
    [
      { id: "a", label: "Straight lines through the origin", correct: true },
      { id: "b", label: "All shapes exactly" },
      { id: "c", label: "Only horizontal lines" },
      { id: "d", label: "Nothing — it scrambles everything" },
    ],
    "Lines through origin map to lines through origin (linearity + T(0)=0). Parallel lines stay parallel. Circles may become ellipses, but the grid structure is preserved."),
  q("T2", "truefalse",
    "If T(cv) = cT(v) for every c and v, T is automatically linear.",
    [
      { id: "a", label: "True" },
      { id: "b", label: "False", correct: true },
    ],
    "No — linearity needs BOTH T(cv) = cT(v) AND T(v + w) = T(v) + T(w). Either alone is not enough. (And T(0) = 0 follows from the first with c = 0.)"),

  // ── T2b — 3D Transformations (target 5; have 2 → add 3) ──
  q("T2b", "predict",
    "The 3x3 matrix [[2, 0, 0], [0, 1, 0], [0, 0, 1]] scales the x-axis by 2 and leaves y, z unchanged. The unit cube becomes…",
    [
      { id: "a", label: "A 2x1x1 box", correct: true },
      { id: "b", label: "The same unit cube" },
      { id: "c", label: "A sphere" },
      { id: "d", label: "A tetrahedron" },
    ],
    "The first basis vector î goes from (1,0,0) to (2,0,0). The other two stay. The unit cube stretches to a 2×1×1 box."),
  q("T2b", "truefalse",
    "A 3x3 matrix can express any 3D linear transformation, including rotations.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — rotations, scalings, shears, reflections are all linear maps in 3D, all expressible as 3x3 matrices. Only translations need a 4x4 with the trick of homogeneous coordinates."),
  q("T2b", "identify",
    "A shear matrix in 3D [[1, 1, 0], [0, 1, 0], [0, 0, 1]] sends (0, 1, 0) to…",
    [
      { id: "a", label: "(1, 1, 0)", correct: true },
      { id: "b", label: "(0, 1, 0)" },
      { id: "c", label: "(1, 0, 0)" },
      { id: "d", label: "(1, 1, 1)" },
    ],
    "Multiply: 1·0 + 1·1 + 0·0 = 1 (first row). 0·0 + 1·1 + 0·0 = 1 (second). 0·0 + 0·1 + 1·0 = 0 (third). So (0,1,0) → (1,1,0). ĵ tilts toward î."),

  // ── T3 — The Matrix of a Transformation (target 5; have 1 → add 4) ──
  q("T3", "predict",
    "If T(i) = (1, 2) and T(j) = (3, 0), what is T(2, 1)?",
    [
      { id: "a", label: "(5, 4)", correct: true },
      { id: "b", label: "(4, 2)" },
      { id: "c", label: "(8, 2)" },
      { id: "d", label: "(2, 3)" },
    ],
    "T(2, 1) = 2·T(i) + 1·T(j) = 2·(1, 2) + (3, 0) = (2, 4) + (3, 0) = (5, 4)."),
  q("T3", "truefalse",
    "The i-th column of a transformation's matrix is T(eᵢ).",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — col i = where the i-th basis vector goes. That's the entire matrix of T in one rule."),
  q("T3", "identify",
    "Why does knowing T(i) and T(j) determine T completely?",
    [
      { id: "a", label: "Because (i, j) is a basis of R² and T is linear", correct: true },
      { id: "b", label: "Because i and j are special numbers" },
      { id: "c", label: "It's a coincidence — they don't really determine T" },
      { id: "d", label: "Because every vector is either i or j" },
    ],
    "Every v in R² = a·i + b·j. By linearity, T(v) = a·T(i) + b·T(j). So knowing T(i), T(j) is enough — no other info needed."),
  q("T3", "predict",
    "The matrix of the identity transformation T(v) = v is…",
    [
      { id: "a", label: "The identity matrix I", correct: true },
      { id: "b", label: "The zero matrix" },
      { id: "c", label: "A diagonal of twos" },
      { id: "d", label: "Anything" },
    ],
    "T(i) = i and T(j) → j, so the matrix has columns (1, 0) and (0, 1). That's I."),

  // ── T4 — Null Space and Range Space (target 5; have 1 → add 4) ──
  q("T4", "truefalse",
    "The null space of a matrix is always a subspace.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — it's the kernel of a linear map. Contains 0, closed under add and scale. Always a subspace."),
  q("T4", "predict",
    "For A = [[1, 0], [0, 0]], the null space is…",
    [
      { id: "a", label: "The y-axis {(0, y)}", correct: true },
      { id: "b", label: "The x-axis" },
      { id: "c", label: "All of R²" },
      { id: "d", label: "Just the origin" },
    ],
    "A·(x, y) = (x, 0). Zero means x = 0. So null = {(0, y)} — the y-axis."),
  q("T4", "identify",
    "The range space (column space) of a matrix is the span of its…",
    [
      { id: "a", label: "Columns", correct: true },
      { id: "b", label: "Rows" },
      { id: "c", label: "Diagonal" },
      { id: "d", label: "Determinants" },
    ],
    "Range = column space = all A·x for x in Rⁿ = span of the columns of A. The columns tell you what's reachable."),
  q("T4", "truefalse",
    "If A is m×n with rank r, then the null space has dimension n - r.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — rank-nullity theorem: dim(null) + dim(range) = n. So nullity = n - rank."),

  // ── T5 — Rank-Nullity (target 5; have 1 → add 4) ──
  q("T5", "predict",
    "T: R⁷ → R⁴ with nullity 3 has rank…",
    [
      { id: "a", label: "4", correct: true },
      { id: "b", label: "3" },
      { id: "c", label: "7" },
      { id: "d", label: "11" },
    ],
    "rank + nullity = dim(domain) = 7. So rank = 7 - 3 = 4. Range lives in R⁴, so rank ≤ 4 anyway."),
  q("T5", "identify",
    "Rank-nullity is sometimes called…",
    [
      { id: "a", label: "The most important equation in linear algebra", correct: true },
      { id: "b", label: "The determinant formula" },
      { id: "c", label: "The Cauchy-Schwarz inequality" },
      { id: "d", label: "The orthogonal decomposition" },
    ],
    "rank + nullity = n is the heartbeat — it ties together how much information is preserved (rank) and how much is lost (nullity). Strang calls it the fundamental theorem."),
  q("T5", "truefalse",
    "If a transformation has rank 0, it must be the zero transformation.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — rank 0 means the range is {0}, so T sends every vector to 0. That's T(v) = 0 for all v."),
  q("T5", "predict",
    "If A is 5×5 and det(A) = 0, what can you say about the null space?",
    [
      { id: "a", label: "It has dimension ≥ 1 (non-trivial null space)", correct: true },
      { id: "b", label: "It is just {0}" },
      { id: "c", label: "It has dimension exactly 5" },
      { id: "d", label: "It equals R⁵" },
    ],
    "det = 0 means A is singular, A is not invertible, so there's a non-zero v with Av = 0. Nullity ≥ 1."),

  // ── T6 — Isomorphisms (target 5; have 1 → add 4) ──
  q("T6", "truefalse",
    "R³ and the space of polynomials of degree ≤ 2 are isomorphic.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Both are 3-dimensional over R. Map (a, b, c) ↔ a + bx + cx². Same shape, different labels."),
  q("T6", "identify",
    "When are two vector spaces isomorphic?",
    [
      { id: "a", label: "When they have the same dimension", correct: true },
      { id: "b", label: "When they have the same elements" },
      { id: "c", label: "Only when both are Rⁿ" },
      { id: "d", label: "When they have the same basis" },
    ],
    "Same dimension ↔ there exists a bijective linear map between them. Over R, dimension is the only invariant."),
  q("T6", "predict",
    "The space of 2x2 real matrices has dimension…",
    [
      { id: "a", label: "4", correct: true },
      { id: "b", label: "2" },
      { id: "c", label: "16" },
      { id: "d", label: "1" },
    ],
    "A 2x2 matrix has 4 entries, each a real number. Basis: E₁₁, E₁₂, E₂₁, E₂₂. So dim = 4. Isomorphic to R⁴."),
  q("T6", "truefalse",
    "R¹⁰⁰ and the space of polynomials of degree ≤ 99 are isomorphic.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Both have dimension 100. (R¹⁰⁰ basis = 100 standard unit vectors; poly degree ≤ 99 basis = {1, x, …, x⁹⁹}.) Same shape."),

  // ── T7 — Composition = Matrix Multiplication (target 5; have 2 → add 3) ──
  q("T7", "predict",
    "A = [[1, 0], [0, 2]] (scales y by 2), B = [[0, 1], [1, 0]] (swaps coords). Then AB applied to (3, 5) gives…",
    [
      { id: "a", label: "(5, 6)", correct: true },
      { id: "b", label: "(6, 5)" },
      { id: "c", label: "(3, 5)" },
      { id: "d", label: "(15, 10)" },
    ],
    "A(B(3, 5)) = A(5, 3) = (5, 2·3) = (5, 6). Apply B first (swap), then A (scale y)."),
  q("T7", "truefalse",
    "Matrix multiplication corresponds to applying the right matrix first.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — AB applied to v means apply A to (B applied to v). So B acts first, then A. Right-to-left convention."),
  q("T7", "identify",
    "Why is matrix multiplication not commutative?",
    [
      { id: "a", label: "Doing A then B is generally different from doing B then A", correct: true },
      { id: "b", label: "Matrices are too complicated" },
      { id: "c", label: "It's only sometimes non-commutative" },
      { id: "d", label: "A typo in the textbook" },
    ],
    "Function composition is order-sensitive: rotate-then-scale ≠ scale-then-rotate. So matrix multiplication inherits non-commutativity from composition."),

  // ── T8 — Inverse (target 5; have 2 → add 3) ──
  q("T8", "predict",
    "For A = [[2, 0], [0, 3]], the inverse is…",
    [
      { id: "a", label: "[[1/2, 0], [0, 1/3]]", correct: true },
      { id: "b", label: "[[2, 0], [0, 3]]" },
      { id: "c", label: "[[3, 0], [0, 2]]" },
      { id: "d", label: "It doesn't exist" },
    ],
    "Diagonal entries invert: 1/2 and 1/3. Check: [[2,0],[0,3]] · [[1/2,0],[0,1/3]] = I. ✓"),
  q("T8", "identify",
    "When does A⁻¹ NOT exist?",
    [
      { id: "a", label: "When A collapses a dimension (det = 0, rank < n)", correct: true },
      { id: "b", label: "When A is square" },
      { id: "c", label: "When A has negative entries" },
      { id: "d", label: "When A is symmetric" },
    ],
    "A⁻¹ exists iff A is invertible, iff det(A) ≠ 0, iff rank(A) = n. If A collapses a dimension, information is lost and can't be recovered — no inverse."),
  q("T8", "truefalse",
    "If A⁻¹ exists, then AA⁻¹ = A⁻¹A = I.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — inverse undoes in both directions. For square matrices, AA⁻¹ = I and A⁻¹A = I both hold."),

  // ── F1 — The Four Fundamental Subspaces (target 5; have 2 → add 3) ──
  q("F1", "identify",
    "For an m×n matrix A, which pair of subspaces lives in Rᵐ?",
    [
      { id: "a", label: "Column space and left-null space", correct: true },
      { id: "b", label: "Row space and null space" },
      { id: "c", label: "Column space and row space" },
      { id: "d", label: "Null space and left-null space" },
    ],
    "C(A) ⊂ Rᵐ, N(Aᵀ) ⊂ Rᵐ. These are the two subspaces that 'live upstairs'. C(Aᵀ) and N(A) live in Rⁿ."),
  q("F1", "predict",
    "For A (3×4) with rank 2: dim(C(A)) = ?, dim(N(A)) = ?, dim(C(Aᵀ)) = ?, dim(N(Aᵀ)) = ?",
    [
      { id: "a", label: "2, 2, 2, 1", correct: true },
      { id: "b", label: "2, 1, 2, 2" },
      { id: "c", label: "3, 1, 4, 2" },
      { id: "d", label: "All four equal 2" },
    ],
    "rank = 2. So dim(C(A)) = dim(C(Aᵀ)) = 2. dim(N(A)) = n - r = 4 - 2 = 2. dim(N(Aᵀ)) = m - r = 3 - 2 = 1."),
  q("F1", "truefalse",
    "The column space is orthogonal to the left-null space.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — N(Aᵀ) is by definition the set of vectors y with yᵀA = 0, i.e., y ⊥ every column of A. So C(A) ⊥ N(Aᵀ). The fundamental orthogonality."),

  // ── F2 — Row Space and Column Space (target 5; have 2 → add 3) ──
  q("F2", "identify",
    "For an m×n matrix A, dim(C(A)) always equals…",
    [
      { id: "a", label: "dim(C(Aᵀ))", correct: true },
      { id: "b", label: "dim(N(A))" },
      { id: "c", label: "m" },
      { id: "d", label: "n" },
    ],
    "Both column space and row space have dimension = rank(A). Always equal. Same rank — different homes."),
  q("F2", "predict",
    "The row space of A is always the same as which space of Aᵀ?",
    [
      { id: "a", label: "The column space of Aᵀ", correct: true },
      { id: "b", label: "The null space of Aᵀ" },
      { id: "c", label: "The left-null space of Aᵀ" },
      { id: "d", label: "Nothing — they're unrelated" },
    ],
    "Row space of A = span of rows of A = span of columns of Aᵀ = column space of Aᵀ. Same set, viewed from the transpose."),
  q("F2", "truefalse",
    "If A is square and invertible, the column space is all of Rⁿ.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — invertible A has full rank, so columns are n independent vectors in Rⁿ, spanning all of Rⁿ."),

  // ── F3 — Linear Functionals (target 5; have 1 → add 4) ──
  q("F3", "truefalse",
    "Every linear functional on Rⁿ is the dot product with some fixed vector.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — the Riesz representation theorem (finite-dimensional case). f(v) = v · w for some unique w."),
  q("F3", "identify",
    "A linear functional f: V → R satisfies…",
    [
      { id: "a", label: "f(v + w) = f(v) + f(w) and f(cv) = cf(v)", correct: true },
      { id: "b", label: "f(v · w) = f(v) · f(w)" },
      { id: "c", label: "f(v) = |v|" },
      { id: "d", label: "f(v) > 0 always" },
    ],
    "Linearity for a map to R: additive and homogeneous. The two rules that make a functional linear."),
  q("F3", "predict",
    "If f(v) = v · (1, 2, 3), what is f(2, -1, 4)?",
    [
      { id: "a", label: "12", correct: true },
      { id: "b", label: "5" },
      { id: "c", label: "7" },
      { id: "d", label: "(2, -2, 12)" },
    ],
    "f(2, -1, 4) = 2·1 + (-1)·2 + 4·3 = 2 - 2 + 12 = 12."),
  q("F3", "identify",
    "Which is NOT a linear functional?",
    [
      { id: "a", label: "f(v) = ||v|| (the length of v)", correct: true },
      { id: "b", label: "f(v) = v · (1, 2, 3)" },
      { id: "c", label: "f(v) = 2v₁ + 3v₂" },
      { id: "d", label: "f(v) = v₁" },
    ],
    "||v|| is not linear: ||(1, 0) + (0, 1)|| = √2, but ||(1, 0)|| + ||(0, 1)|| = 2. Additivity fails."),

  // ── F4 — The Dual Space (target 5; have 1 → add 4) ──
  q("F4", "predict",
    "If dim(V) = 7, then dim(V*) = ?",
    [
      { id: "a", label: "7", correct: true },
      { id: "b", label: "14" },
      { id: "c", label: "49" },
      { id: "d", label: "1" },
    ],
    "dim(V*) = dim(V). Same dimension, but V* consists of functionals (linear maps to R), not vectors in V."),
  q("F4", "truefalse",
    "V* is the same as V — they're the same space, just relabeled.",
    [
      { id: "a", label: "True" },
      { id: "b", label: "False", correct: true },
    ],
    "No — V* consists of LINEAR FUNCTIONALS (maps V → R), not vectors. They're isomorphic in dimension but different kinds of objects."),
  q("F4", "identify",
    "The dual space V* is the vector space of all…",
    [
      { id: "a", label: "Linear functionals on V", correct: true },
      { id: "b", label: "Vectors in V" },
      { id: "c", label: "Matrices" },
      { id: "d", label: "Real numbers" },
    ],
    "V* = Hom(V, R) = set of all linear maps from V to R. Equipped with pointwise addition and scaling, it's a vector space."),
  q("F4", "predict",
    "How many linear functionals are there on R³?",
    [
      { id: "a", label: "Infinitely many, parameterized by 3 coordinates", correct: true },
      { id: "b", label: "Exactly 3" },
      { id: "c", label: "Exactly 1" },
      { id: "d", label: "Exactly 6" },
    ],
    "R³* ≅ R³ — the dual has dimension 3. Each functional is f(v) = v · w for some w ∈ R³. So infinitely many, one for each w."),

  // ── F5 — Dual Basis (target 5; have 2 → add 3) ──
  q("F5", "truefalse",
    "The dual basis to the standard basis of R³ is the set of 'pick out coordinate i' functionals.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — fᵢ(eⱼ) = δᵢⱼ. So fᵢ eats any vector and returns its i-th coordinate. That's the bookkeeping job."),
  q("F5", "identify",
    "Why is the dual basis unique?",
    [
      { id: "a", label: "The defining equations fᵢ(vⱼ) = δᵢⱼ form a solvable n×n system", correct: true },
      { id: "b", label: "By definition, any basis is unique" },
      { id: "c", label: "Because V* is small" },
      { id: "d", label: "It's not unique" },
    ],
    "The n² equations fᵢ(vⱼ) = δᵢⱼ in n unknowns (the functionals' values on the basis) determine the functionals uniquely. So the dual basis is unique."),
  q("F5", "predict",
    "If V has basis {v₁, v₂, v₃} and the dual basis is {f₁, f₂, f₃}, then f₂(v₁ + 2v₂ + 3v₃) = ?",
    [
      { id: "a", label: "2", correct: true },
      { id: "b", label: "0" },
      { id: "c", label: "3" },
      { id: "d", label: "6" },
    ],
    "By linearity: f₂(v₁ + 2v₂ + 3v₃) = f₂(v₁) + 2f₂(v₂) + 3f₂(v₃) = 0 + 2·1 + 3·0 = 2. f₂ picks out the second coordinate."),

  // ── F6 — Annihilator (target 5; have 1 → add 4) ──
  q("F6", "truefalse",
    "The annihilator W° always has dimension dim(V) - dim(W).",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — dim(W) + dim(W°) = dim(V). The annihilator theorem."),
  q("F6", "identify",
    "If W is all of V, what is W°?",
    [
      { id: "a", label: "Just the zero functional", correct: true },
      { id: "b", label: "All of V*" },
      { id: "c", label: "V itself" },
      { id: "d", label: "Undefined" },
    ],
    "If W = V, then any functional that vanishes on all of V must be the zero functional. So W° = {0}."),
  q("F6", "predict",
    "If W = {0} in V, what is W°?",
    [
      { id: "a", label: "All of V*", correct: true },
      { id: "b", label: "{0}" },
      { id: "c", label: "V" },
      { id: "d", label: "Empty set" },
    ],
    "Every functional vanishes on {0} (since f(0) = 0). So all functionals are in the annihilator: W° = V*."),
  q("F6", "identify",
    "The annihilator of the column space C(A) is…",
    [
      { id: "a", label: "The left-null space N(Aᵀ)", correct: true },
      { id: "b", label: "The row space" },
      { id: "c", label: "The null space N(A)" },
      { id: "d", label: "All of Rᵐ" },
    ],
    "By definition, the left-null space N(Aᵀ) = {y : yᵀA = 0} = functionals on Rᵐ that vanish on every column of A = (C(A))°."),

  // ── F7 — Transpose of a Transformation (target 5; have 1 → add 4) ──
  q("F7", "truefalse",
    "The transpose T* takes functionals to functionals — never to vectors.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — T: V → W. Then T*: W* → V*. Inputs and outputs are functionals, not vectors. It's a map between dual spaces."),
  q("F7", "identify",
    "How does T* act on a functional f ∈ W*?",
    [
      { id: "a", label: "(T*f)(v) = f(T(v))", correct: true },
      { id: "b", label: "(T*f)(v) = T(f(v))" },
      { id: "c", label: "(T*f)(v) = f(v) · T(v)" },
      { id: "d", label: "(T*f)(v) = v" },
    ],
    "Definition of transpose/pullback: (T*f)(v) = f(Tv). You apply T first to v, then f to the result. The defining identity."),
  q("F7", "predict",
    "If T has matrix A, what is the matrix of T*?",
    [
      { id: "a", label: "Aᵀ (the matrix transpose)", correct: true },
      { id: "b", label: "A⁻¹" },
      { id: "c", label: "-A" },
      { id: "d", label: "I" },
    ],
    "Yes — the matrix of T* is Aᵀ. The abstract transpose equals the concrete matrix transpose. The two notions agree."),
  q("F7", "truefalse",
    "T* reverses the direction of T: if T: V → W, then T*: W → V.",
    [
      { id: "a", label: "True" },
      { id: "b", label: "False", correct: true },
    ],
    "No — T*: W* → V*. It reverses the direction but on the DUAL spaces, not on V and W themselves. Common confusion."),

  // ── F8 — Double-Dual Theorem (target 5; have 1 → add 4) ──
  q("F8", "truefalse",
    "For finite-dimensional V, V** is canonically isomorphic to V (no choice of basis needed).",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — the canonical map v ↦ (f ↦ f(v)) is an isomorphism. No basis needed; it works for any finite-dimensional V."),
  q("F8", "identify",
    "What does the double-dual map actually do?",
    [
      { id: "a", label: "Sends each vector v to the functional 'evaluate v on f'", correct: true },
      { id: "b", label: "Doubles the length of every vector" },
      { id: "c", label: "Sends v to v ⊗ v" },
      { id: "d", label: "Nothing — V** is unrelated to V" },
    ],
    "v ↦ the functional φ_v : V* → R defined by φ_v(f) = f(v). That 'functional of functionals' is how each v is uniquely represented in V**."),
  q("F8", "predict",
    "For V = R⁵, the dimension of V** is…",
    [
      { id: "a", label: "5", correct: true },
      { id: "b", label: "10" },
      { id: "c", label: "25" },
      { id: "d", label: "1" },
    ],
    "dim(V**) = dim(V*) = dim(V) = 5. Each application of * preserves dimension in finite dimensions."),
  q("F8", "truefalse",
    "The double-dual theorem works for infinite-dimensional spaces too (in the same form).",
    [
      { id: "a", label: "True" },
      { id: "b", label: "False", correct: true },
    ],
    "No — for infinite-dimensional V, V** is strictly larger than V in general. The canonical map is injective but not surjective. The finite-dim case is special."),

  // ── E1 — Eigenvectors (target 5; have 2 → add 3) ──
  q("E1", "predict",
    "For the matrix [[3, 0], [0, 3]] = 3I, every non-zero vector is an eigenvector with eigenvalue…",
    [
      { id: "a", label: "3", correct: true },
      { id: "b", label: "0" },
      { id: "c", label: "1" },
      { id: "d", label: "It depends on the vector" },
    ],
    "3I · v = 3v for every v. So every vector is an eigenvector with eigenvalue 3. The matrix is a uniform scaling."),
  q("E1", "identify",
    "Geometrically, an eigenvector of T is…",
    [
      { id: "a", label: "A vector that T only stretches (or flips), never rotates", correct: true },
      { id: "b", label: "A vector that T rotates by 90°" },
      { id: "c", label: "Any vector in R²" },
      { id: "d", label: "The zero vector only" },
    ],
    "Av = λv means T(v) is parallel to v. T doesn't change the direction — only scales it. That's the 'preferred direction'."),
  q("E1", "truefalse",
    "Every 2×2 matrix has at least one eigenvector (possibly complex).",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — characteristic polynomial of 2×2 matrix has degree 2, so it has 2 roots (possibly complex). Each root gives an eigenvector (over C). Real case: at least one real eigenvalue if the matrix is real."),

  // ── E2 — Eigenvalue (target 5; have 1 → add 4) ──
  q("E2", "truefalse",
    "An eigenvalue can be zero.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — λ = 0 is a valid eigenvalue. It means T sends the eigenvector to zero. Non-trivial null space."),
  q("E2", "predict",
    "If Av = -1·v, what does T do to v geometrically?",
    [
      { id: "a", label: "Reflects v through the origin (same length, opposite direction)", correct: true },
      { id: "b", label: "Doubles its length" },
      { id: "c", label: "Rotates by 90°" },
      { id: "d", label: "Collapses it to zero" },
    ],
    "λ = -1 means T(v) = -v. The arrow gets reflected through the origin — same length, opposite direction."),
  q("E2", "identify",
    "A complex eigenvalue means the transformation…",
    [
      { id: "a", label: "Rotates and scales — there's no real line it preserves", correct: true },
      { id: "b", label: "Has no effect" },
      { id: "c", label: "Is the identity" },
      { id: "d", label: "Becomes non-linear" },
    ],
    "Complex eigenvalues appear as conjugate pairs a ± bi. They correspond to rotation (b ≠ 0) and scaling (a). Over R, the transformation has no real invariant lines — it spins."),
  q("E2", "predict",
    "For A = [[2, 1], [1, 2]], one eigenvalue is 3 with eigenvector (1, 1). The other eigenvalue is…",
    [
      { id: "a", label: "1", correct: true },
      { id: "b", label: "3" },
      { id: "c", label: "-1" },
      { id: "d", label: "0" },
    ],
    "Trace = 2 + 2 = 4 = sum of eigenvalues. So the other is 4 - 3 = 1. (Or compute det = 3 = product, gives 3·λ = 3 → λ = 1.)"),

  // ── E3 — Characteristic Polynomial (target 5; have 1 → add 4) ──
  q("E3", "predict",
    "For A = [[1, 2], [2, 1]], the characteristic polynomial det(A - λI) is…",
    [
      { id: "a", label: "λ² - 2λ - 3", correct: true },
      { id: "b", label: "λ² + 2λ + 3" },
      { id: "c", label: "λ² - 3λ + 2" },
      { id: "d", label: "λ - 1" },
    ],
    "det([[1-λ, 2], [2, 1-λ]]) = (1-λ)² - 4 = 1 - 2λ + λ² - 4 = λ² - 2λ - 3. Roots: λ = 3, -1."),
  q("E3", "truefalse",
    "Eigenvalues of Aᵀ equal eigenvalues of A.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — A and Aᵀ have the same characteristic polynomial (det(Aᵀ - λI) = det((A - λI)ᵀ) = det(A - λI)). So same eigenvalues."),
  q("E3", "identify",
    "Why is det(A - λI) the characteristic polynomial?",
    [
      { id: "a", label: "Because A - λI must be singular for a non-trivial eigenvector to exist", correct: true },
      { id: "b", label: "It's a convention" },
      { id: "c", label: "It equals the determinant by coincidence" },
      { id: "d", label: "Because A is symmetric" },
    ],
    "Av = λv → (A - λI)v = 0. Non-trivial v requires A - λI singular, i.e., det(A - λI) = 0. So eigenvalues are roots of that polynomial."),
  q("E3", "predict",
    "The product of the eigenvalues of A equals…",
    [
      { id: "a", label: "det(A)", correct: true },
      { id: "b", label: "trace(A)" },
      { id: "c", label: "rank(A)" },
      { id: "d", label: "0 always" },
    ],
    "The constant term of the characteristic polynomial equals det(A) up to sign — which is the product of eigenvalues. Eigenvalue product = determinant."),

  // ── E4 — Diagonalization (target 5; have 1 → add 4) ──
  q("E4", "predict",
    "If A has eigenvalues 2, 3, 5 with independent eigenvectors, then A¹⁰ has eigenvalues…",
    [
      { id: "a", label: "2¹⁰, 3¹⁰, 5¹⁰", correct: true },
      { id: "b", label: "2, 3, 5" },
      { id: "c", label: "10, 30, 50" },
      { id: "d", label: "It can't be determined" },
    ],
    "If A = PDP⁻¹ with D diagonal of eigenvalues, then Aⁿ = PDⁿP⁻¹ — raise each eigenvalue to the n-th power. 2¹⁰ = 1024, 3¹⁰ = 59049, 5¹⁰ = 9765625."),
  q("E4", "truefalse",
    "Every matrix is diagonalizable.",
    [
      { id: "a", label: "True" },
      { id: "b", label: "False", correct: true },
    ],
    "No — only those with n linearly independent eigenvectors. Jordan blocks exist for matrices that are NOT diagonalizable (e.g., [[1, 1], [0, 1]])."),
  q("E4", "identify",
    "In A = PDP⁻¹, what are the columns of P?",
    [
      { id: "a", label: "Linearly independent eigenvectors of A", correct: true },
      { id: "b", label: "Any basis of Rⁿ" },
      { id: "c", label: "The standard basis" },
      { id: "d", label: "Eigenvectors of Aᵀ" },
    ],
    "Col i of P = the i-th eigenvector. D is diagonal with eigenvalues on the diagonal in the same order. That's the structure of diagonalization."),
  q("E4", "truefalse",
    "If A has n distinct eigenvalues, A is automatically diagonalizable.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — distinct eigenvalues → eigenvectors are linearly independent. So n distinct eigenvalues → n independent eigenvectors → diagonalizable."),

  // ── E5 — Cayley-Hamilton (target 5; have 2 → add 3) ──
  q("E5", "predict",
    "For A = [[3, 1], [0, 2]], the characteristic polynomial is p(λ) = (λ - 3)(λ - 2) = λ² - 5λ + 6. What is p(A)?",
    [
      { id: "a", label: "The 2×2 zero matrix", correct: true },
      { id: "b", label: "A itself" },
      { id: "c", label: "The identity" },
      { id: "d", label: "A²" },
    ],
    "By Cayley-Hamilton, p(A) = 0 for any A. The theorem says: every matrix is a root of its own characteristic polynomial."),
  q("E5", "truefalse",
    "Cayley-Hamilton is useful for computing the matrix exponential exp(At).",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — the matrix exponential exp(At) can be computed as a polynomial in A (of degree < n) via Cayley-Hamilton, instead of an infinite Taylor series. Powerful trick."),
  q("E5", "identify",
    "What does Cayley-Hamilton allow you to do with A⁻¹?",
    [
      { id: "a", label: "Compute it as a polynomial in A (no row-reduction needed)", correct: true },
      { id: "b", label: "Prove it always exists" },
      { id: "c", label: "Show A is symmetric" },
      { id: "d", label: "Nothing — Cayley-Hamilton is unrelated" },
    ],
    "If A is invertible, p(A) = 0 gives a polynomial relation. Rearrange to get A⁻¹ as a polynomial in A. Useful for theoretical work and avoiding explicit inversion."),

  // ── E6 — Minimal Polynomial (target 5; have 2 → add 3) ──
  q("E6", "truefalse",
    "The minimal polynomial is unique for each matrix.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — there's a unique monic polynomial of smallest degree with m(A) = 0. Uniqueness follows from the definition of 'minimal'."),
  q("E6", "identify",
    "For a matrix with eigenvalues 2, 2, 3 (2 repeated), what can the minimal polynomial look like?",
    [
      { id: "a", label: "(λ - 2)(λ - 3), if A is diagonalizable", correct: true },
      { id: "b", label: "(λ - 2)²(λ - 3) always" },
      { id: "c", label: "(λ - 2)(λ - 3)² always" },
      { id: "d", label: "λ² always" },
    ],
    "If A is diagonalizable, repeated eigenvalues don't need higher powers in the minimal polynomial — each factor appears once. So m(λ) = (λ-2)(λ-3)."),
  q("E6", "predict",
    "The minimal polynomial of the identity matrix I is…",
    [
      { id: "a", label: "(λ - 1)", correct: true },
      { id: "b", label: "λ" },
      { id: "c", label: "(λ - 1)ⁿ" },
      { id: "d", label: "1 (the constant polynomial)" },
    ],
    "I has eigenvalue 1 (the only one). m(I) = 0 means λ = 1 is a root. So m(λ) = λ - 1. The smallest polynomial vanishing on I."),

  // ── S1 — SVD (target 5; have 1 → add 4) ──
  q("S1", "predict",
    "The singular values of A are the square roots of the eigenvalues of…",
    [
      { id: "a", label: "AᵀA", correct: true },
      { id: "b", label: "A" },
      { id: "c", label: "Aᵀ" },
      { id: "d", label: "A + Aᵀ" },
    ],
    "AᵀA is symmetric positive semi-definite, so has non-negative eigenvalues. Singular values σᵢ = √(λᵢ(AᵀA))."),
  q("S1", "truefalse",
    "The columns of U and V in A = UΣVᵀ are orthonormal.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — U and V are orthogonal matrices, so their columns are orthonormal. U is eigenvectors of AAᵀ, V is eigenvectors of AᵀA."),
  q("S1", "identify",
    "Geometrically, SVD says any linear transformation is…",
    [
      { id: "a", label: "A rotation, a scaling along orthogonal axes, then another rotation", correct: true },
      { id: "b", label: "Always a reflection" },
      { id: "c", label: "Always a translation" },
      { id: "d", label: "Never invertible" },
    ],
    "Rotate (Vᵀ), scale along orthogonal axes (Σ), rotate (U). The whole transformation decomposed into three intuitive pieces. Strang's signature theorem."),
  q("S1", "predict",
    "For A = [[3, 0], [0, 4]], the singular values are…",
    [
      { id: "a", label: "3 and 4", correct: true },
      { id: "b", label: "9 and 16" },
      { id: "c", label: "5 and 7" },
      { id: "d", label: "Just 3" },
    ],
    "Diagonal matrix has singular values = absolute values of diagonal entries. AᵀA = diag(9, 16) → σ = √(9), √(16) = 3, 4."),

  // ── S2 — SVD Image Compression (target 5; have 1 → add 4) ──
  q("S2", "predict",
    "If you keep the top 20 singular values of a 1000×1000 image, how many entries must be stored (approx)?",
    [
      { id: "a", label: "1000 + 1000 + 20 ≈ 2020", correct: true },
      { id: "b", label: "1,000,000" },
      { id: "c", label: "20,000" },
      { id: "d", label: "100" },
    ],
    "U (1000×20) + Σ (20) + Vᵀ (20×1000) = 40,000 + 20 ≈ 40k floats — much smaller than the original 1M pixels. The compression ratio."),
  q("S2", "truefalse",
    "Higher rank-k approximation means more compression but less fidelity.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — k controls the trade-off. k = 1: tiny file, blurry. k = n: full image. Most compression algorithms pick k to balance file size and quality."),
  q("S2", "identify",
    "The Eckart-Young theorem says the rank-k SVD approximation is…",
    [
      { id: "a", label: "The best possible rank-k approximation in Frobenius norm", correct: true },
      { id: "b", label: "Just one possible approximation" },
      { id: "c", label: "Worse than other methods" },
      { id: "d", label: "Undefined" },
    ],
    "Eckart-Young (1936): the top-k singular value truncation minimizes ||A - Aₖ||_F over ALL rank-k matrices. No other method does better in Frobenius norm."),
  q("S2", "predict",
    "For a 100×100 grayscale image, the original has how many pixels?",
    [
      { id: "a", label: "10,000", correct: true },
      { id: "b", label: "100" },
      { id: "c", label: "1,000,000" },
      { id: "d", label: "200" },
    ],
    "100×100 = 10,000 pixels. Each pixel is one number (grayscale). So the image matrix has 10,000 entries."),

  // ── S3 — PCA (target 5; have 1 → add 4) ──
  q("S3", "truefalse",
    "The first principal component is the direction of maximum variance in the data.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — it's the dominant eigenvector of the covariance matrix. The direction in which the data is most spread out."),
  q("S3", "predict",
    "Principal components are always…",
    [
      { id: "a", label: "Orthogonal to each other", correct: true },
      { id: "b", label: "The same vector" },
      { id: "c", label: "Parallel" },
      { id: "d", label: "Unit vectors of length 1" },
    ],
    "Yes — eigenvectors of a symmetric matrix (the covariance) are orthogonal. So PCs form an orthogonal basis."),
  q("S3", "identify",
    "What does PCA do to high-dimensional data?",
    [
      { id: "a", label: "Projects it onto the low-dimensional subspace of maximum variance", correct: true },
      { id: "b", label: "Scales every coordinate equally" },
      { id: "c", label: "Replaces every value with its mean" },
      { id: "d", label: "Sorts the values" },
    ],
    "PCA finds the best k-dimensional subspace (spanned by top-k PCs) and projects the data onto it. Preserves as much variance as possible in k dimensions."),
  q("S3", "predict",
    "If your data lies exactly on a line in 2D, what does PCA with k=1 give you?",
    [
      { id: "a", label: "A perfect representation — the data has rank 1", correct: true },
      { id: "b", label: "Random projection" },
      { id: "c", label: "Zero information" },
      { id: "d", label: "The mean only" },
    ],
    "Perfect — if data has rank 1 (lies on a line), PCA recovers that line with zero loss. The dominant singular value captures all the variance."),

  // ── S4 — Least Squares (target 5; have 1 → add 4) ──
  q("S4", "truefalse",
    "The pseudoinverse x* = (AᵀA)⁻¹Aᵀb is the formula for the least-squares solution.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — x* minimizes ||Ax - b||² when A has full column rank. The pseudoinverse A⁺ = (AᵀA)⁻¹Aᵀ."),
  q("S4", "predict",
    "In least squares, the error b - Ax* is always…",
    [
      { id: "a", label: "Orthogonal to the column space of A", correct: true },
      { id: "b", label: "In the column space" },
      { id: "c", label: "Zero" },
      { id: "d", label: "Equal to b" },
    ],
    "Geometric meaning: x* is the point where Ax is the projection of b onto the column space. So b - Ax* is perpendicular to that column space. That's the proof."),
  q("S4", "identify",
    "When is least squares useful?",
    [
      { id: "a", label: "When the system Ax = b has no exact solution", correct: true },
      { id: "b", label: "Only for square systems" },
      { id: "c", label: "Only when b = 0" },
      { id: "d", label: "Never" },
    ],
    "When no exact solution exists — overdetermined systems (more equations than unknowns) or when measurements are noisy. Find the closest possible answer."),
  q("S4", "predict",
    "Fit a line y = mx + b through (0, 1), (1, 3), (2, 4). The normal equations give…",
    [
      { id: "a", label: "m = 1.5, b = 1.33 (approximately)", correct: true },
      { id: "b", label: "m = 3, b = 1" },
      { id: "c", label: "m = 1, b = 2" },
      { id: "d", label: "There's an exact solution" },
    ],
    "Normal equations: AᵀA · [m, b]ᵀ = Aᵀb. A = [[0, 1], [1, 1], [2, 1]]. Solve — the line y = 1.5x + 1.33 minimizes sum of squared residuals."),

  // ── S5 — Real-World Payoffs (target 5; have 1 → add 4) ──
  q("S5", "truefalse",
    "Google's PageRank is computed by finding the dominant eigenvector of the web's link matrix.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — the link matrix has a stochastic structure with eigenvalue 1, and the corresponding eigenvector gives page importance scores. Brin & Page's original insight."),
  q("S5", "identify",
    "Face unlock on your phone typically uses…",
    [
      { id: "a", label: "PCA (eigenfaces) — represent faces in a low-dim subspace", correct: true },
      { id: "b", label: "Random projections" },
      { id: "c", label: "Pixel-by-pixel comparison" },
      { id: "d", label: "Nothing — phones don't do face recognition" },
    ],
    "Eigenfaces: represent each face as a combination of ~100 principal components (eigenfaces). Compare in that subspace. Faster and more robust than pixel comparison."),
  q("S5", "predict",
    "The Hill cipher encrypts a 2-letter block (p₁, p₂) as (c₁, c₂) = K · (p₁, p₂) where K is a 2×2 matrix. Decryption uses…",
    [
      { id: "a", label: "K⁻¹ — the inverse matrix", correct: true },
      { id: "b", label: "Kᵀ — the transpose" },
      { id: "c", label: "K itself" },
      { id: "d", label: "K · K" },
    ],
    "Decryption: (p₁, p₂) = K⁻¹ · (c₁, c₂). The cipher is invertible iff det(K) ≠ 0. Simple matrix multiplication as encryption."),
  q("S5", "truefalse",
    "Quantum mechanical states are represented as vectors in a complex Hilbert space.",
    [
      { id: "a", label: "True", correct: true },
      { id: "b", label: "False" },
    ],
    "Yes — state vectors |ψ⟩ live in complex Hilbert space. Operators (observables) are unitary matrices. Eigenvalues of observables are the possible measurement outcomes. Linear algebra at the foundation of quantum mechanics."),
];

export const QUESTIONS_BY_CONCEPT: Record<string, Question[]> = QUESTIONS.reduce(
  (acc, q) => {
    if (!acc[q.conceptId]) acc[q.conceptId] = [];
    acc[q.conceptId].push(q);
    return acc;
  },
  {} as Record<string, Question[]>,
);
