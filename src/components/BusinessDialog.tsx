"use client";
import dynamic from "next/dynamic";
import { Component, useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { businessTitle, type BusinessRequest, type BusinessView } from "@/lib/business-navigation";
import { SCENES } from "@/lib/scenes";
import { mark, measure } from "@/lib/profile";

class StudioContentBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed:false };
  static getDerivedStateFromError() { return { failed:true }; }
  componentDidCatch(error: Error) { console.error("[VeytronaTech] Studio view failed to load or render.",error); }
  render() { return this.state.failed ? <div className="form-summary" role="alert"><p>This view could not load. Close the panel and try again, or contact us directly.</p><a className="text-button" href={SCENES[5].href}>Open your email application ↗</a></div> : this.props.children; }
}

const Content = dynamic(() => { mark("studio-import-start"); return import("./BusinessExperience").then(module => { mark("studio-import-end"); measure("studio-code-load","studio-import-start","studio-import-end"); return module; }); }, { loading: () => <p className="panel-loading" role="status">Opening the studio…</p> });
const pages: { view: BusinessView; label: string }[] = [
  { view: "services", label: "Services" }, { view: "portfolio", label: "Concept work" },
  { view: "automation", label: "Automation demo" }, { view: "voice", label: "Voice demo" }, { view: "inquiry", label: "Project inquiry" },
];
export default function BusinessDialog({ request, onNavigate, onClose }: { request: BusinessRequest; onNavigate: (request: BusinessRequest) => void; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const restoreFocus = useRef(true);
  const closeToJourney = () => { restoreFocus.current = false; onClose(); };
  useEffect(() => {
    mark("studio-open");
    const node = dialog.current!;
    const opener = document.activeElement as HTMLElement | null;
    const previous = document.documentElement.style.overflow;
    node.showModal(); document.documentElement.style.overflow = "hidden";
    heading.current?.focus({ preventScroll: true });
    return () => { node.close(); document.documentElement.style.overflow = previous; if (restoreFocus.current && opener?.isConnected) opener.focus({ preventScroll: true }); };
  }, []);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); dialog.current?.scrollTo({ top: 0 }); }, [request.view]);
  return createPortal(
    <dialog className="conversion-dialog" ref={dialog} aria-labelledby="studio-panel-title" aria-describedby="studio-panel-context"
      onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
      }}>
      <div className="studio-panel">
        <header className="studio-panel-header"><a className="studio-wordmark" href="#intro" onClick={closeToJourney}>VEYTRONA<span>TECH</span></a><button className="panel-close" type="button" onClick={onClose} aria-label="Close studio panel and return to the journey">Close <span aria-hidden="true">×</span></button></header>
        <nav className="studio-tabs" aria-label="Studio views">{pages.map(page => <button type="button" key={page.view} aria-current={request.view === page.view ? "page" : undefined} onClick={() => onNavigate({ view: page.view })}>{page.label}</button>)}</nav>
        <div className="studio-panel-body">
          <p className="panel-kicker" id="studio-panel-context">VEYTRONATECH / IDEAS INTO EXPERIENCES</p>
          <h2 className="panel-title" id="studio-panel-title" ref={heading} tabIndex={-1}>{businessTitle(request.view)}</h2>
          <StudioContentBoundary key={request.view}><Content request={request} onNavigate={onNavigate} onClose={closeToJourney} /></StudioContentBoundary>
        </div>
      </div>
    </dialog>, document.body);
}
