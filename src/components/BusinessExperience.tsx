"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { PROJECTS, SERVICES, safeDemoUrl, type Project, type ServiceId } from "@/lib/business-data";
import { serviceRequest, type BusinessRequest } from "@/lib/business-navigation";
import { mark, measure } from "@/lib/profile";
import { ProjectVisual, SpatialPreview, WebsitePreview } from "./business/Previews";
const AutomationDemo = dynamic(() => import("./business/Demos").then(module => module.AutomationDemo), { loading: () => <p role="status">Preparing workflow demo…</p> });
const VoiceDemo = dynamic(() => import("./business/Demos").then(module => module.VoiceDemo), { loading: () => <p role="status">Preparing conversation demo…</p> });
const InquiryForm = dynamic(() => import("./business/InquiryForm"), { loading: () => <p role="status">Opening inquiry form…</p> });
type Props = { request: BusinessRequest; onNavigate: (request: BusinessRequest) => void; onClose: () => void };
function ProjectThumbnail({ project }: { project: Project }) {
  const src = safeDemoUrl(project.thumbnail?.src);
  return src ? <img className="project-thumbnail" src={src} alt={project.thumbnail?.alt ?? project.name} width={640} height={360} loading="lazy" decoding="async" /> : <ProjectVisual variant={project.preview} />;
}

