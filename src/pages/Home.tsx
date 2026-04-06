import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useGlobeContext } from "@/contexts/GlobeContext";

export default function Home() {
  const { setMode } = useGlobeContext();

  useEffect(() => {
    setMode("mini");
  }, [setMode]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center md:pb-[160px]">
      <section className="container max-w-3xl px-4 sm:px-8 text-left">
        <h1 className="font-bold text-6xl mb-6 pointer-events-none">
          I'm Arien
        </h1>
        <TooltipProvider>
          <div id="home-description">
            <span>Software engineer — I love </span>
            <Tooltip key="coding">
              <TooltipTrigger asChild>
                <a
                  href="https://github.com/arienr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-chart-3 underline"
                >
                  coding
                </a>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>What have I been coding?</p>
              </TooltipContent>
            </Tooltip>
            <span>, </span>
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
  );
}
