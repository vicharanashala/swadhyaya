"use client";
import dynamic from "next/dynamic";
import { ErrorBoundary } from "./ErrorBoundary";
import type { PlaygroundId } from "@/lib/curriculum";

// All playground components are code-split so the initial JS payload
// for a concept page stays small. Each dynamic import uses a loading
// skeleton that matches the surrounding chrome.
//
// Two heavy 3D playgrounds (Transform3DPlayground, Planes3DPlayground)
// are explicitly marked ssr: false — they touch WebGL which isn't
// available on the server.

const loading = (label = "Loading playground…") => (
  <div className="bg-card border border-line rounded-xl p-8 text-center text-dim text-sm">
    {label}
  </div>
);

const OneLinePlayground = dynamic(
  () => import("./OneLinePlayground").then((m) => m.OneLinePlayground),
  { loading: () => loading() },
);
const TwoLinesPlayground = dynamic(
  () => import("./TwoLinesPlayground").then((m) => m.TwoLinesPlayground),
  { loading: () => loading() },
);
const IntersectPlayground = dynamic(
  () => import("./IntersectPlayground").then((m) => m.IntersectPlayground),
  { loading: () => loading() },
);
const Planes3DPlayground = dynamic(
  () =>
    import("./Planes3DPlayground").then((m) => m.Planes3DPlayground),
  { ssr: false, loading: () => loading("Loading 3D…") },
);
const Transform3DPlayground = dynamic(
  () =>
    import("./Transform3DPlayground").then((m) => m.Transform3DPlayground),
  { ssr: false, loading: () => loading("Loading 3D…") },
);
const MatrixColumnsPlayground = dynamic(
  () =>
    import("./MatrixColumnsPlayground").then((m) => m.MatrixColumnsPlayground),
  { loading: () => loading() },
);
const MatrixTimesVectorPlayground = dynamic(
  () =>
    import("./MatrixTimesVectorPlayground").then(
      (m) => m.MatrixTimesVectorPlayground,
    ),
  { loading: () => loading() },
);
const RowOpsPlayground = dynamic(
  () => import("./RowOpsPlayground").then((m) => m.RowOpsPlayground),
  { loading: () => loading() },
);
const GaussianPlayground = dynamic(
  () => import("./GaussianPlayground").then((m) => m.GaussianPlayground),
  { loading: () => loading() },
);
const RREFPlayground2 = dynamic(
  () => import("./RREFPlayground2").then((m) => m.RREFPlayground2),
  { loading: () => loading() },
);
const HomogeneousPlayground = dynamic(
  () =>
    import("./HomogeneousPlayground").then((m) => m.HomogeneousPlayground),
  { loading: () => loading() },
);
const VectorArrowPlayground = dynamic(
  () =>
    import("./VectorArrowPlayground").then((m) => m.VectorArrowPlayground),
  { loading: () => loading() },
);
const AddScalePlayground = dynamic(
  () => import("./AddScalePlayground").then((m) => m.AddScalePlayground),
  { loading: () => loading() },
);
const LinearCombinationPlayground = dynamic(
  () =>
    import("./LinearCombinationPlayground").then(
      (m) => m.LinearCombinationPlayground,
    ),
  { loading: () => loading() },
);
const SpanPlayground = dynamic(
  () => import("./SpanPlayground").then((m) => m.SpanPlayground),
  { loading: () => loading() },
);
const SubspacePlayground = dynamic(
  () => import("./SubspacePlayground").then((m) => m.SubspacePlayground),
  { loading: () => loading() },
);
const IndependencePlayground2 = dynamic(
  () =>
    import("./IndependencePlayground2").then(
      (m) => m.IndependencePlayground2,
    ),
  { loading: () => loading() },
);
const BasisPlayground = dynamic(
  () => import("./BasisPlayground").then((m) => m.BasisPlayground),
  { loading: () => loading() },
);
const DimensionPlayground = dynamic(
  () =>
    import("./DimensionPlayground").then((m) => m.DimensionPlayground),
  { loading: () => loading() },
);
const TransformationPlayground = dynamic(
  () =>
    import("./TransformationPlayground").then(
      (m) => m.TransformationPlayground,
    ),
  { loading: () => loading() },
);
const LinearMattersPlayground = dynamic(
  () =>
    import("./LinearMattersPlayground").then(
      (m) => m.LinearMattersPlayground,
    ),
  { loading: () => loading() },
);
const NullRangePlayground2 = dynamic(
  () =>
    import("./NullRangePlayground2").then((m) => m.NullRangePlayground2),
  { loading: () => loading() },
);
const RankNullityPlayground = dynamic(
  () =>
    import("./RankNullityPlayground").then((m) => m.RankNullityPlayground),
  { loading: () => loading() },
);
const IsomorphismPlayground = dynamic(
  () =>
    import("./IsomorphismPlayground").then((m) => m.IsomorphismPlayground),
  { loading: () => loading() },
);
const FourSubspacesPlayground = dynamic(
  () =>
    import("./FourSubspacesPlayground").then(
      (m) => m.FourSubspacesPlayground,
    ),
  { loading: () => loading() },
);
const RowColPlayground = dynamic(
  () => import("./RowColPlayground").then((m) => m.RowColPlayground),
  { loading: () => loading() },
);
const FunctionalPlayground = dynamic(
  () => import("./FunctionalPlayground").then((m) => m.FunctionalPlayground),
  { loading: () => loading() },
);
const DualSpacePlayground = dynamic(
  () => import("./DualSpacePlayground").then((m) => m.DualSpacePlayground),
  { loading: () => loading() },
);
const DualBasisPlayground = dynamic(
  () =>
    import("./DualBasisPlayground").then((m) => m.DualBasisPlayground),
  { loading: () => loading() },
);
const AnnihilatorPlayground = dynamic(
  () =>
    import("./AnnihilatorPlayground").then((m) => m.AnnihilatorPlayground),
  { loading: () => loading() },
);
const TransposePlayground = dynamic(
  () => import("./TransposePlayground").then((m) => m.TransposePlayground),
  { loading: () => loading() },
);
const DoubleDualPlayground = dynamic(
  () =>
    import("./DoubleDualPlayground").then((m) => m.DoubleDualPlayground),
  { loading: () => loading() },
);
const EigenPlayground = dynamic(
  () => import("./EigenPlayground").then((m) => m.EigenPlayground),
  { loading: () => loading() },
);
const EigenDiscoverPlayground = dynamic(
  () =>
    import("./EigenDiscoverPlayground").then((m) => m.EigenDiscoverPlayground),
  { loading: () => loading() },
);
const CharacteristicPlayground2 = dynamic(
  () =>
    import("./CharacteristicPlayground2").then(
      (m) => m.CharacteristicPlayground2,
    ),
  { loading: () => loading() },
);
const CayleyHamiltonPlayground = dynamic(
  () =>
    import("./CayleyHamiltonPlayground").then(
      (m) => m.CayleyHamiltonPlayground,
    ),
  { loading: () => loading() },
);
const MinimalPolynomialPlayground = dynamic(
  () =>
    import("./MinimalPolynomialPlayground").then(
      (m) => m.MinimalPolynomialPlayground,
    ),
  { loading: () => loading() },
);
const SVDPlayground = dynamic(
  () => import("./SVDPlayground").then((m) => m.SVDPlayground),
  { loading: () => loading() },
);
const SVDImagePlayground = dynamic(
  () =>
    import("./SVDImagePlayground").then((m) => m.SVDImagePlayground),
  { loading: () => loading() },
);
const PCAPlayground = dynamic(
  () => import("./PCAPlayground").then((m) => m.PCAPlayground),
  { loading: () => loading() },
);
const LeastSquaresPlayground = dynamic(
  () =>
    import("./LeastSquaresPlayground").then((m) => m.LeastSquaresPlayground),
  { loading: () => loading() },
);
const QL1Q1Playground = dynamic(
  () => import("./QL1Q1Playground").then((m) => m.QL1Q1Playground),
  { loading: () => loading() },
);
const QL2Q1Playground = dynamic(
  () => import("./QL2Q1Playground").then((m) => m.QL2Q1Playground),
  { loading: () => loading() },
);
const QL2Q2Playground = dynamic(
  () => import("./QL2Q2Playground").then((m) => m.QL2Q2Playground),
  { loading: () => loading() },
);
const QL3Q1Playground = dynamic(
  () => import("./QL3Q1Playground").then((m) => m.QL3Q1Playground),
  { loading: () => loading() },
);
const QL4Q1Playground = dynamic(
  () => import("./QL4Q1Playground").then((m) => m.QL4Q1Playground),
  { loading: () => loading() },
);
const QL5Q1Playground = dynamic(
  () => import("./QL5Q1Playground").then((m) => m.QL5Q1Playground),
  { loading: () => loading() },
);
const QL6Q1Playground = dynamic(
  () => import("./QL6Q1Playground").then((m) => m.QL6Q1Playground),
  { loading: () => loading() },
);
const QL7Q1Playground = dynamic(
  () => import("./QL7Q1Playground").then((m) => m.QL7Q1Playground),
  { loading: () => loading() },
);
const QL8Q1Playground = dynamic(
  () => import("./QL8Q1Playground").then((m) => m.QL8Q1Playground),
  { loading: () => loading() },
);
const QV1Q1Playground = dynamic(
  () => import("./QV1Q1Playground").then((m) => m.QV1Q1Playground),
  { loading: () => loading() },
);
const QV2Q1Playground = dynamic(
  () => import("./QV2Q1Playground").then((m) => m.QV2Q1Playground),
  { loading: () => loading() },
);
const QV2Q2Playground = dynamic(
  () => import("./QV2Q2Playground").then((m) => m.QV2Q2Playground),
  { loading: () => loading() },
);
const QV4Q1Playground = dynamic(
  () => import("./QV4Q1Playground").then((m) => m.QV4Q1Playground),
  { loading: () => loading() },
);
const QV5Q1Playground = dynamic(
  () => import("./QV5Q1Playground").then((m) => m.QV5Q1Playground),
  { loading: () => loading() },
);
const QV6Q1Playground = dynamic(
  () => import("./QV6Q1Playground").then((m) => m.QV6Q1Playground),
  { loading: () => loading() },
);
const QV8Q1Playground = dynamic(
  () => import("./QV8Q1Playground").then((m) => m.QV8Q1Playground),
  { loading: () => loading() },
);
const QT2Q1Playground = dynamic(
  () => import("./QT2Q1Playground").then((m) => m.QT2Q1Playground),
  { loading: () => loading() },
);
const QT3Q1Playground = dynamic(
  () => import("./QT3Q1Playground").then((m) => m.QT3Q1Playground),
  { loading: () => loading() },
);
const QT4Q1Playground = dynamic(
  () => import("./QT4Q1Playground").then((m) => m.QT4Q1Playground),
  { loading: () => loading() },
);
const QT5Q1Playground = dynamic(
  () => import("./QT5Q1Playground").then((m) => m.QT5Q1Playground),
  { loading: () => loading() },
);
const QT7Q1Playground = dynamic(
  () => import("./QT7Q1Playground").then((m) => m.QT7Q1Playground),
  { loading: () => loading() },
);
const QT8Q1Playground = dynamic(
  () => import("./QT8Q1Playground").then((m) => m.QT8Q1Playground),
  { loading: () => loading() },
);
const QE1Q1Playground = dynamic(
  () => import("./QE1Q1Playground").then((m) => m.QE1Q1Playground),
  { loading: () => loading() },
);
const QE2Q1Playground = dynamic(
  () => import("./QE2Q1Playground").then((m) => m.QE2Q1Playground),
  { loading: () => loading() },
);
const QE3Q1Playground = dynamic(
  () => import("./QE3Q1Playground").then((m) => m.QE3Q1Playground),
  { loading: () => loading() },
);
const QS1Q1Playground = dynamic(
  () => import("./QS1Q1Playground").then((m) => m.QS1Q1Playground),
  { loading: () => loading() },
);
const QS2Q1Playground = dynamic(
  () => import("./QS2Q1Playground").then((m) => m.QS2Q1Playground),
  { loading: () => loading() },
);
const QS3Q1Playground = dynamic(
  () => import("./QS3Q1Playground").then((m) => m.QS3Q1Playground),
  { loading: () => loading() },
);
const QE5Q1Playground = dynamic(
  () => import("./QE5Q1Playground").then((m) => m.QE5Q1Playground),
  { loading: () => loading() },
);
const QV7Q1Playground = dynamic(
  () => import("./QV7Q1Playground").then((m) => m.QV7Q1Playground),
  { loading: () => loading() },
);
const QT1Q1Playground = dynamic(
  () => import("./QT1Q1Playground").then((m) => m.QT1Q1Playground),
  { loading: () => loading() },
);
const QF1Q1Playground = dynamic(
  () => import("./QF1Q1Playground").then((m) => m.QF1Q1Playground),
  { loading: () => loading() },
);
const QS4Q1Playground = dynamic(
  () => import("./QS4Q1Playground").then((m) => m.QS4Q1Playground),
  { loading: () => loading() },
);
const QE4Q1Playground = dynamic(
  () => import("./QE4Q1Playground").then((m) => m.QE4Q1Playground),
  { loading: () => loading() },
);

