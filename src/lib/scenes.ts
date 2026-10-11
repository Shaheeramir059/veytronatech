/** Canonical order is shared by the narrative UI and the camera path. */
import { CONTACT_EMAIL } from "./contact.ts";
export const SCENES = [
  {
    id: "intro",
    eyebrow: "01 / ENTER THE FUTURE",
    heading: ["Beyond", "ordinary."],
    description:
      "We create digital experiences that move people, automate work, and turn first impressions into lasting business.",
    detail: "DESIGN · INTELLIGENCE · IMPACT",
    action: "Explore our world",
    href: "#websites",
  },
  {
    id: "websites",
    eyebrow: "02 / DIGITAL EXPERIENCES",
    heading: ["Websites with", "presence."],
    description:
      "High-performance websites and exceptional visual identities built to make your business impossible to ignore.",
    detail: "WEB DESIGN · DEVELOPMENT · CONVERSION",
    action: "See what's possible",
    href: "#automation",
  },
  {
    id: "automation",
    eyebrow: "03 / CONNECT EVERYTHING",
    heading: ["Make work", "flow."],
    description:
      "Thoughtful AI automations that connect your tools, eliminate repetitive tasks, and give your team time back.",
    detail: "WORKFLOWS · INTEGRATIONS · AI",
    action: "Discover automation",
    href: "#voice",
  },
  {
    id: "voice",
    eyebrow: "04 / ALWAYS ON",
    heading: ["Conversations,", "reimagined."],
    description:
      "AI voice agents designed for real customer conversations, appointment handling, and round-the-clock assistance.",
    detail: "AI VOICE · CUSTOMER EXPERIENCE · BOOKINGS",
    action: "Meet the voice future",
    href: "#immersive",
  },
  {
    id: "immersive",
    eyebrow: "05 / NEW DIMENSIONS",
    heading: ["Step inside", "the idea."],
    description:
      "Immersive 3D websites and interactive showcases that let your audience experience your vision instead of simply reading it.",
    detail: "WEBGL · 3D · STORYTELLING",
    action: "Enter the experience",
    href: "#contact",
  },
  {
    id: "contact",
    eyebrow: "06 / YOUR NEXT CHAPTER",
    heading: ["Let's build", "what's next."],
    description:
      "Tell us what you want to create. We'll help shape it into an experience that stands apart.",
    detail: "START A CONVERSATION",
    action: "Start your project ↗",
    href: `mailto:${CONTACT_EMAIL}?subject=Project%20inquiry%20-%20VeytronaTech`,
  },
] as const;

export const STAGE_SPACING = 11;
