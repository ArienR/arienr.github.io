import createGlobe, { type COBEOptions, type Marker } from "cobe";
import { useEffect, useRef } from "react";

const SCALE_MIN = 0.2;
const SCALE_MAX = 2;

type GlobeProps = {
  markers?: Marker[];
  onMarkerClick?: (id: string) => void;
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
  onMarkerClick,
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
  const dragDistRef = useRef(0);

  // Pinch-to-zoom tracking
  const pinchRef = useRef<{ id0: number; id1: number; dist: number } | null>(
    null,
  );

  // Keep callback in a ref so the stale-closure inside useEffect always sees
  // the latest version without needing to re-run the effect.
  const onMarkerClickRef = useRef(onMarkerClick);
  onMarkerClickRef.current = onMarkerClick;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 2;
    let animationId: number;

    // Use the actual CSS canvas size so COBE positions anchor divs correctly.
    // COBE derives CSS canvas size as width/devicePixelRatio — if we pass a
    // fixed BUFFER here instead of the real CSS size, anchor divs are placed
    // in a smaller coordinate space than the displayed canvas, shifting all
    // tooltips to the wrong position.
    let cssSize = canvas.getBoundingClientRect().width;

    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: cssSize * dpr,
      height: cssSize * dpr,
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

    const ro = new ResizeObserver(() => {
      cssSize = canvas!.getBoundingClientRect().width;
      globe.update({ width: cssSize * dpr, height: cssSize * dpr });
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
      dragDistRef.current = 0;
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
      dragDistRef.current += Math.hypot(dx, dy);
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

      const wasClick =
        isDraggingRef.current &&
        dragDistRef.current < 8 &&
        pinchRef.current === null;

      isDraggingRef.current = false;
      lastPointerRef.current = null;

      if (wasClick && onMarkerClickRef.current) {
        // COBE creates a 1px div per marker inside its wrapper with
        // `anchor-name: --cobe-{id}` set as an inline style. Find the
        // closest one within the hit radius and fire the callback.
        const wrapper = canvas?.parentElement;
        if (wrapper) {
          const HIT_RADIUS = 24;
          let closestId: string | null = null;
          let closestDist = Infinity;

          wrapper.querySelectorAll<HTMLDivElement>("div").forEach((div) => {
            const anchorName = div.style.getPropertyValue("anchor-name");
            if (!anchorName.startsWith("--cobe-")) return;
            const id = anchorName.slice("--cobe-".length);
            const rect = div.getBoundingClientRect();
            const dist = Math.hypot(
              e.clientX - rect.left,
              e.clientY - rect.top,
            );
            if (dist < HIT_RADIUS && dist < closestDist) {
              closestDist = dist;
              closestId = id;
            }
          });

          if (closestId !== null) onMarkerClickRef.current(closestId);
        }
      }
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

  // The wrapper must be a fixed, square div matching the canvas CSS dimensions.
  // COBE injects its own relative wrapper (width:100%;height:100%) around the
  // canvas to host 1px anchor divs for CSS anchor positioning. If the canvas
  // itself is `position:fixed`, it's out of normal flow and that COBE wrapper
  // collapses to 0×0 — breaking anchor div placement. By making the canvas
  // `absolute` inside our fixed square div, the COBE wrapper inherits the
  // correct max(vw,vh)×max(vw,vh) dimensions and anchor divs land in the right place.
  return (
    <div className="fixed top-[calc(50vh-max(50vw,50vh))] left-[calc(50vw-max(50vw,50vh))] w-[max(100vw,100vh)] h-[max(100vw,100vh)] pointer-events-none">
      <canvas
        ref={canvasRef}
        className="cursor-grab active:cursor-grabbing absolute inset-0 w-full h-full pointer-events-auto"
        style={{ contain: "layout paint size" }}
      />
    </div>
  );
}
