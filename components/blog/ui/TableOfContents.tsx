"use client";
import { useEffect, useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { TableOfContentsItem } from "@/lib/blog/types";

export function TableOfContents({
  items,
  className = "",
}: {
  items: TableOfContentsItem[];
  className?: string;
}) {
  const [activeId, setActiveId] = useState("");
  const [expanded, setExpanded] = useState(true);
  const id = useId();
  useEffect(() => {
    let frame = 0;
    const update = () => {
      let current = items[0]?.id || "";
      for (const item of items) {
        const heading = document.getElementById(item.id);
        if (heading && heading.getBoundingClientRect().top <= 145)
          current = item.id;
      }
      setActiveId(current);
    };
    const scroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", scroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scroll);
    };
  }, [items]);
  if (!items.length) return null;
  return (
    <nav aria-label="Table of contents" className={`journal-toc ${className}`}>
      <button
        aria-expanded={expanded}
        aria-controls={id}
        onClick={() => setExpanded(!expanded)}
      >
        Table of Contents{" "}
        <ChevronDown
          size={15}
          aria-hidden="true"
          style={{ transform: expanded ? "rotate(0deg)" : "rotate(-90deg)" }}
        />
      </button>
      <ol id={id} hidden={!expanded}>
        {items.map((item) => (
          <li
            key={item.id}
            style={{ paddingLeft: Math.max(0, item.level - 2) * 12 }}
          >
            <a
              href={`#${item.id}`}
              aria-current={activeId === item.id ? "location" : undefined}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
export default TableOfContents;
