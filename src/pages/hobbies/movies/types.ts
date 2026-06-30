export type MovieEntry = {
  title: string;
  year: string;
  rating: string;
  watchedDate: string;
  letterboxdUrl: string;
  poster: string;
  tmdbId: string;
};

export type LetterboxdData = {
  entries: MovieEntry[];
};