function ServiceDetails({ request,onNavigate,onClose }: Props) {
  const [selected,setSelected] = useState<ServiceId>(SERVICES.some(service => service.id === request.service) ? request.service as ServiceId : "websites");
  const service = SERVICES.find(service => service.id === selected)!;
  return <><p className="panel-intro">Explore how a website, automation or voice workflow could support your business. Each project starts with your requirements and the systems you actually use.</p><div className="service-selector" aria-label="Choose a service">{SERVICES.map(item => <button type="button" key={item.id} aria-pressed={selected === item.id} onClick={() => setSelected(item.id)}>{item.name}<span aria-hidden="true">↗</span></button>)}</div>
    <div className="service-detail"><div><p className="panel-kicker">{service.name}</p><h3>{service.promise}</h3><p>{service.overview}</p><h4>What we can build</h4><ul className="offering-list">{service.offerings.map(value => <li key={value}>{value}</li>)}</ul><h4>Designed to help you</h4><ul className="benefit-list">{service.benefits.map(value => <li key={value}>{value}</li>)}</ul><button className="studio-button" type="button" onClick={() => onNavigate(serviceRequest(service.id))}>{service.action} ↗</button></div>
      <div className="service-demonstration">{selected === "websites" ? <WebsitePreview /> : <><ProjectVisual variant={selected} /><button className="studio-button secondary" type="button" onClick={() => onNavigate({ view:selected,service:selected })}>{selected === "automation" ? "Try the Workflow Demo" : "Try the Voice Demo"} ↗</button></>}<p className="demo-note">{service.demonstration}</p>{selected === "websites" && <a className="text-button" href="#intro" onClick={onClose}>Return to the cinematic prototype ↗</a>}</div></div></>;
}
function CaseStudy({ project,onNavigate,onClose,onBack }: { project: Project; onBack: () => void } & Omit<Props,"request">) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll:true }); heading.current?.closest("dialog")?.scrollTo({ top:0 }); }, [project.id]);
  const live = safeDemoUrl(project.demoUrl), video = safeDemoUrl(project.video?.src);
  return <article className="case-study"><button className="text-button" type="button" onClick={onBack}>← All concept work</button><div className="case-heading"><span className="status-tag">{project.status}</span><p className="muted">{project.category}</p><h3 ref={heading} tabIndex={-1}>{project.name}</h3><p>{project.overview}</p></div>
    {video ? <video className="project-video" controls preload="none" poster={safeDemoUrl(project.video?.poster)}><source src={video} />{safeDemoUrl(project.video?.captions) && <track kind="captions" src={safeDemoUrl(project.video?.captions)} srcLang="en" label="English captions" default />}<p>Your browser does not support video playback.</p></video> : project.preview === "website" ? <WebsitePreview /> : project.preview === "automation" ? <AutomationDemo onNavigate={onNavigate} /> : project.preview === "voice" ? <VoiceDemo onNavigate={onNavigate} /> : project.preview === "interactive" ? <SpatialPreview /> : <><ProjectVisual variant="cinematic" /><a className="studio-button secondary" href="#intro" onClick={onClose}>Explore this local prototype ↗</a></>}
    <div className="case-columns"><section><h4>The design challenge</h4><p>{project.challenge}</p><h4>The approach</h4><ul className="benefit-list">{project.approach.map(value => <li key={value}>{value}</li>)}</ul></section><section><h4>What you can explore</h4><ul className="benefit-list">{project.capabilities.map(value => <li key={value}>{value}</li>)}</ul><h4>Verified technologies</h4>{project.verifiedTechnologies.length ? <><div className="technology-tags">{project.verifiedTechnologies.map(value => <span key={value}>{value}</span>)}</div><p className="demo-note">{project.verification}</p></> : <p>No production stack or external integrations are verified for this concept.</p>}{project.credits && <p>{project.credits}</p>}</section></div>
    <div className="panel-actions"><button className="studio-button" type="button" onClick={() => onNavigate({ view:"inquiry",service:project.service,project:project.name })}>Discuss a Similar Idea ↗</button>{live ? <a className="studio-button secondary" href={live} target="_blank" rel="noopener noreferrer">Open configured live demo ↗</a> : <span className="demo-note">Live demo not configured.</span>}</div><p className="demo-note">{project.status === "Client Project" ? "Project details supplied for this entry." : "Concept work, not a commissioned client project. No client outcomes or completed integrations are claimed."}</p>
  </article>;
}
function Portfolio(props: Props) {
  const [category,setCategory] = useState("All"), [selected,setSelected] = useState<Project | null>(null);
  const all = useRef<HTMLHeadingElement>(null);
  if (selected) return <CaseStudy project={selected} onNavigate={props.onNavigate} onClose={props.onClose} onBack={() => { setSelected(null); requestAnimationFrame(() => { all.current?.focus({ preventScroll:true }); all.current?.closest("dialog")?.scrollTo({top:0}); }); }} />;
  return <><p className="panel-intro">Explore the local prototype and interactive studies. These entries are clearly labeled concepts; real client case studies can be added when content and permission are available.</p><h3 className="sr-only" ref={all} tabIndex={-1}>Concept portfolio</h3><label className="portfolio-filter">Filter by category<select value={category} onChange={event => setCategory(event.target.value)}><option>All</option>{PROJECTS.map(project => <option key={project.id}>{project.category}</option>)}</select></label><div className="portfolio-grid">{PROJECTS.filter(project => category === "All" || project.category === category).map(project => <article className="project-card" key={project.id}><ProjectThumbnail project={project} /><div className="project-card-copy"><span className="project-number">STUDY {String(PROJECTS.indexOf(project)+1).padStart(2,"0")}</span><span className="status-tag">{project.status}</span><p className="muted">{project.category}</p><h3>{project.name}</h3><p>{project.overview}</p><button type="button" className="text-button" onClick={() => setSelected(project)} aria-label={`Explore ${project.name}, ${project.status}`}>Explore the study ↗</button></div></article>)}</div></>;
}
export default function BusinessExperience(props: Props) {
  useEffect(() => { mark("studio-content-mounted"); measure("studio-shell-ready","studio-open","studio-content-mounted"); },[]);
  switch (props.request.view) {
    case "services": return <ServiceDetails {...props} key={props.request.service ?? "services"} />;
    case "portfolio": return <Portfolio {...props} />;
    case "automation": return <AutomationDemo onNavigate={props.onNavigate} />;
    case "voice": return <VoiceDemo onNavigate={props.onNavigate} />;
    case "inquiry": return <InquiryForm request={props.request} key={`${props.request.service}:${props.request.intent}:${props.request.project}`} />;
  }
}
