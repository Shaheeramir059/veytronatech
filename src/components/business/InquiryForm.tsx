"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { BUDGETS, CONTACT_EMAIL, inquiryErrors, inquirySchema, prepareEmail, type InquiryErrors, type PreparedInquiry, type InquiryReceipt } from "@/lib/inquiry";
import { SERVICE_OPTIONS } from "@/lib/business-data";
import type { BusinessRequest } from "@/lib/business-navigation";

export default function InquiryForm({ request }: { request: BusinessRequest }) {
  const [values,setValues] = useState({ fullName:"",email:"",company:"",service:request.service ?? "unsure",description:request.project ? `I'd like to discuss an idea inspired by the Concept Demo “${request.project}”.` : "",budget:"",website:"",intent:request.intent ?? "project" });
  const [errors,setErrors] = useState<InquiryErrors>({}), [problem,setProblem] = useState(""), [pending,setPending] = useState(false), [draft,setDraft] = useState<PreparedInquiry | null>(null), [notice,setNotice] = useState("");
  const [attempt,setAttempt] = useState(0);
  const [receipt,setReceipt] = useState<InquiryReceipt | null>(null);
  const submissionKey = useRef("");
  const summary = useRef<HTMLDivElement>(null), prepared = useRef<HTMLHeadingElement>(null), controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(),[]);
  useEffect(() => { if (problem) summary.current?.focus(); }, [problem,attempt]);
  useEffect(() => { if (draft || receipt) prepared.current?.focus(); }, [draft,receipt]);
  const update = (name: keyof typeof values, value: string) => { submissionKey.current = ""; setReceipt(null); setValues(previous => ({ ...previous,[name]:value })); setErrors(previous => ({ ...previous,[name]:undefined })); setDraft(null); setNotice(""); };
  const errorProps = (name: keyof typeof values) => ({ "aria-invalid": !!errors[name], "aria-describedby": errors[name] ? `inquiry-${name}-error` : undefined });
  const fieldError = (name: keyof typeof values) => errors[name] && <span className="field-error" id={`inquiry-${name}-error`}>{errors[name]}</span>;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (pending || receipt) return; setAttempt(previous => previous+1); setProblem(""); setDraft(null); setNotice("");
    const parsed = inquirySchema.safeParse(values);
    if (!parsed.success) { setErrors(inquiryErrors(parsed.error)); setProblem("Please check the highlighted fields."); return; }
    setErrors({}); setPending(true); controller.current?.abort();
    const abort = new AbortController(); controller.current = abort;
    const timeout = setTimeout(() => abort.abort("timeout"),15_000);
    try {
      submissionKey.current ||= crypto.randomUUID();
      const response = await fetch("/api/inquiry/submit", { method:"POST",headers:{"Content-Type":"application/json","Idempotency-Key":submissionKey.current},body:JSON.stringify(parsed.data),signal:abort.signal });
      const result = await response.json();
      if (abort.signal.aborted) return;
      if (!response.ok) { setErrors(result.errors ?? {}); setProblem(result.error ?? "Submission is unavailable. Use the direct email link below."); if (response.status >= 500) setDraft(prepareEmail(parsed.data)); return; }
      if (result.mode === "provider" && result.state === "accepted" && typeof result.reference === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(result.reference)) { setReceipt(result); return; }
      if (result.mode === "fallback" && (result.state === "unknown" || result.state === "rejected")) { setNotice(result.error); setDraft(prepareEmail(parsed.data)); return; }
      if (result.mode !== "email-client" || result.recipient !== CONTACT_EMAIL || typeof result.body !== "string" || typeof result.subject !== "string" || typeof result.mailto !== "string" || !result.mailto.startsWith(`mailto:${CONTACT_EMAIL}?`)) throw new Error("Unexpected draft response");
      setDraft(result);
    } catch { if (!abort.signal.aborted || abort.signal.reason === "timeout") { setProblem("Submission could not be confirmed. Retry unchanged to reuse the same request key, or contact us directly and mention the uncertainty before sending a duplicate."); setDraft(prepareEmail(parsed.data)); } }
    finally { clearTimeout(timeout); if (!abort.signal.aborted || abort.signal.reason === "timeout") setPending(false); }
  }
  async function copyDraft() {
    if (!draft) return;
    try { await navigator.clipboard.writeText(`To: ${draft.recipient}\nSubject: ${draft.subject}\n\n${draft.body}`); setNotice(previous => `${previous} Draft copied. Review submission status before sending it yourself.`); }
    catch { setNotice(previous => `${previous} Copy is unavailable. Select and copy the draft text below.`); }
  }
  return <div className="inquiry-layout"><div><p className="panel-intro">Share the idea, the service you need and what a useful result would look like. Your inquiry is addressed to {CONTACT_EMAIL}. If website delivery is unavailable, you can review and send an email draft yourself.</p>
    <form className="inquiry-form" onSubmit={submit} noValidate aria-busy={pending}>
      {problem && <div className="form-summary" ref={summary} tabIndex={-1} role="alert"><strong>{problem}</strong>{Object.entries(errors).some(([,value]) => value) && <ul>{Object.entries(errors).filter(([,value]) => value).map(([key,value]) => <li key={key}><a href={`#inquiry-${key}`} onClick={event => { event.preventDefault(); document.getElementById(`inquiry-${key}`)?.focus(); }}>{value}</a></li>)}</ul>}</div>}
      <fieldset className="inquiry-fields" disabled={pending}>
      <div className="form-row"><label htmlFor="inquiry-fullName">Full name <span>(required)</span><input id="inquiry-fullName" name="fullName" autoComplete="name" required maxLength={100} value={values.fullName} onChange={event => update("fullName",event.target.value)} {...errorProps("fullName")} />{fieldError("fullName")}</label><label htmlFor="inquiry-email">Email address <span>(required)</span><input id="inquiry-email" name="email" type="email" autoComplete="email" required maxLength={254} value={values.email} onChange={event => update("email",event.target.value)} {...errorProps("email")} />{fieldError("email")}</label></div>
      <label htmlFor="inquiry-company">Company name <span>(optional)</span><input id="inquiry-company" name="company" autoComplete="organization" maxLength={120} value={values.company} onChange={event => update("company",event.target.value)} {...errorProps("company")} />{fieldError("company")}</label>
      <div className="form-row"><label htmlFor="inquiry-service">Service interested in <span>(required)</span><select id="inquiry-service" name="service" value={values.service} onChange={event => update("service",event.target.value)} {...errorProps("service")}>{SERVICE_OPTIONS.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}</select>{fieldError("service")}</label><label htmlFor="inquiry-budget">Budget range <span>(optional, USD)</span><select id="inquiry-budget" name="budget" value={values.budget} onChange={event => update("budget",event.target.value)} {...errorProps("budget")}>{BUDGETS.map(value => <option value={value} key={value}>{value || "Prefer not to say"}</option>)}</select>{fieldError("budget")}</label></div>
      <label htmlFor="inquiry-description">Project description <span>(required)</span><textarea id="inquiry-description" name="description" required minLength={20} maxLength={4000} rows={5} placeholder="What would you like to build? What should it help your business do?" value={values.description} onChange={event => update("description",event.target.value)} {...errorProps("description")} />{fieldError("description")}</label>
      <div className="inquiry-trap" aria-hidden="true"><label htmlFor="inquiry-website">Leave this field blank<input id="inquiry-website" name="website" autoComplete="off" tabIndex={-1} value={values.website} onChange={event => update("website",event.target.value)} /></label></div>
      <p className="privacy-note">Your entries are validated in your browser and on this server. When configured, website delivery forwards them to our email provider for staff review; the provider may retain them under its policy. Otherwise we prepare an email draft for you to send. This site does not store inquiry contents. Please share project requirements rather than confidential information.</p>
      <button className="studio-button" type="submit" disabled={pending || !!receipt}>{pending ? "Processing inquiry…" : receipt ? "Accepted for sending" : request.intent === "demo" ? "Submit AI Demo Request" : "Submit Project Inquiry"}</button>
      </fieldset>
    </form>
    {receipt && <section className="prepared-draft"><span className="status-tag">PROVIDER ACCEPTED · INBOX DELIVERY NOT CONFIRMED</span><h3 ref={prepared} tabIndex={-1}>Your inquiry was accepted for sending.</h3><p>The email provider accepted this request. This confirms acceptance, not final inbox delivery or a reservation. Please keep this reference if you follow up: {receipt.reference}.</p></section>}
    {draft && <section className="prepared-draft"><span className="status-tag">EMAIL DRAFT · REVIEW STATUS BELOW</span><h3 ref={prepared} tabIndex={-1}>Review it in your email application.</h3><p role="status" className="demo-note">{notice || (problem ? "Website submission could not be confirmed. Check the error above before sending another email." : "Website delivery is disabled or unconfigured. Nothing was sent by this website. Review and send the draft yourself.")}</p><div className="panel-actions"><a className="studio-button" href={draft.mailto} onClick={() => setNotice(previous => `${previous} Email application requested. If none opens, copy the draft below. Opening an application does not send the message.`)}>Open email application ↗</a><button className="studio-button secondary" type="button" onClick={copyDraft}>Copy draft</button></div><label htmlFor="email-draft">Prepared email<textarea id="email-draft" rows={7} readOnly value={`To: ${draft.recipient}\nSubject: ${draft.subject}\n\n${draft.body}`} /></label></section>}
    </div><aside className="inquiry-aside"><p className="panel-kicker">A USEFUL FIRST CONVERSATION</p><h3>From idea to a clear next step.</h3><ol><li>Share the problem and the audience.</li><li>Discuss scope, constraints and possible approaches.</li><li>Agree what should happen next.</li></ol><p>Prefer a direct email?</p><a className="text-button email-address" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL} ↗</a><small>Opens your email application. No message is sent automatically.</small></aside></div>;
}
