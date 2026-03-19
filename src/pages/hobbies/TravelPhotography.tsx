import { Globe } from "@/components/globe/globe";
import { type Marker } from "cobe";

const MARKERS: Marker[] = [
  { location: [52.37, 4.9], size: 0.05 }, // Amsterdam
  { location: [48.85, 2.35], size: 0.05 }, // Paris
  { location: [51.51, -0.13], size: 0.05 }, // London
  { location: [41.9, 12.5], size: 0.05 }, // Rome
  { location: [40.42, -3.7], size: 0.05 }, // Madrid
  { location: [37.98, 23.73], size: 0.05 }, // Athens
  { location: [55.75, 37.62], size: 0.05 }, // Moscow
  { location: [35.69, 139.69], size: 0.05 }, // Tokyo
  { location: [1.35, 103.82], size: 0.05 }, // Singapore
  { location: [-33.87, 151.21], size: 0.05 }, // Sydney
  { location: [40.71, -74.01], size: 0.05 }, // New York
  { location: [34.05, -118.24], size: 0.05 }, // Los Angeles
  { location: [-22.9, -43.17], size: 0.05 }, // Rio
  { location: [19.43, -99.13], size: 0.05 }, // Mexico City
  { location: [30.04, 31.24], size: 0.05 }, // Cairo
  { location: [-26.2, 28.04], size: 0.05 }, // Johannesburg
];

export default function TravelPhotography() {
  return <Globe markers={MARKERS} />;
}
