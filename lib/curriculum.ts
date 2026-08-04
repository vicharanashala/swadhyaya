// Curriculum — the DAG of concept nodes.
// Iyengar-aligned sequence: concrete (Ax=b) → abstraction (vector spaces) →
// transformations → four subspaces / dual → eigen → SVD / PCA / least squares.

export type ConceptId =
  // Phase 1 — Systems of Linear Equations
  | "L1" | "L2" | "L3" | "L4" | "L5" | "L6" | "L7" | "L8"
  // Phase 2 — Vector Spaces
  | "V1" | "V2" | "V3" | "V4" | "V5" | "V6" | "V7" | "V8"
  // Phase 3 — Linear Transformations
  | "T1" | "T2" | "T2b" | "T3" | "T4" | "T5" | "T6" | "T7" | "T8"
  // Phase 4 — Four Subspaces & Dual
  | "F1" | "F2" | "F3" | "F4" | "F5" | "F6" | "F7" | "F8"
  // Phase 5 — Eigenvalues
  | "E1" | "E2" | "E3" | "E4" | "E5" | "E6"
  // Phase 6 — SVD & Applications (the payoff)
  | "S1" | "S2" | "S3" | "S4" | "S5";

export type Phase = 1 | 2 | 3 | 4 | 5 | 6;

export interface ConceptNode {
  id: ConceptId;
  phase: Phase;
  order: number; // within phase
  title: string;
  short: string; // one-line, no jargon
  story: string; // the story that opens Act 2
  prereqs: ConceptId[];
  xp: number;
  playground: PlaygroundId;
  questions: QuestionId[];
  whyCare?: string;       // real-world application
  strang?: string;        // formal layer reference
}

export type PlaygroundId =
  | "lines-2d-one" | "lines-2d-two" | "intersect" | "planes-3d" | "row-ops" | "gaussian" | "rref" | "homogeneous"
  | "vector-arrow" | "add-scale" | "linear-combination"
  | "span" | "subspace" | "independence" | "basis" | "dimension"
  | "transformation" | "linear-matters" | "transform-3d" | "matrix-cols" | "matrix-times-vec" | "matrix-times-mat"
  | "big-four" | "determinant" | "inverse" | "rank" | "null-range" | "rank-nullity" | "isomorphism"
  | "four-subspaces" | "row-col" | "functional" | "dual" | "dual-basis" | "annihilator" | "transpose" | "double-dual"
  | "eigen-discover" | "eigen-discover-v2" | "eigenvalue" | "characteristic" | "characteristic-2" | "cayley-hamilton" | "minimal-poly" | "diagonalize"
  | "svd-animate" | "svd-image" | "pca" | "least-squares"
  // Question-specific playgrounds — one per question that earns its own
  // bespoke interactive widget. The Playground tab for the concept shows
  // the concept-level widget; the Test tab question embeds the q-level one
  // above the options so the student can manipulate the math and observe
  // the answer directly.
  | "q-L1-q1"
  | "q-L2-q1"
  | "q-L2-q2"
  | "q-L3-q1"
  | "q-L4-q1"
  | "q-L5-q1"
  | "q-L6-q1"
  | "q-L7-q1"
  | "q-L8-q1"
  | "q-V1-q1"
  | "q-V2-q1"
  | "q-V2-q2"
  | "q-V4-q1"
  | "q-V5-q1"
  | "q-V6-q1"
  | "q-V8-q1"
  | "q-T2-q1"
  | "q-T3-q1"
  | "q-T4-q1"
  | "q-T5-q1"
  | "q-T7-q1"
  | "q-T8-q1"
  | "q-E1-q1"
  | "q-E2-q1"
  | "q-E3-q1"
  | "q-S1-q1"
  | "q-S2-q1"
  | "q-S3-q1"
  | "q-E5-q1";

export type QuestionId = string;

export const PHASES: Array<{
  id: Phase;
  title: string;
  subtitle: string;
  color: string;
}> = [
  { id: 1, title: "Systems of Linear Equations", subtitle: "Where the world starts", color: "#e8864a" },
  { id: 2, title: "Vector Spaces",                 subtitle: "The abstraction, now earned",   color: "#d4a574" },
  { id: 3, title: "Linear Transformations",        subtitle: "Functions that preserve structure", color: "#5cb87a" },
  { id: 4, title: "Four Subspaces & Dual Space",   subtitle: "The deep structure",            color: "#c98aff" },
  { id: 5, title: "Eigenvalues & Eigenvectors",    subtitle: "What survives the transformation", color: "#ffcc66" },
  { id: 6, title: "SVD & Applications",            subtitle: "The payoff — real world",        color: "#ff8a65" },
];

