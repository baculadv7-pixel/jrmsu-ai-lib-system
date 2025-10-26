import { useEffect, useMemo, useState } from "react";

export type ViewportMode = "desktop" | "tablet" | "mobile";

export function getViewportMode(w: number): ViewportMode {
  if (w >= 1024) return "desktop";
  if (w >= 768) return "tablet";
  return "mobile";
}

export function useViewportMode(debounceMs = 150) {
  const [width, setWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1280);

  useEffect(() => {
    let raf = 0;
    let t: any = null;
    const onResize = () => {
      if (t) clearTimeout(t);
      t = setTimeout(() => {
        raf = requestAnimationFrame(() => setWidth(window.innerWidth));
      }, debounceMs);
    };
    window.addEventListener('resize', onResize, { passive: true } as any);
    return () => { if (t) clearTimeout(t); cancelAnimationFrame(raf); window.removeEventListener('resize', onResize as any); };
  }, [debounceMs]);

  const mode = useMemo(() => getViewportMode(width), [width]);
  return mode;
}
