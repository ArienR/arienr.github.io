import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import "./App.css";

import Home from "@/pages/Home.tsx";
import Music from "@/pages/hobbies/Music.tsx";
import Movies from "@/pages/hobbies/Movies.tsx";
import TravelPhotography from "@/pages/hobbies/TravelPhotography.tsx";
import {
  GlobeProvider,
  useGlobeContext,
  MINI_CORNER_OFFSET,
  MINI_RADIUS,
  GLOBE_TRANSITION_DURATION,
} from "@/contexts/GlobeContext";
import { Globe } from "@/components/globe/globe";
import photosData from "@/data/photos.json";
import type { PhotosData } from "@/data/photos.types";
import { cn } from "@/lib/utils";

function GlobeOrchestrator() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const {
    mode,
    wrapperStyle,
    interactive,
    onMarkerClick,
    setMode,
    isGlobeTransitioning,
  } = useGlobeContext();
  const { locations } = photosData as unknown as PhotosData;
  const markers = locations.map(({ lat, lng, id }) => ({
    location: [lat, lng] as [number, number],
    size: 0.05,
    id,
  }));

  const [badgeVisible, setBadgeVisible] = useState(false);

  useEffect(() => {
    if (mode !== "mini") {
      setBadgeVisible(false);
      return;
    }
    const t = setTimeout(() => setBadgeVisible(true), 1000);
    return () => clearTimeout(t);
  }, [mode]);

  function handleMiniGlobeClick() {
    if (isGlobeTransitioning) return;
    setMode("full");
    setTimeout(
      () => navigate("/travel-photography"),
      GLOBE_TRANSITION_DURATION,
    );
  }

  return (
    <>
      <Globe
        markers={markers}
        onMarkerClick={onMarkerClick}
        interactive={interactive}
        wrapperStyle={wrapperStyle}
        className={mode === "mini" ? "hidden md:block" : undefined}
      />
      {/* "Click me" badge above the mini globe — mirrors the location badges in TravelPhotography */}
      <div
        className={cn(
          "fixed hidden md:flex flex-col items-center pointer-events-none z-[60]",
          "transition-opacity duration-300",
          badgeVisible ? "opacity-100" : "opacity-0",
        )}
        style={{
          bottom: MINI_CORNER_OFFSET + 100,
          right: MINI_CORNER_OFFSET,
          translate: "50% 0",
        }}
      >
        <div className="bg-foreground text-background px-2.5 py-1 text-xs font-medium whitespace-nowrap">
          Click me
        </div>
        <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-foreground" />
      </div>
      {/* Click target — visible on any page where the globe is mini */}
      {mode === "mini" && pathname !== "/travel-photography" && (
        <div
          className="fixed hidden md:block w-80 h-80 rounded-full z-[60] cursor-pointer"
          style={{ bottom: MINI_CORNER_OFFSET - MINI_RADIUS, right: MINI_CORNER_OFFSET - MINI_RADIUS }}
          onClick={handleMiniGlobeClick}
        />
      )}
    </>
  );
}

/** Wraps all page content so it fades in/out with globe transitions. */
function AppContent() {
  const { isGlobeTransitioning } = useGlobeContext();
  return (
    <div
      className={cn(
        "transition-opacity duration-300",
        isGlobeTransitioning && "opacity-0 pointer-events-none",
      )}
    >
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/music" element={<Music />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/travel-photography" element={<TravelPhotography />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <GlobeProvider>
        <GlobeOrchestrator />
        <AppContent />
      </GlobeProvider>
    </BrowserRouter>
  );
}

export default App;
