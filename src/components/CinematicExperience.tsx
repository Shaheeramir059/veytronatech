"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SCENES } from "@/lib/scenes";
import { getJourneyStage } from "@/lib/journey";
import { copyPose, titleFitScale } from "@/lib/typography-motion";
import { mark, measure } from "@/lib/profile";
import BusinessDialog from "./BusinessDialog";
import MobileNavigation from "./MobileNavigation";
import { SCENE_BUSINESS_ACTIONS, type BusinessRequest } from "@/lib/business-navigation";

const World = dynamic(() => {
  mark("world-import-start");
  return import("./World").then(module => {
    mark("world-import-end"); measure("world-code-load", "world-import-start", "world-import-end");
    return module;
  });
}, { ssr: false });

class WorldBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return reduced;
}

function useWebGL() {
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    try {
      // Do not create and destroy an extra GPU context just to probe support.
      // Actual renderer construction is protected by WorldBoundary.
      setSupported(typeof window.WebGL2RenderingContext !== "undefined");
    } catch {
      setSupported(false);
    }
  }, []);
  return supported;
}

export default function CinematicExperience() {
  const progress = useRef(0);
  const [active, setActive] = useState(0);
  const progressBar = useRef<HTMLSpanElement>(null);
  const reducedMotion = useReducedMotion();
  const webgl = useWebGL();
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [delayed, setDelayed] = useState(false);
  const [business, setBusiness] = useState<BusinessRequest | null>(null);
  const onReady = useCallback(() => setReady(true), []);
  const onFailure = useCallback(() => setFailed(true), []);
  useEffect(() => { setReady(false); setFailed(false); }, [reducedMotion]);
  useEffect(() => {
    mark("html-hydrated");
    const timeout = window.setTimeout(() => setDelayed(true), 700);
    // Request fonts after hydration, preserving immediate system-font content.
    const frame = requestAnimationFrame(() => {
      if (document.getElementById("studio-fonts")) return;
      const link = document.createElement("link");
      link.id = "studio-fonts"; link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap";
      link.onload = () => { void document.fonts.ready.then(() => ScrollTrigger.refresh()); };
      document.head.appendChild(link);
    });
    return () => { clearTimeout(timeout); cancelAnimationFrame(frame); };
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const sections = SCENES.map(scene => document.getElementById(scene.id)!);
    const motionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
    let stops: number[] = [];
    const copies = sections.map(section => section.querySelector<HTMLElement>(".story-inner")!);
    let layouts: { top: number; height: number }[] = [];
    const refreshStops = () => {
      // Reset only during refresh, before measuring fonts/resize/zoom. Never
      // measure transformed rectangles in the scroll callback.
      copies.forEach(copy => { copy.style.removeProperty("--copy-shift"); copy.style.removeProperty("--title-scale"); });
      const fits = copies.map(copy => {
        const title = copy.querySelector<HTMLElement>(".story-title")!;
        const width = Math.max(...Array.from(title.children, line => (line as HTMLElement).scrollWidth));
        return titleFitScale(title.clientWidth, width);
      });
      copies.forEach((copy, index) => copy.style.setProperty("--title-scale", String(fits[index])));
      layouts = copies.map(copy => ({ top: copy.getBoundingClientRect().top + window.scrollY, height: copy.offsetHeight }));
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      stops = sections.map(section => Math.min(section.offsetTop, maxScroll));
    };
    refreshStops();
    const syncProgress = () => {
      const stage = getJourneyStage(window.scrollY, stops);
      progress.current = stage;
      copies.forEach((copy, index) => {
        const layout = layouts[index];
        const pose = copyPose(stage, index, window.scrollY, layout.top, layout.height, window.innerHeight, window.innerWidth <= 760, motionMedia.matches);
        copy.style.setProperty("--copy-shift", `${pose.shift}px`);
        copy.style.setProperty("--copy-opacity", String(pose.opacity));
        copy.style.pointerEvents = pose.interactive ? "" : "none";
      });
      if (progressBar.current) progressBar.current.style.transform = `scaleY(${stage / (SCENES.length - 1)})`;
      setActive(Math.min(SCENES.length - 1, Math.floor(stage + 0.5)));
    };
    const trigger = ScrollTrigger.create({
      trigger: "#journey",
      start: "top top",
      end: "bottom bottom",
      invalidateOnRefresh: true,
      onUpdate: syncProgress,
      onRefresh: () => { refreshStops(); syncProgress(); },
    });
    const refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh());
    const refreshMotion = () => ScrollTrigger.refresh();
    motionMedia.addEventListener("change", refreshMotion);
    // Opacity leaves the semantic document and its tab order intact. Keyboard
    // focus on a later CTA brings its section into the same readable slot.
    const focusCopy = (event: FocusEvent) => {
      const index = copies.findIndex(copy => copy.contains(event.target as Node));
      const available = window.innerHeight - (window.innerWidth <= 760 ? 176 : 198);
      if (index >= 0 && !motionMedia.matches && layouts[index].height <= available && Math.abs(progress.current - index) > .24) {
        window.scrollTo({ top: stops[index], behavior: "instant" });
        syncProgress();
      }
    };
    document.addEventListener("focusin", focusCopy);
    return () => {
      cancelAnimationFrame(refreshFrame);
      trigger.kill();
      motionMedia.removeEventListener("change", refreshMotion);
      document.removeEventListener("focusin", focusCopy);
      copies.forEach(copy => { copy.style.removeProperty("--copy-shift"); copy.style.removeProperty("--copy-opacity"); copy.style.removeProperty("--title-scale"); copy.style.pointerEvents = ""; });
    };
  }, []);

  return (
    <div className="site-shell">
      <a className="skip-link" href="#journey">Skip to content</a>
      <div className="ambient-backdrop" aria-hidden="true" />
      <div className="grid-overlay" aria-hidden="true" />
      <div className="film-noise" aria-hidden="true" />
      <div className={`world-wrap ${ready ? "world-ready" : ""}`} aria-hidden="true">
        {(!ready || reducedMotion || failed) && <div className="fallback-object"><span>V</span></div>}
        {webgl && !reducedMotion && !failed && <div className="world-canvas"><WorldBoundary onFailure={onFailure}><World progress={progress} onReady={onReady} paused={!!business && ready} /></WorldBoundary></div>}
      </div>
      {delayed && webgl && !reducedMotion && !failed && !ready && <div className="world-loading" role="status">Preparing the experience<span aria-hidden="true"> ···</span></div>}

      <header className="topbar">
        <a className="brand" href="#intro" aria-label="VeytronaTech — Go to top">
          <span className="brand-mark">V<span>·</span></span>
          <span>VEYTRONA<span className="brand-soft">TECH</span></span>
        </a>
        <nav className="topnav" aria-label="Primary">
          <a href="#websites">Expertise</a>
          <a href="#immersive">Experiences</a>
          <button className="nav-services" type="button" aria-haspopup="dialog" onClick={() => setBusiness({ view:"services" })}>Services</button>
          <button type="button" aria-haspopup="dialog" onClick={() => setBusiness({ view:"portfolio" })}>Work</button>
          <a className="nav-service-guide" href="/services">Service guide</a>
          <a className="nav-contact" href="#contact">Let's talk <span>↗</span></a>
        </nav>
        <MobileNavigation onNavigate={setBusiness} />
      </header>

      <aside className="side-progress" aria-label="Journey progress">
        <span className="side-count">{String(active + 1).padStart(2, "0")}</span>
        <div className="vertical-track"><span ref={progressBar} style={{ transform: "scaleY(0)" }} /></div>
        <span className="side-total">{String(SCENES.length).padStart(2, "0")}</span>
      </aside>

      <main id="journey" tabIndex={-1}>
        {SCENES.map((scene, index) => (
          <section
            className={`story-section ${index === 0 ? "intro-section" : ""}`}
            id={scene.id}
            key={scene.id}
            tabIndex={-1}
            aria-label={`${index + 1}. ${scene.heading.join(" ")}`}
          >
            <div className="story-inner">
              <div className="eyebrow"><span className="eyebrow-dash" />{scene.eyebrow}</div>
              {index === 0 ? (
                <h1 className="story-title"><span>{scene.heading[0]}</span><span className="title-accent">{scene.heading[1]}</span></h1>
              ) : (
                <h2 className="story-title"><span>{scene.heading[0]}</span><span className="title-accent">{scene.heading[1]}</span></h2>
              )}
              <p className="story-description">{scene.description}</p>
              <div className="story-detail">{scene.detail}</div>
              <div className="story-actions"><button className="studio-button story-business-cta" type="button" aria-haspopup="dialog" onClick={() => setBusiness(SCENE_BUSINESS_ACTIONS[index])}>{SCENE_BUSINESS_ACTIONS[index].label}<span aria-hidden="true">↗</span></button>
              <a className="main-cta" href={scene.href} aria-label={index === 5 ? "Start your project — open your email application" : undefined}>
                <span>{scene.action}</span>
                <span className="cta-arrow">↗</span>
              </a>
              </div>
            </div>
            <div className="scene-index" aria-hidden="true">
              <span>V / 0{index + 1}</span>
              <div className="scene-index-line" />
              <span>0{SCENES.length}</span>
            </div>
          </section>
        ))}
      </main>

      <footer className="fixed-footer">
        <span>INDEPENDENT DIGITAL STUDIO</span>
        <span className="footer-center">SCROLL TO EXPLORE <span className="down-arrow">↓</span></span>
        <span>BEYOND ORDINARY™</span>
      </footer>
      <div className="screen-edge" aria-hidden="true" />
      {business && <BusinessDialog request={business} onNavigate={setBusiness} onClose={() => setBusiness(null)} />}
    </div>
  );
}
