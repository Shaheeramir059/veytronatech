import { z } from "zod";
import { CONTACT_EMAIL } from "./contact.ts";
export { CONTACT_EMAIL };
export const BUDGETS = ["", "Under $2,000", "$2,000–$5,000", "$5,000–$10,000", "$10,000+", "Let's discuss"] as const;
export const inquirySchema = z.object({
  fullName: z.string().trim().min(2,"Enter your full name (at least 2 characters).").max(100,"Keep your name under 100 characters.").regex(/^[^\r\n]+$/,"Enter your name on one line."),
  email: z.string().trim().max(254,"Email address is too long.").email("Enter a valid email address."),
  company: z.string().trim().max(120,"Keep company name under 120 characters.").default(""),
  service: z.enum(["websites","automation","voice","immersive","unsure"], { error: "Choose a service." }),
  description: z.string().trim().min(20,"Describe your idea in at least 20 characters.").max(4000,"Keep the description under 4,000 characters."),
  budget: z.enum(BUDGETS, { error: "Choose a listed budget range or leave it blank." }).default(""),
  intent: z.enum(["project","demo"]).default("project"),
  website: z.string().max(200).default(""),
}).strict();
export type Inquiry = z.infer<typeof inquirySchema>;
export type InquiryErrors = Partial<Record<keyof Inquiry, string>>;
export function inquiryErrors(error: z.ZodError): InquiryErrors {
  const errors: InquiryErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as keyof Inquiry;
    if (key && !(key in errors)) errors[key] = issue.message;
  }
  return errors;
}
export function prepareEmail(inquiry: Inquiry) {
  const names = { websites: "Website Development", automation: "AI Automation", voice: "AI Voice Agents", immersive: "Interactive 3D Experiences", unsure: "Help choosing a service" };
  const subject = `${inquiry.intent === "demo" ? "AI demo request" : "Project inquiry"} — ${names[inquiry.service]}`;
  const body = ["Hello VeytronaTech,", "", inquiry.description, "", `Name: ${inquiry.fullName}`, `Reply email: ${inquiry.email}`, inquiry.company && `Company: ${inquiry.company}`, `Service: ${names[inquiry.service]}`, inquiry.budget && `Budget: ${inquiry.budget}`, "", "Please contact me to discuss the next step."].join("\n");
  return { mode: "email-client" as const, recipient: CONTACT_EMAIL, subject, body, mailto: `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}` };
}
export type PreparedInquiry = ReturnType<typeof prepareEmail>;
export type InquiryReceipt = { mode: "provider"; state: "accepted"; reference: string };
export type InquiryResult = PreparedInquiry | InquiryReceipt | { mode:"fallback"; state:"rejected" | "unknown"; error:string; draft:PreparedInquiry };
