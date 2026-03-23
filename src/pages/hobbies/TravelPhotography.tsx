import { Globe } from "@/components/globe/globe";
import photosData from "@/data/photos.json";
import type { LocationWithCount, PhotosData } from "@/data/photos.types";
import type { Marker } from "cobe";

export default function TravelPhotography() {
  const { locations, photos } = photosData as unknown as PhotosData;

  const photoCounts = photos.reduce<Record<string, number>>((acc, photo) => {
    acc[photo.location] = (acc[photo.location] ?? 0) + 1;
    return acc;
  }, {});

  const locationsWithCounts: LocationWithCount[] = locations.map((loc) => ({
    ...loc,
    photoCount: photoCounts[loc.id] ?? 0,
  }));

  const markers: Marker[] = locationsWithCounts.map(({ lat, lng, id }) => ({
    location: [lat, lng] as [number, number],
    size: 0.05,
    id,
  }));

  return (
    <>
      <Globe markers={markers} />
      {locationsWithCounts.map((loc) => {
        const countLabel = loc.photoCount === 1 ? "1 photo" : `${loc.photoCount} photos`;
        return (
          <div
            key={loc.id}
            className="fixed flex flex-col items-center pointer-events-none"
            style={{
              // CSS Anchor Positioning — COBE creates a 1px div with
              // `anchor-name: --cobe-{id}` and tracks it to the marker each frame.
              // These three lines attach this badge to that anchor:
              positionAnchor: `--cobe-${loc.id}`,
              bottom: "anchor(top)",
              left: "anchor(center)",
              translate: "-50% -20%",
              marginBottom: "10px",
              // --cobe-visible-{id} is set to "N" by COBE when visible, unset when
              // hidden. "N" is invalid for opacity, so CSS falls back to the initial
              // value of 1. When unset, the fallback 0 hides the badge.
              opacity: `var(--cobe-visible-${loc.id}, 0)`,
              transition: "opacity 0.2s ease",
            } as React.CSSProperties}
          >
            <div className="bg-foreground text-background px-2.5 py-1 text-xs font-medium whitespace-nowrap">
              {loc.label} · {countLabel}
            </div>
            <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-foreground" />
          </div>
        );
      })}
    </>
  );
}
