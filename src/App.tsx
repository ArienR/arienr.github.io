import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

import Home from "@/pages/Home.tsx";
import Music from "@/pages/hobbies/Music.tsx";
import Movies from "@/pages/hobbies/Movies.tsx";
import TravelPhotography from "@/pages/hobbies/TravelPhotography.tsx";
import { GlobeProvider, useGlobeContext } from "@/contexts/GlobeContext";
import { Globe } from "@/components/globe/globe";
import photosData from "@/data/photos.json";
import type { PhotosData } from "@/data/photos.types";

function GlobeOrchestrator() {
  const { wrapperStyle, interactive, onMarkerClick } = useGlobeContext();
  const { locations } = photosData as unknown as PhotosData;
  const markers = locations.map(({ lat, lng, id }) => ({
    location: [lat, lng] as [number, number],
    size: 0.05,
    id,
  }));
  return (
    <Globe
      markers={markers}
      onMarkerClick={onMarkerClick}
      interactive={interactive}
      wrapperStyle={wrapperStyle}
    />
  );
}

function App() {
  return (
    <BrowserRouter>
      <GlobeProvider>
        <GlobeOrchestrator />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/music" element={<Music />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/travel-photography" element={<TravelPhotography />} />
        </Routes>
      </GlobeProvider>
    </BrowserRouter>
  );
}

export default App;