export const CONCEPTS: ConceptNode[] = [
  // ════════════════════════════════════════════════════════════
  // PHASE 1 — SYSTEMS OF LINEAR EQUATIONS
  // ════════════════════════════════════════════════════════════
  {
    id: "L1", phase: 1, order: 1,
    title: "What is an Equation?",
    short: "An equation is a question: where do the two sides agree?",
    story: "Imagine a weighing scale. You put 3 apples on the left and some weight on the right. The equation '3 = w' is the question: what weight makes the scale balance? Every equation is that question — find the value where the two sides match. Draw y = 2x + 1 on a graph. Now ask: at x = 0, what is y? The equation answers: y = 1. The graph shows that point.",
    prereqs: [],
    xp: 10,
    playground: "lines-2d-one",
    questions: ["L1-q1", "L1-q2"],
    whyCare: "Every physics equation (F=ma, E=mc²) is an equation. Every business calculation (price × quantity = revenue) is one. Equations are how the world answers questions.",
    strang: "Strang §1.1 — the geometry of linear equations. The first three pages of his book.",
  },
  {
    id: "L2", phase: 1, order: 2,
    title: "Two Unknowns, Two Equations",
    short: "Two lines, meeting at a point. That point is the answer.",
    story: "Atul's house is at the origin. He walks 2 units east, then 1 unit north, to reach Bala's house. Then he turns right (east) for 1 unit, then left (north) for 1 unit, reaching Chetan. Right 1, left 1, reaching Divya. Are Bala, Chetan, Divya on a straight line? The line y = x + 0. They are. This is one equation with one story.",
    prereqs: ["L1"],
    xp: 15,
    playground: "lines-2d-two",
    questions: ["L2-q1", "L2-q2"],
  },
  {
    id: "L3", phase: 1, order: 3,
    title: "Three Equations, Three Unknowns",
    short: "Three planes meeting at a single point. Most of the time.",
    story: "Three equations, three unknowns. Imagine three flat sheets of glass floating in 3D space. They might meet at one point (the answer), or two might be parallel (no answer), or all three might be the same sheet (infinite answers). You cannot see them meet in your head, so the matrix form gives you a way to find out.",
    prereqs: ["L2"],
    xp: 20,
    playground: "planes-3d",
    questions: ["L3-q1"],
  },
  {
    id: "L4", phase: 1, order: 4,
    title: "The Matrix Form — Ax = b",
    short: "The moment matrices enter. Coefficients, unknowns, answers — three blocks.",
    story: "Look at this: 2x + 3y = 7, 3x + 4y = 10. The coefficients (2, 3, 3, 4) form a 2x2 block. The unknowns (x, y) form a column. The answers (7, 10) form another column. We write [[2,3],[3,4]] * [x,y]ᵀ = [7,10]ᵀ. Or simply: A x = b. Three symbols, one idea: the matrix A turns the unknown vector x into the answer b.",
    prereqs: ["L3"],
    xp: 25,
    playground: "matrix-times-vec",
    questions: ["L4-q1", "L4-q2"],
  },
  {
    id: "L5", phase: 1, order: 5,
    title: "Row Operations — Multiply, Swap, Add",
    short: "Three moves that keep the answer the same. The toolkit.",
    story: "You can swap two equations (the answer doesn't care which comes first). You can multiply an equation by any non-zero number. You can add one equation to another. These three moves don't change the answer. They are how you SIMPLIFY until the answer stares at you. This is exactly the Hill cipher but in reverse — you scramble, then unscramble by row operations.",
    prereqs: ["L1"],
    xp: 30,
    playground: "row-ops",
    questions: ["L5-q1", "L5-q2"],
    whyCare: "The Hill cipher (encrypt text with a 2×2 matrix), Google's PageRank (iterate a matrix to rank pages), and any linear programming solver all rely on row operations under the hood. They're the universal simplification tool.",
    strang: "Strang §1.3 — the three row operations. The toolkit every numerical method starts from.",
  },
  {
    id: "L6", phase: 1, order: 6,
    title: "Row-Echelon Form (Gaussian Elimination)",
    short: "Zig-zag down to zeros below the diagonal. The answer is then read bottom-up.",
    story: "Take a system. Use row operations to make all the entries below the main diagonal zero. Now the system is in a stair-step shape. Read from the bottom row up — the last equation gives you one variable, plug into the one above, get the next, and so on. This is the systematic way Sudarshan teaches: elimination, then back-substitution.",
    prereqs: ["L5"],
    xp: 35,
    playground: "gaussian",
    questions: ["L6-q1", "L6-q2"],
  },
  {
    id: "L7", phase: 1, order: 7,
    title: "Row-Reduced Echelon Form (RREF)",
    short: "The unique final form. One row of all zeros at the bottom. Pivots are 1.",
    story: "Take echelon form one step further: make every pivot 1, and zero out everything ABOVE the pivots too. The result is the RREF — and it is UNIQUE for every system. Same system, no matter how you got there, ends in the same RREF. This uniqueness is the magic. It is the canonical form. The fingerprint of the system.",
    prereqs: ["L6"],
    xp: 40,
    playground: "rref",
    questions: ["L7-q1"],
  },
  {
    id: "L8", phase: 1, order: 8,
    title: "Homogeneous vs Non-Homogeneous",
    short: "Ax = 0 always has at least one answer: the zero vector. Ax = b might have zero, one, or infinite.",
    story: "A homogeneous system is Ax = 0. It always has at least the trivial answer x = 0. The question is: are there OTHER answers? If A is full-rank, no. If A collapses a dimension, yes — an entire line of answers. A non-homogeneous system is Ax = b with b ≠ 0. It might have no answer (b is outside what A can produce), exactly one (unique), or infinitely many (if A has a null space).",
    prereqs: ["L7"],
    xp: 45,
    playground: "homogeneous",
    questions: ["L8-q1", "L8-q2"],
  },

  // ════════════════════════════════════════════════════════════
  // PHASE 2 — VECTOR SPACES
  // ════════════════════════════════════════════════════════════
  {
    id: "V1", phase: 2, order: 1,
    title: "Vectors are Arrows, not Lists",
    short: "Drag the tail. The head follows. An arrow has direction and length.",
    story: "Forget the bracket notation for a moment. A vector is an arrow. It has a tail and a head. It has length (how long) and direction (which way). The arrow does not care WHERE you place its tail — you can slide it around the plane and it is the SAME arrow. Only length and direction matter. (1, 2) means: go 1 right, 2 up.",
    prereqs: ["L8"],
    xp: 25,
    playground: "vector-arrow",
    questions: ["V1-q1", "V1-q2"],
  },
  {
    id: "V2", phase: 2, order: 2,
    title: "Adding and Scaling — Linear Combinations",
    short: "Add = head-to-tail walk. Scale = stretch or shrink or flip.",
    story: "Adding two vectors: walk along the first arrow, then walk along the second. The end is the sum. Scaling: multiply by a number. 2 times the arrow = twice as long. -1 times the arrow = flipped. A linear combination is just adding scaled arrows. The recipe: 3 of this, -2 of that, 5 of the other. The result is a new arrow.",
    prereqs: ["V1"],
    xp: 30,
    playground: "linear-combination",
    questions: ["V2-q1", "V2-q2"],
    whyCare: "Every neural network is built from linear combinations. Each neuron takes a weighted sum of inputs. The 'linear' in 'linear algebra' is the same 'linear' that powers the modern AI revolution.",
    strang: "Strang §1.2 — linear combinations. The 'recipe' framing: c₁v₁ + c₂v₂ + ... + cₙvₙ.",
  },
  {
    id: "V3", phase: 2, order: 3,
    title: "Vector Space Axioms — Made Visual",
    short: "The rules every 'space of arrows' must obey. They are surprisingly simple.",
    story: "A 'vector space' is any collection of arrows that obeys eight rules. The rules are: add two, get another. Add in any order, same result. There is a zero arrow. Every arrow has a negative. Multiplying by 1 does nothing. Multiplying by 0 gives zero. You can group the scalars. You can group the arrows. Most things we think of as 'arrows' are vector spaces. Most things that are not (a single point, a curve) are not.",
    prereqs: ["V2"],
    xp: 30,
    playground: "add-scale",
    questions: ["V3-q1"],
  },
  {
    id: "V4", phase: 2, order: 4,
    title: "Subspaces — Subsets Closed Under Add and Scale",
    short: "A line through the origin. A plane through the origin. The origin itself.",
    story: "A subspace is a piece of the vector space that contains the origin, and stays inside itself when you add or scale. Three examples: the whole space. A line through the origin. The origin itself (the zero-dimensional subspace). Two non-examples: a line NOT through the origin. A hollow circle. Neither stays inside itself when you scale.",
    prereqs: ["V3"],
    xp: 35,
    playground: "subspace",
    questions: ["V4-q1", "V4-q2"],
  },
  {
    id: "V5", phase: 2, order: 5,
    title: "Span — Everything You Can Reach",
    short: "All linear combinations of a set of arrows. The reachable set.",
    story: "Give me two arrows. The span is the set of EVERY arrow you can make by adding and scaling them. Two arrows that aren't parallel: span = the whole plane. Two parallel arrows: span = a single line. Three arrows in 2D: span = still the whole plane (one is redundant). One arrow: span = a line. The span is the universe those arrows can create.",
    prereqs: ["V4"],
    xp: 40,
    playground: "span",
    questions: ["V5-q1", "V5-q2"],
  },
  {
    id: "V6", phase: 2, order: 6,
    title: "Linear Independence — No Redundant Arrows",
    short: "No arrow in the set can be made from the others. Each one is doing new work.",
    story: "Two arrows in 2D that aren't parallel: independent. Two arrows in 2D that are parallel: one is a copy of the other — dependent. Three arrows in 2D: one is always redundant — dependent. A set is linearly independent if NO arrow in it can be written as a combination of the others. Independent = each arrow brings a new direction.",
    prereqs: ["V5"],
    xp: 45,
    playground: "independence",
    questions: ["V6-q1", "V6-q2"],
  },
  {
    id: "V7", phase: 2, order: 7,
    title: "Basis — The Minimum Set That Spans",
    short: "Independent AND spanning. The smallest set that covers the space.",
    story: "A basis is a set of arrows that is BOTH independent AND spans the whole space. In 2D: two non-parallel arrows. In 3D: three arrows, not all in the same plane. A basis is a coordinate system — every point in the space is a UNIQUE recipe of the basis arrows. The same point written in a different basis looks like a different recipe.",
    prereqs: ["V6"],
    xp: 50,
    playground: "basis",
    questions: ["V7-q1"],
  },
  {
    id: "V8", phase: 2, order: 8,
    title: "Dimension — How Many Basis Vectors",
    short: "The number you cannot change. Every basis of a space has the same size.",
    story: "Every basis of a vector space has the SAME number of vectors. This is the dimension. The number of coordinates you need to describe a point. The plane is 2D. Space is 3D. The line is 1D. The origin is 0D. Dimension is the most important invariant in linear algebra — it is what rank, nullity, and the rank-nullity theorem measure.",
    prereqs: ["V7"],
    xp: 55,
    playground: "dimension",
    questions: ["V8-q1", "V8-q2"],
  },

  // ════════════════════════════════════════════════════════════
  // PHASE 3 — LINEAR TRANSFORMATIONS
  // ════════════════════════════════════════════════════════════
  {
    id: "T1", phase: 3, order: 1,
    title: "What is a Transformation?",
    short: "A function between spaces. A point on the left, where does it land on the right?",
    story: "Take every point in the plane and move it somewhere. That is a transformation. Some transformations are simple (rotate by 90°). Some are wild (push the plane into a Möbius strip). Linear algebra studies the WELL-BEHAVED ones — the ones that preserve the grid structure.",
    prereqs: ["V8"],
    xp: 35,
    playground: "transformation",
    questions: ["T1-q1"],
    whyCare: "Every animation in a Pixar film, every CSS transform on a webpage, every screen rotation on your phone — all are linear transformations applied to the underlying 2D or 3D coordinates. The matrix is the recipe.",
    strang: "Strang §1.6 — the idea of a linear transformation. His key insight: 'linear' is the only kind of transformation that preserves the straight lines through the origin.",
  },
  {
    id: "T2", phase: 3, order: 2,
    title: "Why LINEAR Matters",
    short: "Linear transformations preserve add and scale. The grid stays a grid.",
    story: "A transformation T is linear if T(v + w) = T(v) + T(w) and T(cv) = cT(v). What does that mean visually? If you take the grid, the grid is preserved — every grid line goes to a (possibly different) grid line. Parallel lines stay parallel. The origin stays fixed. Everything else is non-linear.",
    prereqs: ["T1"],
    xp: 40,
    playground: "linear-matters",
    questions: ["T2-q1", "T2-q2"],
  },
  {
    id: "T2b", phase: 3, order: 7,
    title: "3D Transformations — Warping a House in Space",
    short: "The same idea, but in 3D. A matrix is a recipe for warping 3D space.",
    story: "You saw how a 2D matrix warps the plane. In 3D, the same idea: a 3x3 matrix is a recipe for warping 3D space. The columns of the matrix tell you where the basis vectors i, j, k go. Watch a 3D house get sheared, scaled, and rotated by dragging the matrix entries. The wireframe of the original (grey) is overlaid so you can see the deformation.",
    prereqs: ["T2"],
    xp: 45,
    playground: "transform-3d",
    questions: ["T2b-q1"],
  },
  {
    id: "T3", phase: 3, order: 3,
    title: "The Matrix of a Transformation",
    short: "Where does i-hat go? Where does j-hat go? Those two arrows ARE the matrix.",
    story: "Here is the moment everything clicks. Pick a basis (i-hat, j-hat). To know the entire linear transformation, you only need to know where those two basis arrows go. Write them as columns. That 2x2 array is THE MATRIX of the transformation. Apply the matrix to any vector = the transformation applied to that vector. Same thing.",
    prereqs: ["T2"],
    xp: 50,
    playground: "matrix-cols",
    questions: ["T3-q1", "T3-q2"],
  },
  {
    id: "T4", phase: 3, order: 4,
    title: "Null Space and Range Space",
    short: "What gets squashed to zero. What is reachable.",
    story: "The null space is everything that gets sent to zero by the transformation. The range space (or column space) is everything the transformation CAN produce. Both are subspaces. Both are central to understanding the transformation. For the matrix B = [[1,2],[2,4]], the null space is the line 2y + x = 0, the range is the line 2y + x = anything. The transformation collapses a dimension.",
    prereqs: ["T3"],
    xp: 50,
    playground: "null-range",
    questions: ["T4-q1", "T4-q2"],
  },
  {
    id: "T5", phase: 3, order: 5,
    title: "Rank-Nullity — The Most Important Equation",
    short: "dim(null) + dim(range) = dim(input). Always.",
    story: "This equation is the heartbeat of linear algebra. The dimension of what gets squashed plus the dimension of what survives equals the dimension of the space you started with. If you go from R⁴ to R⁴ and the null space is 1D, the range is 3D. If the null is 2D, the range is 2D. The transformation can ONLY destroy dimensions; it cannot create them.",
    prereqs: ["T4"],
    xp: 60,
    playground: "rank-nullity",
    questions: ["T5-q1", "T5-q2"],
  },
  {
    id: "T6", phase: 3, order: 6,
    title: "Isomorphisms — Same Shape, Different Name",
    short: "Two vector spaces are isomorphic if you can label one with the other's coordinates.",
    story: "If two vector spaces have the same dimension, they are the same 'shape' — just labeled differently. Polynomials of degree ≤ 2 form a 3D space (basis: 1, x, x²). R³ is also 3D. They are isomorphic. Any 2D vector space over R is isomorphic to R² itself. Dimension is all that matters for the structure.",
    prereqs: ["T5"],
    xp: 45,
    playground: "isomorphism",
    questions: ["T6-q1"],
  },
  {
    id: "T7", phase: 3, order: 7,
    title: "Composition = Matrix Multiplication",
    short: "Do T, then S = multiply their matrices. The order matters.",
    story: "Apply transformation A, then transformation B. The result is the same as one big transformation whose matrix is B * A (note the reversal). Matrix multiplication is FUNCTION COMPOSITION. The product is read right-to-left: B(A(v)). This is why matrix multiplication is NOT commutative — doing A then B is different from doing B then A.",
    prereqs: ["T6"],
    xp: 50,
    playground: "matrix-times-mat",
    questions: ["T7-q1", "T7-q2"],
  },
  {
    id: "T8", phase: 3, order: 8,
    title: "Inverse — The Undo Button",
    short: "The matrix that cancels another. Only exists if the transformation is one-to-one.",
    story: "The inverse matrix A⁻¹ undoes A: A * A⁻¹ = I. The undo button. But: only transformations that don't squash dimensions have an inverse. If det(A) = 0, no inverse exists — you cannot unscramble an egg. The inverse is found by row-reducing [A | I] to [I | A⁻¹].",
    prereqs: ["T7"],
    xp: 55,
    playground: "inverse",
    questions: ["T8-q1", "T8-q2"],
  },

  // ════════════════════════════════════════════════════════════
  // PHASE 4 — FOUR SUBSPACES & DUAL SPACE
  // ════════════════════════════════════════════════════════════
  {
    id: "F1", phase: 4, order: 1,
    title: "The Four Fundamental Subspaces",
    short: "Column, row, null, left-null. All four in one picture.",
    story: "For an m×n matrix A, there are four subspaces — and they come in TWO pairs. Column space C(A) ⊂ Rᵐ, paired with null space N(A) ⊂ Rⁿ, with C(A) ⊥ N(Aᵀ). Row space C(Aᵀ) ⊂ Rⁿ, paired with left-null space N(Aᵀ) ⊂ Rᵐ, with C(Aᵀ) ⊥ N(A). The whole structure of A lives in these four subspaces.",
    prereqs: ["T8"],
    xp: 60,
    playground: "four-subspaces",
    questions: ["F1-q1", "F1-q2"],
    whyCare: "The four subspaces are how Strang teaches the whole course — the fundamental theorem. They organize every algorithm: least squares projects onto the column space, the SVD reveals all four at once, and solving Ax=b becomes a coordinate computation in the four subspaces.",
    strang: "Strang §4.1 — the four fundamental subspaces. He calls this 'the most important picture in all of linear algebra'.",
  },
  {
    id: "F2", phase: 4, order: 2,
    title: "Row Space and Column Space",
    short: "Same dimension. Different homes.",
    story: "The row space is the span of the rows of A. The column space is the span of the columns. Crucial fact: they ALWAYS have the same dimension — the rank of A. They live in different spaces though — row space ⊂ Rⁿ, column space ⊂ Rᵐ. The row space of A = the column space of Aᵀ.",
    prereqs: ["F1"],
    xp: 55,
    playground: "row-col",
    questions: ["F2-q1"],
  },
  {
    id: "F3", phase: 4, order: 3,
    title: "Linear Functionals — Functions to a Number",
    short: "A linear function from a vector space to R. They eat vectors, spit out numbers.",
    story: "A linear functional is a linear map f: V → R. The dot product is the classic example: f(v) = v · w for some fixed w. Linear functionals are everywhere — they measure angles, projections, weighted sums, expected values. They are the most useful kind of linear transformation.",
    prereqs: ["F2"],
    xp: 55,
    playground: "functional",
    questions: ["F3-q1"],
  },
  {
    id: "F4", phase: 4, order: 4,
    title: "The Dual Space — All Functionals Form Their Own Space",
    short: "The set of all linear functionals on V is itself a vector space. V*.",
    story: "Add two functionals: (f + g)(v) = f(v) + g(v). Scale them: (cf)(v) = c·f(v). Zero functional: the function that maps everything to 0. The collection of ALL linear functionals on V forms a vector space, called V* (V-star, the dual space). V* is different from V — it has the same dimension but is a different kind of object.",
    prereqs: ["F3"],
    xp: 60,
    playground: "dual",
    questions: ["F4-q1"],
  },
  {
    id: "F5", phase: 4, order: 5,
    title: "Dual Basis",
    short: "Every basis of V has a partner basis of V*. Functionals that pick out one coordinate.",
    story: "Take a basis {v₁, ..., vₙ} of V. There is a UNIQUE basis {f₁, ..., fₙ} of V* such that fᵢ(vⱼ) = 1 if i = j, else 0. The functional f₁ eats any vector and returns its first coordinate (in the original basis). The dual basis is the bookkeeping system for the dual space.",
    prereqs: ["F4"],
    xp: 55,
    playground: "dual-basis",
    questions: ["F5-q1"],
  },
  {
    id: "F6", phase: 4, order: 6,
    title: "Annihilator — The Functionals That Vanish on a Subspace",
    short: "W° = the set of functionals that map every vector in W to 0.",
    story: "Take a subspace W of V. The annihilator W° is the set of all linear functionals on V that map every vector in W to zero. dim(W) + dim(W°) = dim(V). The annihilator of the column space is the left-null space. The annihilator of the null space is the row space. The four subspaces are two pairs of annihilators.",
    prereqs: ["F5"],
    xp: 65,
    playground: "annihilator",
    questions: ["F6-q1", "F6-q2"],
  },
  {
    id: "F7", phase: 4, order: 7,
    title: "Transpose of a Transformation (T → T*)",
    short: "T* acts on functionals, not on vectors. It's the 'other direction' of T.",
    story: "A linear map T: V → W. The transpose T*: W* → V* is defined by (T*f)(v) = f(Tv). It turns functionals on W into functionals on V. In matrix terms: if T has matrix A, then T* has matrix Aᵀ. The transpose is the abstract reason why the rows of a matrix matter as much as the columns.",
    prereqs: ["F6"],
    xp: 65,
    playground: "transpose",
    questions: ["F7-q1", "F7-q2"],
  },
  {
    id: "F8", phase: 4, order: 8,
    title: "The Double-Dual Theorem (V** = V)",
    short: "The dual of the dual is the original. Always.",
    story: "Take the dual space V*, then take ITS dual V**. For finite-dimensional spaces, V** is naturally isomorphic to V — there is a canonical map v → (f → f(v)). Every vector in V is exactly the set of functionals it 'equals' when tested. This is one of the deepest and most surprising facts in linear algebra.",
    prereqs: ["F7"],
    xp: 70,
    playground: "double-dual",
    questions: ["F8-q1"],
  },

  // ════════════════════════════════════════════════════════════
  // PHASE 5 — EIGENVALUES & EIGENVECTORS
  // ════════════════════════════════════════════════════════════
  {
    id: "E1", phase: 5, order: 1,
    title: "The Special Vectors That Don't Change Direction",
    short: "For some vectors, the transformation just stretches them, doesn't rotate.",
    story: "Apply a transformation to a vector. Usually the result points in a new direction. But for some magic vectors, the result is just a SCALED version of the original — same direction, different length. These are the eigenvectors. They are the transformation's 'preferred directions'. The student finds them by exploration: which input gives a collinear output?",
    prereqs: ["F8"],
    xp: 60,
    playground: "eigen-discover-v2",
    questions: ["E1-q1", "E1-q2"],
    whyCare: "Principal Component Analysis (PCA) finds the eigenvectors of the covariance matrix to find the directions your data varies most in. Google uses it to rank pages (PageRank). Quantum mechanics states are eigenvectors of the Hamiltonian operator.",
    strang: "Strang §6.1 — eigenvalues and eigenvectors. His geometric intuition: Ax = λx is the 'special direction' that doesn't change.",
  },
  {
    id: "E2", phase: 5, order: 2,
    title: "Eigenvalue — How Much It Stretched",
    short: "The magic number λ. λ > 1 stretches. 0 < λ < 1 squishes. λ < 0 flips.",
    story: "When the transformation acts on an eigenvector v, the result is λv. The number λ is the eigenvalue. It tells you HOW MUCH the eigenvector got scaled. λ = 2: stretched 2x. λ = 0.5: half its original length. λ = -1: same length, flipped 180°. λ = 0: squashed to nothing.",
    prereqs: ["E1"],
    xp: 55,
    playground: "eigenvalue",
    questions: ["E2-q1", "E2-q2"],
    whyCare: "Eigenvalues tell you the natural frequencies of a system. A vibrating bridge, a resonating circuit, a swinging pendulum — all are governed by the eigenvalues of the relevant matrix. They're what the world 'wants to do' on its own.",
    strang: "Strang §6.1 — the eigenvalue itself. He emphasizes the sign and magnitude: positive, negative, zero, complex. Each tells a different story about the transformation.",
  },
  {
    id: "E3", phase: 5, order: 3,
    title: "Characteristic Polynomial — Where Eigenvalues Come From",
    short: "det(A - λI) = 0. The equation whose roots are the eigenvalues.",
    story: "We want vectors v ≠ 0 with Av = λv, or (A - λI)v = 0. For non-zero v to exist, A - λI must be singular — its determinant must be 0. The polynomial det(A - λI) is the characteristic polynomial. Its roots are the eigenvalues. The degree of this polynomial is n, so there are (counting multiplicities) n eigenvalues.",
    prereqs: ["E2"],
    xp: 65,
    playground: "characteristic-2",
    questions: ["E3-q1"],
    whyCare: "The characteristic polynomial det(A - λI) is the master equation. Quantum mechanics lives here — the energy levels of an atom are the eigenvalues of the Hamiltonian. Google's PageRank solves the dominant eigenvector of the link graph.",
    strang: "Strang §6.2 — the characteristic equation. He calls it 'the most important equation in linear algebra applied to differential equations'.",
  },
  {
    id: "E4", phase: 5, order: 4,
    title: "Diagonalization — When A = PDP⁻¹",
    short: "Change of basis to where the matrix becomes a simple diagonal of eigenvalues.",
    story: "If A has n independent eigenvectors, put them as columns of a matrix P. Then A = PDP⁻¹ where D is diagonal with eigenvalues on the diagonal. In the eigenbasis, A acts by simply scaling each axis. This is the SIMPLEST form of A. Diagonalizable = n independent eigenvectors.",
    prereqs: ["E3"],
    xp: 70,
    playground: "diagonalize",
    questions: ["E4-q1", "E4-q2"],
    whyCare: "Diagonalization is what lets you compute A^1000000 instantly (raise the diagonal entries to the 1000000th power). Markov chains converge because the dominant eigenvalue is 1. Quantum mechanics is built on diagonalization of Hermitian matrices.",
    strang: "Strang §6.3 — diagonalization. He shows the 3-step ritual: snap to the eigenbasis, scale, snap back. A = XΛX⁻¹.",
  },
  {
    id: "E5", phase: 5, order: 5,
    title: "Cayley-Hamilton — Every Matrix Satisfies Its Own Characteristic Equation",
    short: "If p(λ) = det(λI - A), then p(A) = 0. The matrix is a root of its own polynomial.",
    story: "Take the characteristic polynomial p(λ) of A. Plug A into it. The result is the ZERO matrix. Every matrix satisfies its own characteristic equation. This is one of the most beautiful theorems in linear algebra — and it's used to compute matrix powers, inverses, and exponentials.",
    prereqs: ["E4"],
    xp: 70,
    playground: "cayley-hamilton",
    questions: ["E5-q1"],
    whyCare: "The Cayley-Hamilton theorem is how you compute matrix powers, inverses, and exponentials efficiently. The matrix exponential exp(At) is the foundation of every linear differential equation — the model of any system that evolves linearly in time (circuits, populations, mechanics).",
    strang: "Strang §6.4 — the Cayley-Hamilton theorem. He calls it 'the most remarkable theorem in linear algebra' — that a matrix satisfies its own characteristic polynomial.",
  },
  {
    id: "E6", phase: 5, order: 6,
    title: "The Minimal Polynomial",
    short: "The smallest-degree polynomial that the matrix satisfies.",
    story: "The Cayley-Hamilton polynomial is not always the simplest. The minimal polynomial is the polynomial m(λ) of smallest degree such that m(A) = 0. It always divides the characteristic polynomial. It tells you the smallest invariant subspace decomposition. Diagonalizable = minimal polynomial has no repeated roots.",
    prereqs: ["E5"],
    xp: 70,
    playground: "minimal-poly",
    questions: ["E6-q1"],
  },

  // ════════════════════════════════════════════════════════════
  // PHASE 6 — SVD & APPLICATIONS (the payoff)
  // ════════════════════════════════════════════════════════════
  {
    id: "S1", phase: 6, order: 1,
    title: "SVD — Every Matrix is Rotate-Scale-Rotate",
    short: "Any matrix can be written U Σ Vᵀ. Three simple pieces.",
    story: "Any m×n matrix A can be decomposed as A = U Σ Vᵀ, where U and V are rotations (orthogonal matrices) and Σ is a stretch along new axes. This is the Singular Value Decomposition. The 'trick' that powers image compression, recommendation systems, and dimensionality reduction. Every transformation in the plane is rotate, scale, rotate.",
    prereqs: ["E6"],
    xp: 80,
    playground: "svd-animate",
    questions: ["S1-q1", "S1-q2"],
    whyCare: "Every recommendation system (Netflix, Spotify, YouTube), every image compressor (JPEG, PNG), every dimensionality reduction (PCA), every recommender — they all start with SVD. Google ranks web pages by computing the dominant singular vectors of the link graph.",
    strang: "Strang §7.1 — the singular value decomposition. His clearest statement: 'Every matrix is a rotation, a scaling, a rotation.' He calls SVD 'the most important theorem in linear algebra'.",
  },
  {
    id: "S2", phase: 6, order: 2,
    title: "SVD Image Compression",
    short: "Compress a real image. Watch the rank-k approximation close in on the original.",
    story: "Take a grayscale image. It is a matrix. Compute SVD. The first singular value captures the most important direction of variation, the second the next, and so on. If you keep only the top k singular values, you get a rank-k approximation. For many images, k = 50 captures 95% of the visual information. This is how Instagram compresses your photos.",
    prereqs: ["S1"],
    xp: 85,
    playground: "svd-image",
    questions: ["S2-q1", "S2-q2"],
    whyCare: "Instagram compresses your photos with SVD. MRI scans use SVD to reconstruct images from incomplete data. Google's search rank uses SVD on the link matrix. The Netflix recommendation engine uses SVD on the user-movie matrix to find the 'principal tastes'.",
    strang: "Strang §7.1 — the singular value decomposition. He calls it 'the most important theorem in linear algebra'.",
  },
  {
    id: "S3", phase: 6, order: 3,
    title: "PCA — The Best Camera Angle for Your Data",
    short: "Principal Component Analysis. Find the direction of maximum variance.",
    story: "You have a cloud of points in 2D. You want to see the SHAPE of the cloud from the angle that shows the most variation. That direction is the first principal component — it is the eigenvector of the covariance matrix corresponding to the largest eigenvalue. The second principal component is perpendicular to it. PCA is what face unlock uses.",
    prereqs: ["S2"],
    xp: 80,
    playground: "pca",
    questions: ["S3-q1"],
    whyCare: "Face unlock on your phone uses PCA. The Eigenfaces algorithm represents every face as a combination of ~100 principal components. Genome analysis, financial risk modeling, and recommendation systems all use PCA.",
    strang: "Strang §7.3 — principal component analysis. He shows the geometric meaning: find the directions of maximum variance.",
  },
  {
    id: "S4", phase: 6, order: 4,
    title: "Least Squares — The Closest Point You Can Reach",
    short: "Ax = b has no answer. Find x that makes Ax as close to b as possible.",
    story: "You have a system Ax = b that has no exact solution. The closest you can get is the x* that MINIMIZES ||Ax* - b||². The answer: x* = (AᵀA)⁻¹ Aᵀ b. The pseudoinverse. Geometrically: b doesn't lie in the column space of A, so project b onto the column space, then solve A x* = projection. This is how every curve fit in science works.",
    prereqs: ["S3"],
    xp: 80,
    playground: "least-squares",
    questions: ["S4-q1", "S4-q2"],
    whyCare: "Every curve fit in science, every regression in economics, every calibration in engineering — they all solve least squares. GPS trilateration is least squares. The lines of best fit through your lab data are least squares. The pseudoinverse x = (AᵀA)⁻¹Aᵀb is the formula.",
    strang: "Strang §4.3 — least squares. He shows the geometric meaning: project b onto the column space of A. The error is perpendicular to the column space — that's the whole proof.",
  },
  {
    id: "S5", phase: 6, order: 5,
    title: "The Full Story — Real-World Payoffs",
    short: "Face recognition. PageRank. MRI. Quantum. Why this all matters.",
    story: "Hill cipher: encrypt text by multiplying by a matrix. PageRank: Google ranks pages by the dominant eigenvector of the link matrix. Face recognition: your face is a high-dimensional vector, projected to a low-dimensional PCA space, compared to the database. MRI: compressed sensing reconstructs images from incomplete data. Quantum: states are vectors, operations are unitary matrices. The world is linear algebra.",
    prereqs: ["S4"],
    xp: 100,
    playground: "pca",
    questions: ["S5-q1", "S5-q2"],
  },
];

