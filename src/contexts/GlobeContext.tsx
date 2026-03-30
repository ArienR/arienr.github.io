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
  onMarkerClick: ((id: string) => void) | undefined;
  setMode: (mode: GlobeMode) => void;
  setOnMarkerClick: (cb: ((id: string) => void) | undefined) => void;
};

// ---------------------------------------------------------------------------
// Compute the transform-origin (in Globe-wrapper local px coordinates) and
// scale factor so that scale(S) keeps the sphere's visual center pinned at
// (vw - MARGIN - RADIUS, vh - MARGIN - RADIUS) in viewport space.
//
// The Globe wrapper is max(vw,vh) × max(vw,vh), centered in the viewport:
//   left_w = (vw - size) / 2    (negative when portrait)
//   top_w  = (vh - size) / 2    (negative when landscape)
//
// For scale(S) with transform-origin (ox, oy) to fix the sphere center at
// target = (vw - MARGIN - RADIUS, vh - MARGIN - RADIUS):
//
//   target_vx = left_w + ox + S * (size/2 - ox)   →   ox = (target_vx - left_w - S*size/2) / (1 - S)
//
// Simplifying target_vx - left_w = (vw - MARGIN - RADIUS) - (vw-size)/2:
//   ox = (vw/2 - MARGIN - 2*RADIUS + size/2) / (1 - S)
// ---------------------------------------------------------------------------
const MARGIN = 16; // 1rem in px
const RADIUS = 128; // 8rem in px — visual circle radius (was 64)

function computeMiniTransform(): MiniTransform {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const size = Math.max(vw, vh);
  const S = (RADIUS * 2) / size;
  const ox = (vw / 2 - MARGIN - 2 * RADIUS + size / 2) / (1 - S);
  const oy = (vh / 2 - MARGIN - 2 * RADIUS + size / 2) / (1 - S);
  return { S, ox, oy };
}

function buildWrapperStyle(
  mode: GlobeMode,
  t: MiniTransform,
): CSSProperties {
  const shared: CSSProperties = {
    transformOrigin: `${t.ox}px ${t.oy}px`,
    overflow: "hidden",
    transition:
      "transform 900ms cubic-bezier(0.35, 0, 0.1, 1), border-radius 600ms cubic-bezier(0.4, 0, 0.2, 1)",
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
  const [miniTransform, setMiniTransform] = useState<MiniTransform>(
    computeMiniTransform,
  );

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
      onMarkerClick,
      setMode,
      setOnMarkerClick,
    }),
    [mode, wrapperStyle, onMarkerClick, setMode, setOnMarkerClick],
  );

  return (
    <GlobeContext.Provider value={value}>{children}</GlobeContext.Provider>
  );
}

export function useGlobeContext(): GlobeContextValue {
  const ctx = useContext(GlobeContext);
  if (!ctx) throw new Error("useGlobeContext must be used inside GlobeProvider");
  return ctx;
}
