"use client";
import { useEffect, useState } from "react";
export function ReadingProgress({ className }: { className?: string }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      const article = document.getElementById("article-body");
      if (!article) return;
      const top = article.getBoundingClientRect().top + window.scrollY;
      const distance = Math.max(
        1,
        article.offsetHeight - window.innerHeight + 100,
      );
      setProgress(
        Math.min(
          100,
          Math.max(0, ((window.scrollY - top + 100) / distance) * 100),
        ),
      );
    };
    const scroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", scroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", scroll);
    };
  }, []);
  return (
    <div aria-hidden="true" className={className}>
      <div className="fixed top-0 left-0 right-0 h-0.5 z-50 bg-transparent">
        <div className="h-full bg-lime-200" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
export default ReadingProgress;
