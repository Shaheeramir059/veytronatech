"use client";
import { useState } from "react";
import type { Project } from "@/lib/business-data";

export function ProjectVisual({ variant }: { variant: Project["preview"] }) {
  return <div className={`project-visual visual-${variant}`} aria-hidden="true"><div className="preview-grid" /><div className="visual-orbit" /><div className="visual-core">{variant === "cinematic" ? "V" : variant === "voice" ? "◌" : variant === "automation" ? "↗" : variant === "website" ? "▤" : "◇"}</div><div className="visual-detail">{variant === "voice" ? Array.from({length:17},(_,index) => <i key={index} style={{height:`${8+Math.abs(Math.sin(index*1.7))*26}px`}} />) : [0,1,2].map(index => <i key={index} />)}</div><span className="visual-caption">{variant === "voice" ? "CONVERSATION / HUMAN HANDOFF" : variant === "automation" ? "CAPTURE / REVIEW / ROUTE" : variant === "website" ? "CLARITY / CONTENT / ACTION" : "FORM / LIGHT / INTERACTION"}</span></div>;
}
export function WebsitePreview() {
  const [mobile,setMobile] = useState(false);
  return <div className="demo-surface"><div className="demo-heading"><span className="status-tag">Layout Concept</span><div className="segmented" aria-label="Preview viewport"><button type="button" aria-pressed={!mobile} onClick={() => setMobile(false)}>Desktop</button><button type="button" aria-pressed={mobile} onClick={() => setMobile(true)}>Mobile</button></div></div>
    <div className={`website-preview ${mobile ? "preview-mobile" : ""}`}><div className="preview-browser" aria-hidden="true"><i /><i /><i /></div><div className="preview-site"><div className="preview-site-nav">YOUR BUSINESS <span>Services / Contact</span></div><h4>A clear offer.<br /><span>A useful next step.</span></h4><p>Introduce your business, explain how you help, and make it easy for visitors to get in touch.</p><div className="preview-site-action">Discuss a project ↗</div><div className="preview-site-cards"><span>What you offer</span><span>How it works</span><span>What comes next</span></div></div></div>
    <p className="demo-note">A layout study, not a client website. Viewport controls change this preview only.</p></div>;
}
export function SpatialPreview() {
  const [shape,setShape] = useState("diamond"), [palette,setPalette] = useState("cyan");
  return <div className="demo-surface"><div className="demo-heading"><span className="status-tag">Interactive Concept</span><span className="muted">HTML / CSS study</span></div><div className={`spatial-preview palette-${palette} shape-${shape}`} aria-label={`${palette} ${shape} spatial concept`}><div className="spatial-ring" /><div className="spatial-shape" /></div>
    <div className="preview-controls"><fieldset><legend>Form</legend>{["diamond","orb","frame"].map(value => <button type="button" key={value} aria-pressed={shape === value} onClick={() => setShape(value)}>{value}</button>)}</fieldset><fieldset><legend>Atmosphere</legend>{["cyan","silver","navy"].map(value => <button type="button" key={value} aria-pressed={palette === value} onClick={() => setPalette(value)}>{value}</button>)}</fieldset></div><p className="demo-note">Explore a direction before discussing a production experience. This preview adds no WebGL canvas.</p></div>;
}
