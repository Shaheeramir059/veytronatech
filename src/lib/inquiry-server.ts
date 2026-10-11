import { inquiryErrors, inquirySchema, prepareEmail, type Inquiry, type InquiryResult } from "./inquiry.ts";

/** Server-only boundary. A future provider belongs here, never in a client component.
 * This adapter prepares an action; it makes no delivery claim and stores nothing.
 */
export interface InquiryAdapter { prepare(inquiry: Inquiry, request?: Request): Promise<InquiryResult> }
// Future delivery integration must return a provider receipt. Acceptance is
// distinct from delivery and cannot be reported as a delivered email.
export interface EmailDeliveryProvider { send(inquiry: Inquiry, signal?: AbortSignal): Promise<{ state: "accepted" | "rejected"; providerReference?: string }> }
export const emailClientAdapter: InquiryAdapter = { async prepare(inquiry) { return prepareEmail(inquiry); } };

export function createAttemptLimiter(limit = 30, intervalMs = 60_000, now = () => Date.now()) {
  let started = now(), attempts = 0;
  return () => {
    const time = now();
    if (time - started >= intervalMs) { started = time; attempts = 0; }
    attempts++;
    return { allowed: attempts <= limit, retryAfter: Math.max(1,Math.ceil((intervalMs-(time-started))/1000)) };
  };
}
export const MAX_INQUIRY_BYTES = 24_576;
export const INQUIRY_READ_TIMEOUT_MS = 5000;
const response = (body: unknown, status: number, extra: Record<string,string> = {}) => Response.json(body, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...extra } });

function matchesRequestOrigin(request: Request, origin: string) {
  try {
    const url = new URL(request.url);
    // NextURL normalizes 127.0.0.1/[::1] to localhost. Browser Origin does
    // not. Compare with the original HTTP Host rather than the normalized URL.
    // Do not trust forwarded-host headers without a configured trusted proxy.
    const target = new URL(`${url.protocol}//${request.headers.get("host") ?? url.host}`);
    return !target.username && !target.password && target.pathname === "/" && target.origin === origin;
  } catch { return false; }
}

export function createInquiryHandler(adapter: InquiryAdapter = emailClientAdapter, allow = createAttemptLimiter()) {
  return async (request: Request) => {
    const origin = request.headers.get("origin");
    if ((origin && !matchesRequestOrigin(request,origin)) || request.headers.get("sec-fetch-site") === "cross-site") return response({ error: "Open the inquiry form on this website and try again." },403);
    const attempt = allow();
    if (!attempt.allowed) return response({ error: "Too many inquiry requests. Please wait a minute or use the direct email link." },429,{ "Retry-After": String(attempt.retryAfter) });
    if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return response({ error: "Send the inquiry as JSON." },415);
    if (Number(request.headers.get("content-length")) > MAX_INQUIRY_BYTES) return response({ error: "The request is too large." },413);
    if (!request.body) return response({ error: "The inquiry is empty." },400);
    const reader = request.body.getReader();
    let timedOut = false;
    const timeout = setTimeout(() => { timedOut = true; void reader.cancel().catch(() => {}); },INQUIRY_READ_TIMEOUT_MS);
    let size = 0, chunks = 0, text = "";
    const decoder = new TextDecoder();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength; chunks++;
        if (size > MAX_INQUIRY_BYTES || chunks > 4096) { await reader.cancel(); return response({ error: "The request is too large." },413); }
        text += decoder.decode(value,{ stream: true });
      }
      text += decoder.decode();
    } catch { return response({ error: timedOut ? "The request took too long. Please try again." : "The request could not be read. Please try again." },timedOut ? 408 : 400); }
    finally { clearTimeout(timeout); reader.releaseLock(); }
    if (timedOut) return response({ error: "The request took too long. Please try again." },408);
    let input: unknown;
    try { input = JSON.parse(text); } catch { return response({ error: "The inquiry could not be read." },400); }
    const parsed = inquirySchema.safeParse(input);
    if (!parsed.success) return response({ error: "Please check the form fields.", errors: inquiryErrors(parsed.error) },422);
    if (parsed.data.website !== "") return response({ error: "The draft could not be prepared. Please use the direct email link." },400);
    try { return response(await adapter.prepare(parsed.data,request),200); }
    catch { return response({ error: "Draft preparation is unavailable. Please use the direct email link." },503); }
  };
}
