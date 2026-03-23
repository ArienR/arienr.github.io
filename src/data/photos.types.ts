export type Photo = {
  src: string;
  location: string;
  alt: string;
};

export type Location = {
  id: string;
  label: string;
  lat: number;
  lng: number;
};

export type LocationWithCount = Location & {
  photoCount: number;
};

export type PhotosData = {
  locations: Location[];
  photos: Photo[];
};
