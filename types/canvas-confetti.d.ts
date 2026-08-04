declare module "canvas-confetti" {
  interface Options {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    origin?: { x?: number; y?: number };
    colors?: string[];
    shapes?: string[];
    scalar?: number;
    zIndex?: number;
    disableForReducedMotion?: boolean;
  }

  function confetti(
    options?: Options | ((canvas: HTMLCanvasElement) => Options),
  ): Promise<unknown>;
  function create(
    canvas: HTMLCanvasElement,
    options?: {
      resize?: boolean;
      useWorker?: boolean;
      disableForReducedMotion?: boolean;
    },
  ): {
    (options?: Options): Promise<unknown>;
    reset: () => void;
  };
  const defaults: Options;

  export default confetti;
}