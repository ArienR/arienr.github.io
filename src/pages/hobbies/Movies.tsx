import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { IconArrowLeft } from "@tabler/icons-react";

const WORKER_URL = "https://media-api.arien.workers.dev/letterboxd";
const CACHE_KEY = "letterboxd_data";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

type MovieEntry = {
  title: string;
  year: string;
  rating: string;
  watchedDate: string;
  letterboxdUrl: string;
  poster: string;
  tmdbId: string;
};

type LetterboxdData = {
  entries: MovieEntry[];
};

type CachedEntry = { data: LetterboxdData; cachedAt: number };

function readCache(): LetterboxdData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, cachedAt } = JSON.parse(raw) as CachedEntry;
    if (Date.now() - cachedAt > CACHE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

function writeCache(data: LetterboxdData) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ data, cachedAt: Date.now() }),
    );
  } catch {
    // localStorage unavailable — skip silently
  }
}

function toStars(rating: string): string {
  const val = parseFloat(rating);
  if (isNaN(val)) return "";
  const full = Math.floor(val);
  const half = val % 1 >= 0.5;
  return "★".repeat(full) + (half ? "½" : "");
}

export default function Movies() {
  const navigate = useNavigate();
  const [data, setData] = useState<LetterboxdData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = readCache();
    if (cached) {
      setData(cached);
      return;
    }

    fetch(WORKER_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json() as Promise<LetterboxdData>;
      })
      .then((fresh) => {
        writeCache(fresh);
        setData(fresh);
      })
      .catch(() => setError("Failed to load Letterboxd data."));
  }, []);

  const movies = data?.entries.slice(0, 4) ?? [];

  return (
    <div className="min-h-screen flex items-center justify-center py-16 md:pb-[160px]">
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4 z-[45] text-foreground/70 hover:text-foreground"
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
                    {movie.title}
                    {movie.rating && (
                      <span className="text-muted-foreground">
                        {" "}
                        • {toStars(movie.rating)}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{movie.year}</p>
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