// Build quick lookup
export const CONCEPT_BY_ID: Record<ConceptId, ConceptNode> =
  Object.fromEntries(CONCEPTS.map((c) => [c.id, c])) as Record<
    ConceptId,
    ConceptNode
  >;

// Single source of truth for the phase letter prefix (L, V, T, F, E, S).
// Used to group concepts by phase across the UI without duplicating the lookup.
export const PHASE_PREFIX: Record<Phase, string> = {
  1: "L",
  2: "V",
  3: "T",
  4: "F",
  5: "E",
  6: "S",
};

// Concepts belonging to a phase, precomputed once.
const CONCEPTS_BY_PHASE: Record<Phase, ConceptNode[]> = (() => {
  const map = {} as Record<Phase, ConceptNode[]>;
  for (const phase of [1, 2, 3, 4, 5, 6] as Phase[]) {
    map[phase] = CONCEPTS.filter((c) => c.phase === phase);
  }
  return map;
})();

export const getConceptsByPhase = (phase: Phase): ConceptNode[] =>
  CONCEPTS_BY_PHASE[phase];

export const isConceptId = (id: string): id is ConceptId =>
  Object.prototype.hasOwnProperty.call(CONCEPT_BY_ID, id);

// What's unlocked given current completion
export const getUnlocked = (completed: Set<ConceptId>): Set<ConceptId> => {
  const unlocked = new Set<ConceptId>();
  for (const c of CONCEPTS) {
    if (c.prereqs.length === 0) {
      unlocked.add(c.id);
      continue;
    }
    if (c.prereqs.every((p) => completed.has(p))) {
      unlocked.add(c.id);
    }
  }
  return unlocked;
};

