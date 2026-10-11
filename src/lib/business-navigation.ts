import type { InquiryService, ServiceId } from "./business-data.ts";
export type BusinessView = "services" | "portfolio" | "automation" | "voice" | "inquiry";
export type BusinessRequest = { view: BusinessView; service?: InquiryService; intent?: "project" | "demo"; project?: string };
export const SCENE_BUSINESS_ACTIONS: readonly (BusinessRequest & { label: string })[] = [
  { view: "inquiry", label: "Discuss Your Project" },
  { view: "services", service: "websites", label: "Explore Website Services" },
  { view: "automation", service: "automation", label: "Try the Workflow Demo" },
  { view: "voice", service: "voice", label: "Try the Voice Demo" },
  { view: "portfolio", label: "Explore Concept Work" },
  { view: "inquiry", label: "Open Project Inquiry" },
];
export function serviceRequest(id: ServiceId): BusinessRequest { return { view: "inquiry", service: id, intent: id === "websites" ? "project" : "demo" }; }
export function businessTitle(view: BusinessView) {
  return { services: "Services, built around your business.", portfolio: "Explore the possibilities.", automation: "From lead to next action.", voice: "A helpful first conversation.", inquiry: "Tell us what you have in mind." }[view];
}
