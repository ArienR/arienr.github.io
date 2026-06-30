import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { IconArrowLeft } from "@tabler/icons-react";
import {
  fetchLetterboxdData,
  readCachedLetterboxdData,
  writeCachedLetterboxdData,
} from "./movies/api";
import { formatRatingStars, formatWatchedAgo } from "./movies/formatters";
import type { LetterboxdData } from "./movies/types";

export default function Movies() {
  const navigate = useNavigate();
  const [data, setData] = useState<LetterboxdData | null>(() =>
    readCachedLetterboxdData(),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data) return;

    fetchLetterboxdData()
      .then((fresh) => {
        writeCachedLetterboxdData(fresh);
        setData(fresh);
      })
      .catch(() => setError("Failed to load Letterboxd data."));
  }, [data]);

  const movies = data?.entries.slice(0, 4) ?? [];

  return (
    <div className="min-h-screen flex items-center justify-center py-16">
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4 lg:left-[calc(20%+1rem)] z-[45] text-foreground/70 hover:text-foreground"
        onClick={() => navigate(-1)}
      >
        <IconArrowLeft />
        Back
      </Button>
      <section className="container max-w-5xl text-left">
        <h1 className="font-bold text-4xl mb-2">Movies</h1>
        <p className="text-muted-foreground mb-8">What have I been watching?</p>

        {error && <p className="text-destructive">{error}</p>}

        {!data && !error && <p className="text-muted-foreground">Loading...</p>}

        {data && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {movies.map((movie) => (
              <a
                key={movie.tmdbId}
                href={movie.letterboxdUrl}
                target="_blank"
                rel="noreferrer"
                className="group flex flex-col"
              >
                <div className="overflow-hidden rounded-lg border border-border">
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    className="w-full object-cover transition-opacity group-hover:opacity-75"
                  />
                </div>
                <div className="mt-2">
                  <p className="font-medium text-sm leading-snug">
                    {movie.rating && (
                      <span className="text-muted-foreground">
                        {" "}
                        {formatRatingStars(movie.rating)}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatWatchedAgo(movie.watchedDate)}
                  </p>
                </div>
              </a>
            ))}
          </div>
        )}

        <div className="mt-8">
          <a
            href="https://letterboxd.com/arienr/"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            My Letterboxd
          </a>
        </div>
      </section>
    </div>
  );
}
