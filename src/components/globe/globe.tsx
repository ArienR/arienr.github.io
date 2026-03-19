import createGlobe, { type COBEOptions, type Marker } from "cobe";
import { useEffect, useRef } from "react";

// Fixed canvas buffer — large enough for quality at any CSS display size
const BUFFER = 1000;
const SCALE_MIN = 0.4;
const SCALE_MAX = 5;

type GlobeProps = {
  markers?: Marker[];
} & Partial<
  Pick<
    COBEOptions,
    | "baseColor"
    | "markerColor"
    | "glowColor"
    | "diffuse"
    | "mapBrightness"
    | "mapBaseBrightness"
    | "theta"
  >
>;

export function Globe({
  markers = [],
  baseColor = [0.8, 0.35, 0.08],
  markerColor = [0.9, 0.3, 0.05],
  glowColor = [0.9, 0.4, 0.1],
  diffuse = 1.8,
  mapBrightness = 4,
  mapBaseBrightness = 0.02,
  theta: initialTheta = 0.3,
}: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // All mutable state in refs — no re-renders needed
  const phiRef = useRef(0);
  const thetaRef = useRef(initialTheta);
  const scaleRef = useRef(0.65);
  const isDraggingRef = useRef(false);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const velocityRef = useRef({ phi: 0, theta: 0 });

  // Pinch-to-zoom tracking
  const pinchRef = useRef<{ id0: number; id1: number; dist: number } | null>(
    null,
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 2;
    let animationId: number;

    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: BUFFER * dpr,
      height: BUFFER * dpr,
      phi: phiRef.current,
      theta: thetaRef.current,
      dark: -1,
      diffuse,
      mapSamples: 16000,
      mapBrightness,
      mapBaseBrightness,
      baseColor,
      markerColor,
      glowColor,
      opacity: 0.75,
      scale: scaleRef.current,
      markers,
    });

    function clampTheta(v: number) {
      return Math.max(-Math.PI / 3, Math.min(Math.PI / 3, v));
    }

    function animate() {
      if (!isDraggingRef.current) {
        velocityRef.current.phi *= 0.95;
        velocityRef.current.theta *= 0.95;
        phiRef.current += velocityRef.current.phi + 0.003;
        thetaRef.current = clampTheta(
          thetaRef.current + velocityRef.current.theta,
        );
      }

      globe.update({
        phi: phiRef.current,
        theta: thetaRef.current,
        scale: scaleRef.current,
      });
      animationId = requestAnimationFrame(animate);
    }
    animate();

    // Cache canvas CSS size — updated on resize to avoid getBoundingClientRect per move
    let cssSize = canvas.getBoundingClientRect().width;
    const ro = new ResizeObserver(() => {
      cssSize = canvas!.getBoundingClientRect().width;
    });
    ro.observe(canvas);

    // Track active pointers for both drag and pinch
    const activePointers = new Map<number, PointerEvent>();

    function onPointerDown(e: PointerEvent) {
      activePointers.set(e.pointerId, e);
      if (activePointers.size === 2) {
        // Two fingers — switch to pinch, cancel drag
        const pts = [...activePointers.values()];
        const dist = Math.hypot(
          pts[0].clientX - pts[1].clientX,
          pts[0].clientY - pts[1].clientY,
        );
        const [id0, id1] = [...activePointers.keys()];
        pinchRef.current = { id0, id1, dist };
        isDraggingRef.current = false;
        lastPointerRef.current = null;
        return;
      }
      if (pinchRef.current) return;
      isDraggingRef.current = true;
      velocityRef.current = { phi: 0, theta: 0 };
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      canvas!.setPointerCapture(e.pointerId);
    }

    function onPointerMove(e: PointerEvent) {
      activePointers.set(e.pointerId, e);
      const pinch = pinchRef.current;
      if (pinch) {
        const pts = [...activePointers.values()];
        const newDist = Math.hypot(
          pts[0].clientX - pts[1].clientX,
          pts[0].clientY - pts[1].clientY,
        );
        if (newDist === 0) return;
        const factor = newDist / pinch.dist;
        scaleRef.current = Math.max(
          SCALE_MIN,
          Math.min(SCALE_MAX, scaleRef.current * factor),
        );
        pinchRef.current = { ...pinch, dist: newDist };
        return;
      }
      if (!isDraggingRef.current || !lastPointerRef.current) return;
      const dx = e.clientX - lastPointerRef.current.x;
      const dy = e.clientY - lastPointerRef.current.y;
      // Normalize by cached CSS size so drag speed is display-size-independent
      const dPhi = (dx / cssSize) * Math.PI * 1.5;
      const dTheta = (dy / cssSize) * Math.PI;
      phiRef.current += dPhi;
      thetaRef.current = clampTheta(thetaRef.current + dTheta);
      velocityRef.current = { phi: dPhi, theta: dTheta };
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
    }

    function onPointerUp(e: PointerEvent) {
      activePointers.delete(e.pointerId);
      if (activePointers.size < 2) pinchRef.current = null;
      isDraggingRef.current = false;
      lastPointerRef.current = null;
    }

    // --- Scroll-wheel zoom ---
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      // Normalize across different deltaMode values
      const normalized =
        e.deltaMode === 1
          ? e.deltaY * 20
          : e.deltaMode === 2
            ? e.deltaY * 400
            : e.deltaY;
      const factor = 1 - normalized * 0.001;
      scaleRef.current = Math.max(
        SCALE_MIN,
        Math.min(SCALE_MAX, scaleRef.current * factor),
      );
    }

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(animationId);
      globe.destroy();
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="cursor-grab active:cursor-grabbing fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[max(100vw,100vh)] h-[max(100vw,100vh)]"
      style={{ contain: "layout paint size" }}
    />
  );
}
