import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

import Home from "@/pages/Home.tsx";
import Music from "@/pages/hobbies/Music.tsx";
import Movies from "@/pages/hobbies/Movies.tsx";
import TravelPhotography from "@/pages/hobbies/TravelPhotography.tsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/music" element={<Music />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/travel-photography" element={<TravelPhotography />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
