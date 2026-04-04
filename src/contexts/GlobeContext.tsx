import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";

type GlobeMode = "mini" | "full";

type MiniTransform = { S: number; ox: number; oy: number };

type GlobeContextValue = {
  mode: GlobeMode;
  wrapperStyle: CSSProperties;
  interactive: boolean;
  isGlobeTransitioning: boolean;
  onMarkerClick: ((id: string) => void) | undefined;
  setMode: (mode: GlobeMode) => void;
  setOnMarkerClick: (cb: ((id: string) => void) | undefined) => void;
};

// ---------------------------------------------------------------------------
// Compute the transform-origin (in Globe-wrapper local px coordinates) and
// scale factor so that scale(S) keeps the sphere's visual center pinned at
// (vw - CORNER_OFFSET, vh - CORNER_OFFSET) in viewport space.
//
// MINI_CORNER_OFFSET is the distance from the bottom-right corner to the
// globe's visual centre. Values below MINI_RADIUS mean the globe is partially
// clipped by the screen edge (intentional — the globe peeks out of the corner).
//
// The Globe wrapper is max(vw,vh) × max(vw,vh), centered in the viewport:
//   left_w = (vw - size) / 2    (negative when portrait)
//   top_w  = (vh - size) / 2    (negative when landscape)
//
// For scale(S) with transform-origin (ox, oy) to fix the sphere center at
// target = (vw - CORNER_OFFSET, vh - CORNER_OFFSET):
//
//   target_vx = left_w + ox + S * (size/2 - ox)   →   ox = (target_vx - left_w - S*size/2) / (1 - S)
//
// Substituting target_vx - left_w = (vw - CORNER_OFFSET) - (vw-size)/2 and S*size/2 = RADIUS:
//   ox = (vw/2 + size/2 - CORNER_OFFSET - RADIUS) / (1 - S)
// ---------------------------------------------------------------------------
export const MINI_CORNER_OFFSET = 140; // px — distance from corner to globe centre
export const MINI_RADIUS = 160; // px — matches w-80/2 on the click target
export const GLOBE_TRANSITION_DURATION = 450;

function computeMiniTransform(): MiniTransform {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const size = Math.max(vw, vh);
  const S = (MINI_RADIUS * 2) / size;
  const ox = (vw / 2 + size / 2 - MINI_CORNER_OFFSET - MINI_RADIUS) / (1 - S);
  const oy = (vh / 2 + size / 2 - MINI_CORNER_OFFSET - MINI_RADIUS) / (1 - S);
  return { S, ox, oy };
}

function buildWrapperStyle(mode: GlobeMode, t: MiniTransform): CSSProperties {
  const shared: CSSProperties = {
    transformOrigin: `${t.ox}px ${t.oy}px`,
    overflow: "hidden",
    transition:
      "transform 900ms cubic-bezier(0.35, 0, 0.1, 1), border-radius 600ms 900ms cubic-bezier(0.35, 0, 0.1, 1)",
    pointerEvents: "none",
  };
  if (mode === "mini") {
    return {
      ...shared,
      transform: `scale(${t.S})`,
      borderRadius: "50%",
      zIndex: 50,
    };
  }
  return {
    ...shared,
    transform: "scale(1)",
    borderRadius: "0%",
    zIndex: 0,
  };
}

const GlobeContext = createContext<GlobeContextValue | null>(null);

export function GlobeProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  const [mode, setModeState] = useState<GlobeMode>(
    pathname === "/travel-photography" ? "full" : "mini",
  );
  const [onMarkerClick, setOnMarkerClickState] = useState<
    ((id: string) => void) | undefined
  >(undefined);

  // Recompute mini transform on mount and resize
  const [miniTransform, setMiniTransform] =
    useState<MiniTransform>(computeMiniTransform);

  useEffect(() => {
    function handleResize() {
      setMiniTransform(computeMiniTransform());
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const wrapperStyle = useMemo(
    () => buildWrapperStyle(mode, miniTransform),
    [mode, miniTransform],
  );

  // Track mode transitions so pages can fade in/out in sync with the globe.
  const [isGlobeTransitioning, setIsGlobeTransitioning] = useState(false);
  const prevModeRef = useRef(mode);
  useEffect(() => {
    if (prevModeRef.current === mode) return;
    prevModeRef.current = mode;
    setIsGlobeTransitioning(true);
    const t = setTimeout(
      () => setIsGlobeTransitioning(false),
      GLOBE_TRANSITION_DURATION,
    );
    return () => clearTimeout(t);
  }, [mode]);

  // Prevent React from treating the callback as state (avoids wrapping in array)
  const setOnMarkerClick = useCallback(
    (cb: ((id: string) => void) | undefined) => {
      setOnMarkerClickState(() => cb);
    },
    [],
  );

  // Stable setMode ref so effects can depend on it without re-running
  const setModeRef = useRef(setModeState);
  setModeRef.current = setModeState;
  const setMode = useCallback((m: GlobeMode) => setModeRef.current(m), []);

  const value = useMemo<GlobeContextValue>(
    () => ({
      mode,
      wrapperStyle,
      interactive: mode === "full",
      isGlobeTransitioning,
      onMarkerClick,
      setMode,
      setOnMarkerClick,
    }),
    [
      mode,
      wrapperStyle,
      isGlobeTransitioning,
      onMarkerClick,
      setMode,
      setOnMarkerClick,
    ],
  );

  return (
    <GlobeContext.Provider value={value}>{children}</GlobeContext.Provider>
  );
}

export function useGlobeContext(): GlobeContextValue {
  const ctx = useContext(GlobeContext);
  if (!ctx)
    throw new Error("useGlobeContext must be used inside GlobeProvider");
  return ctx;
}
