// Question bank. For each concept, 3-5 questions. Each has a unique id.
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
  return {
    id: `${conceptId}-${++_qid}`,
    conceptId,
    type,
    prompt,
    options,
    explanation,
    hint,
    xp,
    playground,
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
];

export const QUESTIONS_BY_CONCEPT: Record<string, Question[]> = QUESTIONS.reduce(
  (acc, q) => {
    if (!acc[q.conceptId]) acc[q.conceptId] = [];
    acc[q.conceptId].push(q);
    return acc;
  },
  {} as Record<string, Question[]>,
);
