"use client";

import { useEffect, useState } from "react";

export function useMediaQuery(query: string) {
  const [value, setValue] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const media = window.matchMedia(query);
    setValue(media.matches);

    const listener = (e: MediaQueryListEvent) => setValue(e.matches);
    media.addEventListener("change", listener);

    return () => media.removeEventListener("change", listener);
  }, [query]);

  // Return false during SSR to avoid hydration mismatch
  if (!mounted) return false;

  return value;
}
