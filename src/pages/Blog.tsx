import { useEffect } from "react";

import { useGlobeContext } from "@/contexts/GlobeContext";

export default function Blog() {
  const { setMode } = useGlobeContext();

  useEffect(() => {
    setMode("mini");
  }, [setMode]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4 text-center">
      <p className="text-muted-foreground italic">Nothing to say...</p>
    </main>
  );
}
