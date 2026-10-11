export const WORKFLOW_STEPS = [
  { name: "Lead Received", description: "Capture the visitor's service interest and timing in a structured sample record." },
  { name: "AI Qualification", description: "Apply sample routing rules. A production workflow needs your agreed criteria and human review." },
  { name: "CRM Update", description: "Prepare a contact record and next action. This demo does not write to a CRM." },
  { name: "Personalized Follow-up", description: "Prepare a relevant draft response for review. No email is sent." },
  { name: "Staff Notification", description: "Prepare a concise summary and owner for staff. No notification is sent." },
] as const;
export type WorkflowState = { step: number; selected: number; running: boolean; interest: "Website" | "Automation" | "Voice"; timing: "Soon" | "Exploring" };
export const initialWorkflow: WorkflowState = { step: -1, selected: 0, running: false, interest: "Website", timing: "Soon" };
export type WorkflowAction = { type: "start"; automatic: boolean } | { type: "next" } | { type: "pause" } | { type: "inspect"; step: number } | { type: "configure"; interest: WorkflowState["interest"]; timing: WorkflowState["timing"] };
export function workflowReducer(state: WorkflowState, action: WorkflowAction): WorkflowState {
  switch (action.type) {
    case "start": return { ...state, step: 0, selected: 0, running: action.automatic };
    case "pause": return { ...state, running: false };
    case "inspect": return { ...state, selected: Number.isFinite(action.step) ? Math.max(0,Math.min(4,Math.trunc(action.step))) : 0, running: false };
    case "configure": return { ...initialWorkflow, interest: action.interest, timing: action.timing };
    case "next": { const step = Math.min(4,state.step+1); return { ...state, step, selected: step, running: state.running && step < 4 }; }
  }
}
export function workflowOutput(state: WorkflowState, index: number) {
  const route = state.timing === "Soon" ? "Project discussion" : "Helpful information and a later check-in";
  return [
    `Sample interest: ${state.interest}. Timing: ${state.timing}.`,
    `Suggested route: ${route}. Staff would confirm scope and fit.`,
    `Draft record: ${state.interest} inquiry • ${state.timing} • owner: studio team.`,
    `Draft reply: Let's discuss your ${state.interest.toLowerCase()} idea${state.timing === "Soon" ? " and agree a next step" : " when you're ready"}.`,
    `Preview for staff: ${state.interest} inquiry, ${state.timing.toLowerCase()}. Next action: ${route.toLowerCase()}.`,
  ][index];
}
import dialogue from "./receptionist-dialogue.json" with { type: "json" };
import type { VoiceLine } from "./voice-output.ts";
export const VOICE_SCENARIOS = { reservation:"Table request", information:"Restaurant information", occasion:"Birthday request", summary:"Request summary", closing:"Closing conversation" } as const;
export type VoiceState = { turn: number; guests: number; time: "18:30" | "19:00" | "20:00"; handoff: boolean; scenario?: keyof typeof VOICE_SCENARIOS };
export const initialVoice: VoiceState = { turn: 0, guests: 4, time: "19:00", handoff: false, scenario:"reservation" };
export type VoiceAction = { type: "start" } | { type: "next" } | { type: "handoff" } | { type: "reset" } | { type: "configure"; guests: number; time: VoiceState["time"]; scenario?: VoiceState["scenario"] };
export function voiceReducer(state: VoiceState, action: VoiceAction): VoiceState {
  switch (action.type) {
    case "start": return { ...state, turn: 1, handoff: false };
    case "next": return state.handoff ? state : { ...state, turn: Math.min(6,state.turn+1) };
    case "handoff": return { ...state, turn: Math.max(1,state.turn), handoff: true };
    case "reset": return { ...state, turn: 0, handoff: false };
    case "configure": return { turn: 0, handoff: false, guests: Number.isFinite(action.guests) ? Math.max(1,Math.min(12,Math.trunc(action.guests))) : 4, time: action.time, scenario:action.scenario ?? state.scenario };
  }
}
export function voiceConversation(state: VoiceState) {
  const available = state.guests <= 6 && state.time !== "18:30";
  const ai = (id: string): VoiceLine => { const source = dialogue[id as keyof typeof dialogue]; return { speaker:"Receptionist",id,text:source.text }; };
  const customer = (text: string): VoiceLine => ({speaker:"Customer",text});
  const result = state.guests > 6 ? "large-party" : !available ? "unavailable" : `available-${state.time.replace(":","")}`;
  let script: VoiceLine[] = [
    { speaker: "Customer", text: `I'd like to request a table for ${state.guests} tomorrow evening.` },
    ai("greeting-time"),
    { speaker: "Customer", text: `Around ${state.time}, please.` },
    ai("check"),
    ai(result),
    { speaker: "Customer", text: available ? "Please pass my request to the team." : "I'd like to speak with a host." },
  ];
  if (state.scenario === "information") script = [customer("I'd like some restaurant information."),ai("greeting-info"),customer("What evening times are shown?"),ai("information"),ai("guest-count"),customer(`There would be ${state.guests} guests. I'll check the details with the team.`)];
  if (state.scenario === "occasion") script = [customer(`I'd like a birthday table for ${state.guests} tomorrow.`),ai("greeting-time"),customer(`Around ${state.time}, please. It's a birthday.`),ai("occasion"),ai(result),customer("Please ask the host about arrangements.")];
  if (state.scenario === "summary") { const id = `summary-${state.guests}-${state.time.replace(":","")}`; script = [customer(`Please summarize my request for ${state.guests} at ${state.time}.`),ai(id in dialogue ? id : "summary-general"),customer("Is that a confirmed booking?"),ai("check"),ai("closing"),customer("Thank you. I'll speak with the team.")]; }
  if (state.scenario === "closing") script = [customer("Could I speak with a host?"),ai("greeting-info"),customer("Please pass along my sample request."),ai("handoff"),ai("closing"),customer("Thank you. Goodbye.")];
  const turns = script.slice(0,state.turn);
  if (state.handoff) turns.push(ai("handoff"));
  return { turns, available, staffReady: state.turn >= 5 || state.handoff, status: state.handoff || (!available && state.turn >= 5) ? "Human review needed" : state.turn >= 5 ? "Draft request for staff review" : "Gathering a sample request" };
}
