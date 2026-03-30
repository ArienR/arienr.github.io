import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useGlobeContext } from "@/contexts/GlobeContext";
import { cn } from "@/lib/utils";

export default function Home() {
  const { setMode } = useGlobeContext();
  const navigate = useNavigate();
  const [fading, setFading] = useState(false);

  useEffect(() => {
    setMode("mini");
  }, [setMode]);

  function handleGlobeClick() {
    setFading(true);
    setMode("full");
    setTimeout(() => navigate("/travel-photography"), 600);
  }

  return (
    <>
      <div
        className={cn(
          "min-h-screen flex flex-col items-center justify-center transition-opacity duration-300",
          fading && "opacity-0 pointer-events-none",
        )}
      >
        <section className="container w-3xl text-left">
          <h1 className="font-bold text-6xl mb-6 pointer-events-none">
            I'm Arien
          </h1>
          <TooltipProvider>
            <div id="home-description">
              <span>Software engineer — I love </span>
              <Tooltip key="music">
                <TooltipTrigger asChild>
                  <Link to="/music" className="text-chart-3 underline">
                    music
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>What have I been listening to?</p>
                </TooltipContent>
              </Tooltip>
              <span>, </span>
              <Tooltip key="movies">
                <TooltipTrigger asChild>
                  <Link to="/movies" className="text-chart-3 underline">
                    movies
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {/* FIXME: Letterboxd embed */}
                  <p>What have I been watching?</p>
                </TooltipContent>
              </Tooltip>
              <span>, </span>
              <Tooltip key="travel-photography">
                <TooltipTrigger asChild>
                  <Link
                    to="/travel-photography"
                    className="text-chart-3 underline"
                  >
                    photography, and travelling
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom" color="grey">
                  <p>Where have I taken photos?</p>
                </TooltipContent>
              </Tooltip>
              <span>.</span>
            </div>
          </TooltipProvider>
        </section>
      </div>

      {/* Transparent click target that precisely overlays the mini globe */}
      {!fading && (
        <div
          className="fixed bottom-4 right-4 w-64 h-64 rounded-full z-[60] cursor-pointer"
          onClick={handleGlobeClick}
        />
      )}
    </>
  );
}
