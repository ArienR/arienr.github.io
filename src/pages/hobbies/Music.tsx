import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const WORKER_URL = "https://spotify-worker.arien-spotify-worker.workers.dev";
const CACHE_KEY = "spotify_data";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

type CachedEntry = { data: SpotifyData; cachedAt: number };

function readCache(): SpotifyData | null {
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

function writeCache(data: SpotifyData) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ data, cachedAt: Date.now() }),
    );
  } catch {
    // localStorage unavailable (private browsing, quota exceeded) — skip silently
  }
}

type SpotifyImage = {
  url: string;
  height: number;
  width: number;
};

type Artist = {
  id: string;
  name: string;
  images: SpotifyImage[];
  external_urls: { spotify: string };
};

type TrackArtist = {
  id: string;
  name: string;
};

type Track = {
  id: string;
  name: string;
  artists: TrackArtist[];
  album: {
    name: string;
    images: SpotifyImage[];
  };
  external_urls: { spotify: string };
};

type SpotifyData = {
  artists: Artist[];
  tracks: Track[];
};

export default function Music() {
  const [data, setData] = useState<SpotifyData | null>(null);
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
        return res.json() as Promise<SpotifyData>;
      })
      .then((fresh) => {
        writeCache(fresh);
        setData(fresh);
      })
      .catch(() => setError("Failed to load Spotify data."));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center py-16">
      <section className="container max-w-5xl text-left">
        <h1 className="font-bold text-4xl mb-2">Music</h1>
        <p className="text-muted-foreground mb-8">
          What have I been listening to?
        </p>

        {error && <p className="text-destructive">{error}</p>}

        {!data && !error && <p className="text-muted-foreground">Loading...</p>}

        {data && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="font-semibold text-xl mb-3">Top Artists</h2>
              <div className="flex flex-col divide-y divide-border rounded-lg border border-border overflow-hidden">
                {data.artists.map((artist) => (
                  <div
                    key={artist.id}
                    className="flex items-center justify-between px-4 py-3 bg-card hover:bg-muted/50 transition-colors"
                  >
                    <a
                      href={artist.external_urls.spotify}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium hover:underline"
                    >
                      {artist.name}
                    </a>
                    {artist.images[2] && (
                      <img
                        src={artist.images[2].url}
                        alt={artist.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-semibold text-xl mb-3">Top Tracks</h2>
              <div className="flex flex-col divide-y divide-border rounded-lg border border-border overflow-hidden">
                {data.tracks.map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center justify-between px-4 py-3 bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="min-w-0 mr-4">
                      <a
                        href={track.external_urls.spotify}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium hover:underline block truncate"
                      >
                        {track.name}
                      </a>
                      <p className="text-sm text-muted-foreground truncate">
                        {track.artists.map((a) => a.name).join(", ")}
                      </p>
                    </div>
                    {track.album.images[2] && (
                      <img
                        src={track.album.images[2].url}
                        alt={track.album.name}
                        className="w-10 h-10 rounded object-cover shrink-0"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-8">
          <Link to="/" className="underline">
            Back
          </Link>
        </div>
      </section>
    </div>
  );
}
