"use client";
import { useEffect, useRef, useState } from "react";
import type { BusinessRequest } from "@/lib/business-navigation";
export default function MobileNavigation({ onNavigate }: { onNavigate:(request:BusinessRequest) => void }) {
  const [open,setOpen] = useState(false), toggle = useRef<HTMLButtonElement>(null), panel = useRef<HTMLElement>(null);
  function close(restore = false) { setOpen(false); if (restore) toggle.current?.focus({preventScroll:true}); }
  useEffect(() => {
    if (!open) return;
    const escape = (event:KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); close(true); } };
    const outside = (event:PointerEvent) => { if (!panel.current?.contains(event.target as Node) && !toggle.current?.contains(event.target as Node)) close(); };
    const resize = () => { if (window.innerWidth > 960) close(true); };
    document.addEventListener("keydown",escape); document.addEventListener("pointerdown",outside); window.addEventListener("resize",resize);
    return () => { document.removeEventListener("keydown",escape); document.removeEventListener("pointerdown",outside); window.removeEventListener("resize",resize); };
  },[open]);
  const studio = (request:BusinessRequest) => { close(true); onNavigate(request); };
  return <div className="mobile-navigation"><button className="menu-toggle" ref={toggle} type="button" aria-expanded={open} aria-controls="mobile-navigation-panel" onClick={() => setOpen(previous => !previous)}>{open ? "Close menu" : "Menu"}<span aria-hidden="true">{open ? "×" : "+"}</span></button>
    <nav className="mobile-menu" id="mobile-navigation-panel" ref={panel} hidden={!open} aria-label="Mobile primary" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node) && event.relatedTarget !== toggle.current) close(); }}><a href="#websites" onClick={() => close(true)}>Expertise</a><a href="#immersive" onClick={() => close(true)}>Experiences</a><button type="button" aria-haspopup="dialog" onClick={() => studio({view:"services"})}>Services</button><button type="button" aria-haspopup="dialog" onClick={() => studio({view:"portfolio"})}>Concept work</button><button type="button" aria-haspopup="dialog" onClick={() => studio({view:"voice"})}>Try the voice demo</button><a href="/services" onClick={() => close(true)}>Read about our services ↗</a><a href="#contact" onClick={() => close(true)}>Let’s talk ↗</a></nav>
  </div>;
}
