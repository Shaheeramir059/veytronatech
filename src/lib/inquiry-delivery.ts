// Server module: node:crypto deliberately prevents importing into client bundles.
import { createHmac } from "node:crypto";
import { CONTACT_EMAIL, prepareEmail, type Inquiry, type InquiryResult } from "./inquiry.ts";
import { emailClientAdapter, type InquiryAdapter } from "./inquiry-server.ts";

export type DeliveryState = { state:"accepted"; reference:string } | { state:"rejected" | "unknown" };
export interface DeliveryProvider { send(inquiry: Inquiry, key: string): Promise<DeliveryState> }
export interface SubmissionGuard { check(inquiry: Inquiry): Promise<boolean> }
export function createResendProvider(config: { key:string; from:string }, transport: typeof fetch = fetch): DeliveryProvider {
  return { async send(inquiry,key) {
    const draft = prepareEmail(inquiry);
    try {
      const response = await transport("https://api.resend.com/emails", { method:"POST",redirect:"error", signal:AbortSignal.timeout(10_000),
        headers:{ Authorization:`Bearer ${config.key}`, "Content-Type":"application/json", "Idempotency-Key":`inquiry/${key}` },
        body:JSON.stringify({ from:config.from,to:[CONTACT_EMAIL],reply_to:inquiry.email,subject:draft.subject,text:draft.body }) });
      // 5xx/timeouts can occur after acceptance: do not encourage a duplicate
      // email. Retry the exact payload with the same key; no automatic retries.
      if (!response.ok) return { state: response.status >= 500 ? "unknown" : "rejected" };
      const result = await response.json();
      return typeof result.id === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(result.id) ? { state:"accepted",reference:result.id } : { state:"unknown" };
    } catch { return { state:"unknown" }; }
  } };
}

/** Durable gate contract for a host-owned atomic rate limiter. Never trust
 * forwarded IP headers. Only a salted digest of the sender reaches this gate;
 * the host must also enforce a global quota and retention expiry. Fail closed. */
export function createSubmissionGuard(config: { url:string; token:string; salt:string }, transport: typeof fetch = fetch): SubmissionGuard {
  return { async check(inquiry) {
    try {
      const key = createHmac("sha256",config.salt).update(inquiry.email.toLowerCase()).digest("hex");
      const response = await transport(config.url,{ method:"POST",redirect:"error",signal:AbortSignal.timeout(3000),headers:{ Authorization:`Bearer ${config.token}`,"Content-Type":"application/json" },body:JSON.stringify({ key,limit:3,windowSeconds:3600,globalLimit:30,globalWindowSeconds:60 }) });
      return response.ok && (await response.json()).allowed === true;
    } catch { return false; }
  } };
}

export function createDeliveryAdapter(provider: DeliveryProvider, guard: SubmissionGuard): InquiryAdapter {
  return { async prepare(inquiry,request): Promise<InquiryResult> {
    const origin = request?.headers.get("origin"), key = request?.headers.get("idempotency-key") ?? "";
    const fallback = (state:"rejected" | "unknown",error:string): InquiryResult => ({ mode:"fallback",state,error,draft:prepareEmail(inquiry) });
    if (!origin || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(key)) return fallback("rejected","Submission needs a valid browser request. Use the draft below.");
    if (!await guard.check(inquiry)) return fallback("rejected","Sending is unavailable or rate limited. No provider request was made. Use the draft below or try later.");
    const receipt = await provider.send(inquiry,key);
    if (receipt.state === "accepted") return { mode:"provider",state:"accepted",reference:receipt.reference };
    return fallback(receipt.state,receipt.state === "unknown" ? "Provider acceptance is unknown. Retry unchanged to avoid duplicates, or contact us directly and mention this uncertainty before sending another message." : "The provider did not accept this request. Use the draft below or try later.");
  } };
}

// Explicit opt-in AND a configured durable guard. Merely adding credentials
// cannot activate sending. No configuration is written by this phase.
export function configuredInquiryAdapter(env: NodeJS.ProcessEnv = process.env, transport: typeof fetch = fetch): InquiryAdapter {
  if (env.INQUIRY_DELIVERY_MODE !== "resend") return emailClientAdapter;
  const validAddress = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/;
  const senderDomain = env.INQUIRY_FROM?.split("@")[1]?.toLowerCase();
  const verifiedDomain = env.INQUIRY_VERIFIED_SENDER_DOMAIN?.trim().toLowerCase();
  // This acknowledgement must be configured only after dashboard verification.
  // Resend still enforces actual domain verification; no DNS success is assumed.
  if (!senderDomain || senderDomain !== verifiedDomain || ["gmail.com","googlemail.com"].includes(senderDomain)) return emailClientAdapter;
  let guardUrl: URL | undefined;
  try { guardUrl = new URL(env.INQUIRY_ABUSE_URL ?? ""); } catch { /* disabled */ }
  if (!env.RESEND_API_KEY || !validAddress.test(env.INQUIRY_FROM ?? "") || !env.INQUIRY_ABUSE_TOKEN || (env.INQUIRY_ABUSE_SALT?.length ?? 0) < 32 || guardUrl?.protocol !== "https:" || guardUrl.username || guardUrl.password) return emailClientAdapter;
  return createDeliveryAdapter(createResendProvider({ key:env.RESEND_API_KEY,from:env.INQUIRY_FROM! },transport),createSubmissionGuard({ url:guardUrl.href,token:env.INQUIRY_ABUSE_TOKEN,salt:env.INQUIRY_ABUSE_SALT! },transport));
}
