"use client";
import { useEffect, useState } from "react";

// Start static during SSR/hydration, and react to preference changes immediately.
export function useReducedMotion() {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}