// Legacy aliases — old curriculum IDs that all point to the same component.
const legacyAliases: Record<string, React.ComponentType> = {
  "matrix-times-vec": MatrixTimesVectorPlayground,
  "matrix-times-mat": MatrixColumnsPlayground,
  "big-four": MatrixColumnsPlayground,
  determinant: MatrixColumnsPlayground,
  inverse: MatrixColumnsPlayground,
  rank: MatrixColumnsPlayground,
};

// Type-safe wrapper: only look up IDs that aren't in the canonical switch.
const legacyIds = new Set(Object.keys(legacyAliases));
const isLegacyId = (id: PlaygroundId): boolean => legacyIds.has(id);

export function Playground({ id }: { id: PlaygroundId }) {
  const component = isLegacyId(id)
    ? legacyAliases[id]
    : resolveComponent(id);

  if (!component) {
    return (
      <div className="bg-card border border-line rounded-xl p-8 text-center text-dim">
        Playground for <code className="text-accent">{id}</code> is being built.
      </div>
    );
  }

  const Comp = component;
  return (
    <ErrorBoundary fallbackTitle={`Playground ${id} crashed`}>
      <Comp />
    </ErrorBoundary>
  );
}

function resolveComponent(
  id: PlaygroundId,
): React.ComponentType | undefined {
  // Legacy IDs are routed separately; only the canonical IDs reach here.
  if (isLegacyId(id)) return undefined;
  switch (id) {
    // Phase 1
    case "lines-2d-one":
      return OneLinePlayground;
    case "lines-2d-two":
      return TwoLinesPlayground;
    case "intersect":
      return IntersectPlayground;
    case "planes-3d":
      return Planes3DPlayground;
    case "matrix-times-vec":
      return MatrixTimesVectorPlayground;
    case "row-ops":
      return RowOpsPlayground;
    case "gaussian":
      return GaussianPlayground;
    case "rref":
      return RREFPlayground2;
    case "homogeneous":
      return HomogeneousPlayground;

    // Phase 2
    case "vector-arrow":
      return VectorArrowPlayground;
    case "add-scale":
      return AddScalePlayground;
    case "linear-combination":
      return LinearCombinationPlayground;
    case "span":
      return SpanPlayground;
    case "subspace":
      return SubspacePlayground;
    case "independence":
      return IndependencePlayground2;
    case "basis":
      return BasisPlayground;
    case "dimension":
      return DimensionPlayground;

    // Phase 3
    case "transformation":
      return TransformationPlayground;
    case "linear-matters":
      return LinearMattersPlayground;
    case "transform-3d":
      return Transform3DPlayground;
    case "matrix-cols":
      return MatrixColumnsPlayground;
    case "null-range":
      return NullRangePlayground2;
    case "rank-nullity":
      return RankNullityPlayground;
    case "isomorphism":
      return IsomorphismPlayground;

    // Phase 4
    case "four-subspaces":
      return FourSubspacesPlayground;
    case "row-col":
      return RowColPlayground;
    case "functional":
      return FunctionalPlayground;
    case "dual":
      return DualSpacePlayground;
    case "dual-basis":
      return DualBasisPlayground;
    case "annihilator":
      return AnnihilatorPlayground;
    case "transpose":
      return TransposePlayground;
    case "double-dual":
      return DoubleDualPlayground;

    // Phase 5
    case "eigen-discover":
    case "eigenvalue":
    case "characteristic":
    case "diagonalize":
      return EigenPlayground;
    case "eigen-discover-v2":
      return EigenDiscoverPlayground;
    case "characteristic-2":
      return CharacteristicPlayground2;
    case "cayley-hamilton":
      return CayleyHamiltonPlayground;
    case "minimal-poly":
      return MinimalPolynomialPlayground;

    // Phase 6
    case "svd-animate":
      return SVDPlayground;
    case "svd-image":
      return SVDImagePlayground;
    case "pca":
      return PCAPlayground;
    case "least-squares":
      return LeastSquaresPlayground;

    // Question-specific
    case "q-L1-q1":
      return QL1Q1Playground;
    case "q-L2-q1":
      return QL2Q1Playground;
    case "q-L2-q2":
      return QL2Q2Playground;
    case "q-L3-q1":
      return QL3Q1Playground;
    case "q-L4-q1":
      return QL4Q1Playground;
    case "q-L5-q1":
      return QL5Q1Playground;
    case "q-L6-q1":
      return QL6Q1Playground;
    case "q-L7-q1":
      return QL7Q1Playground;
    case "q-L8-q1":
      return QL8Q1Playground;
    case "q-V1-q1":
      return QV1Q1Playground;
    case "q-V2-q1":
      return QV2Q1Playground;
    case "q-V2-q2":
      return QV2Q2Playground;
    case "q-V4-q1":
      return QV4Q1Playground;
    case "q-V5-q1":
      return QV5Q1Playground;
    case "q-V6-q1":
      return QV6Q1Playground;
    case "q-V7-q1":
      return QV7Q1Playground;
    case "q-V8-q1":
      return QV8Q1Playground;
    case "q-T1-q1":
      return QT1Q1Playground;
    case "q-T2-q1":
      return QT2Q1Playground;
    case "q-T3-q1":
      return QT3Q1Playground;
    case "q-T4-q1":
      return QT4Q1Playground;
    case "q-T5-q1":
      return QT5Q1Playground;
    case "q-T7-q1":
      return QT7Q1Playground;
    case "q-T8-q1":
      return QT8Q1Playground;
    case "q-F1-q1":
      return QF1Q1Playground;
    case "q-E1-q1":
      return QE1Q1Playground;
    case "q-E2-q1":
      return QE2Q1Playground;
    case "q-E3-q1":
      return QE3Q1Playground;
    case "q-E4-q1":
      return QE4Q1Playground;
    case "q-E5-q1":
      return QE5Q1Playground;
    case "q-S1-q1":
      return QS1Q1Playground;
    case "q-S2-q1":
      return QS2Q1Playground;
    case "q-S3-q1":
      return QS3Q1Playground;
    case "q-S4-q1":
      return QS4Q1Playground;

    // Legacy aliases — handled in `legacyAliases` above; not reachable here.
    case "matrix-times-mat":
    case "big-four":
    case "determinant":
    case "inverse":
    case "rank":
      return undefined;
  }
}