export const isUnlocked = (
  id: ConceptId,
  completed: Set<ConceptId>,
): boolean => getUnlocked(completed).has(id);

// Linear walk through the curriculum. Returns the concept that
// naturally follows `id` in the reading order — same phase + next
// order, otherwise the first concept of the next phase. Returns null
// at the end of the journey (S5).
export function getNextConceptId(id: ConceptId): ConceptId | null {
  const cur = CONCEPT_BY_ID[id];
  if (!cur) return null;
  const samePhase = CONCEPTS_BY_PHASE[cur.phase];
  // Skip T2b in the linear flow — it's an aside inserted at order 7
  // that doesn't break the main chain (T6 → T7).
  const linearOrder = samePhase
    .filter((c) => c.id !== "T2b")
    .sort((a, b) => a.order - b.order);
  const idx = linearOrder.findIndex((c) => c.id === id);
  if (idx >= 0 && idx < linearOrder.length - 1) return linearOrder[idx + 1].id;
  const nextPhase = (cur.phase + 1) as Phase;
  if (nextPhase > 6) return null;
  const next = CONCEPTS_BY_PHASE[nextPhase];
  if (!next || next.length === 0) return null;
  return [...next].sort((a, b) => a.order - b.order)[0].id;
}

// Inverse of getNextConceptId. Walks backward through the curriculum,
// skipping T2b in the linear flow. Returns null at the start (L1).
export function getPrevConceptId(id: ConceptId): ConceptId | null {
  const cur = CONCEPT_BY_ID[id];
  if (!cur) return null;
  const prevPhase = (cur.phase - 1) as Phase;
  if (prevPhase >= 1) {
    const prev = CONCEPTS_BY_PHASE[prevPhase];
    if (prev && prev.length > 0) {
      return [...prev].sort((a, b) => a.order - b.order).slice(-1)[0].id;
    }
  }
  const samePhase = CONCEPTS_BY_PHASE[cur.phase];
  const linearOrder = samePhase
    .filter((c) => c.id !== "T2b")
    .sort((a, b) => a.order - b.order);
  const idx = linearOrder.findIndex((c) => c.id === id);
  if (idx > 0) return linearOrder[idx - 1].id;
  return null;
}
