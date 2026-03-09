import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center">
      <section className="container w-3xl mx-auto text-left">
        <h1 className="font-semibold text-6xl mb-6 pointer-events-none">
          I'm Arien
        </h1>
        <TooltipProvider>
          <div id="home-description">
            <span>Software engineer — I love </span>
            <Tooltip key="bottom">
              <TooltipTrigger asChild>
                <span className="text-muted-foreground mb-8 underline cursor-pointer">
                  music
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>What have I been listening to?</p>
              </TooltipContent>
            </Tooltip>
            <span>, </span>
            <Tooltip key="bottom">
              <TooltipTrigger asChild>
                <span className="text-muted-foreground mb-8 underline cursor-pointer">
                  movies
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {/* FIXME: Letterboxd embed */}
                <p>What have I been watching?</p>
              </TooltipContent>
            </Tooltip>
            <span>, </span>
            <Tooltip key="bottom">
              <TooltipTrigger asChild>
                <span className="text-muted-foreground mb-8 underline cursor-pointer">
                  photography, and travelling
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" color="grey">
                <p>Where have I taken photos?</p>
              </TooltipContent>
            </Tooltip>
            <span>.</span>
          </div>
        </TooltipProvider>
      </section>
      <div>
        <Button>See more</Button>
      </div>
    </div>
  );
}
