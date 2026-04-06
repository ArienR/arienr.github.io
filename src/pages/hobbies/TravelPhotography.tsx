import {
  useState,
  useCallback,
  useEffect,
  useRef,
  type CSSProperties,
} from "react";
import { useNavigate } from "react-router-dom";
import photosData from "@/data/photos.json";
import type { LocationWithCount, Photo, PhotosData } from "@/data/photos.types";
import {
  Sheet,
  SheetClose,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Dialog as SheetPrimitive } from "radix-ui";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { IconArrowLeft, IconX } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import {
  useGlobeContext,
  GLOBE_TRANSITION_DURATION,
} from "@/contexts/GlobeContext";

export default function TravelPhotography() {
  const { locations, photos } = photosData as unknown as PhotosData;
  const { mode, setMode, setOnMarkerClick } = useGlobeContext();
  const navigate = useNavigate();

  // Capture mode at mount: if already "full" the globe is done expanding;
  // if "mini" it will start a GLOBE_TRANSITION_DURATION ms CSS transition.
  const initialModeRef = useRef(mode);
  const [markersVisible, setMarkersVisible] = useState(false);

  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    null,
  );
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [carouselStartIndex, setCarouselStartIndex] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  const photoCounts = photos.reduce<Record<string, number>>((acc, photo) => {
    acc[photo.location] = (acc[photo.location] ?? 0) + 1;
    return acc;
  }, {});

  const locationsWithCounts: LocationWithCount[] = locations.map((loc) => ({
    ...loc,
    photoCount: photoCounts[loc.id] ?? 0,
  }));

  const selectedLocation = locationsWithCounts.find(
    (l) => l.id === selectedLocationId,
  );
  const locationPhotos: Photo[] = photos.filter(
    (p) => p.location === selectedLocationId,
  );

  const handleMarkerClick = useCallback((id: string) => {
    setSelectedLocationId(id);
    setCarouselOpen(false);
  }, []);

  // Register with the shared Globe and restore mini mode on unmount.
  // If the globe was already in full mode (navigated via the globe click),
  // use a short settle delay. If it was mini, wait for the CSS transition.
  useEffect(() => {
    setMode("full");
    setOnMarkerClick(handleMarkerClick);
    const delay =
      initialModeRef.current === "full" ? 300 : GLOBE_TRANSITION_DURATION + 50;
    const t = setTimeout(() => setMarkersVisible(true), delay);
    return () => {
      clearTimeout(t);
      setMode("mini");
      setOnMarkerClick(undefined);
    };
  }, [setMode, setOnMarkerClick, handleMarkerClick]);

  const handleThumbnailClick = (index: number) => {
    setCarouselStartIndex(index);
    setCarouselOpen(true);
  };

  // Scroll carousel to the correct slide once the API is ready
  useEffect(() => {
    if (carouselApi && carouselOpen) {
      carouselApi.scrollTo(carouselStartIndex, true);
    }
  }, [carouselApi, carouselOpen, carouselStartIndex]);

  return (
    <>
      {/* Back button — shrinks globe first, then navigates */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4 z-[45] text-foreground/70 hover:text-foreground"
        onClick={() => {
          setMode("mini");
          setTimeout(() => navigate(-1), GLOBE_TRANSITION_DURATION);
        }}
      >
        <IconArrowLeft />
        Back
      </Button>

      {/* Marker badges */}
      {locationsWithCounts.map((loc) => {
        const countLabel =
          loc.photoCount === 1 ? "1 photo" : `${loc.photoCount} photos`;
        return (
          <div
            key={loc.id}
            className="fixed flex flex-col items-center pointer-events-none"
            style={
              {
                positionAnchor: `--cobe-${loc.id}`,
                bottom: "anchor(top)",
                left: "anchor(center)",
                translate: "-50% -20%",
                marginBottom: "10px",
                opacity: markersVisible
                  ? `var(--cobe-visible-${loc.id}, 0)`
                  : 0,
                transition: "opacity 0.2s ease",
              } as CSSProperties
            }
          >
            <div className="bg-foreground text-background px-2.5 py-1 text-xs font-medium whitespace-nowrap">
              {loc.label} · {countLabel}
            </div>
            <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-foreground" />
          </div>
        );
      })}

      {/* Sidebar — uses Sheet primitives directly so the overlay can be made
          pointer-events-none, keeping the globe fully interactive. */}
      <Sheet
        modal={false}
        open={selectedLocationId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedLocationId(null);
            setCarouselOpen(false);
          }
        }}
      >
        <SheetPrimitive.Portal>
          {/* Transparent, non-blocking overlay — lets clicks pass to the globe */}
          <SheetPrimitive.Overlay className="fixed inset-0 z-40 pointer-events-none" />

          <SheetPrimitive.Content
            data-slot="sheet-content"
            data-side="right"
            onPointerDownOutside={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => {
              if (carouselOpen) {
                e.preventDefault();
                setCarouselOpen(false);
              }
            }}
            className={cn(
              "fixed z-40 inset-y-0 right-0 flex flex-col",
              "w-72 border-l border-border bg-background/95 backdrop-blur-sm",
              "shadow-xl transition duration-200 ease-in-out",
              "data-open:animate-in data-open:slide-in-from-right-10 data-open:fade-in-0",
              "data-closed:animate-out data-closed:slide-out-to-right-10 data-closed:fade-out-0",
            )}
          >
            <SheetHeader className="p-4 pb-3 border-b border-border">
              <SheetTitle className="pr-8">
                {selectedLocation?.label ?? ""}
              </SheetTitle>
              <SheetClose asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="absolute top-3 right-3"
                >
                  <IconX />
                  <span className="sr-only">Close</span>
                </Button>
              </SheetClose>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-3">
              {locationPhotos.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-10">
                  No photos yet
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {locationPhotos.map((photo, i) => (
                    <button
                      key={photo.src}
                      onClick={() => handleThumbnailClick(i)}
                      className="aspect-square overflow-hidden rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <img
                        src={`${import.meta.env.BASE_URL}${photo.src}`}
                        alt={photo.alt}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </SheetPrimitive.Content>
        </SheetPrimitive.Portal>
      </Sheet>

      {/* Carousel overlay — blurs the rest of the page */}
      {carouselOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCarouselOpen(false);
          }}
        >
          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute top-4 right-4 text-foreground/70 hover:text-foreground"
            onClick={() => setCarouselOpen(false)}
          >
            <IconX />
            <span className="sr-only">Close</span>
          </Button>

          <Carousel
            className="w-full max-w-4xl px-16"
            setApi={setCarouselApi}
            opts={{ startIndex: carouselStartIndex }}
            key={`${selectedLocationId}-${carouselStartIndex}`}
          >
            <CarouselContent>
              {locationPhotos.map((photo) => (
                <CarouselItem
                  key={photo.src}
                  className="flex items-center justify-center"
                >
                  <img
                    src={`${import.meta.env.BASE_URL}${photo.src}`}
                    alt={photo.alt}
                    className="max-h-[80vh] max-w-full object-contain select-none"
                    draggable={false}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      )}
    </>
  );
}
