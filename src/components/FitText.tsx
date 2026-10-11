import { useLayoutEffect, useRef } from "react";

/* Shrinks its text until the longest word fits the box (no word ever spills past the edge). */
export function FitText({ text, max, min = 12, className = "" }: { text: string; max: number; min?: number; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      let size = max;
      el.style.fontSize = size + "px";
      while (size > min && el.scrollWidth > el.clientWidth + 1) { size -= 1; el.style.fontSize = size + "px"; }
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el.parentElement || el);
    (document as any).fonts?.ready?.then(fit);
    return () => ro.disconnect();
  }, [text, max, min]);
  return <b ref={ref} className={"fit " + className}>{text}</b>;
}
