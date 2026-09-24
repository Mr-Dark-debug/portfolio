"use client";

import { useEffect, useRef } from "react";

export default function StudioDialog({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<Element | null>(null);
  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement;
    const panel = panelRef.current;
    panel?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const focusable = [...panel.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((node) => !node.hasAttribute("disabled") && node.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.removeEventListener("keydown", trap);
      if (previousFocus.current instanceof HTMLElement) previousFocus.current.focus();
    };
  }, [open, onClose]);
  if (!open) return null;
  return <div className="studio-modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="studio-modal" ref={panelRef} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}><div className="studio-panel-header"><h2>{title}</h2><button className="studio-icon-button" type="button" aria-label={`Close ${title}`} onClick={onClose}>×</button></div>{children}</div></div>;
}
