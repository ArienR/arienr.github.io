import { Link } from "react-router-dom";

export default function PhotographyTravel() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <section className="container w-3xl text-left">
        <h1 className="font-bold text-4xl mb-4">Photography & Travelling</h1>
        <p>Where have I taken photos? Where have I travelled?</p>
        <div className="mt-6">
          <Link to="/" className="underline">
            Back
          </Link>
        </div>
      </section>
    </div>
  );
}
