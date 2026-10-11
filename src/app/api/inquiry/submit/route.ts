import { createInquiryHandler } from "@/lib/inquiry-server";
import { configuredInquiryAdapter } from "@/lib/inquiry-delivery";
import { INQUIRY_RELEASE_SENDING_ENABLED } from "@/lib/inquiry-release";
export const runtime = "nodejs";
export const POST = createInquiryHandler(configuredInquiryAdapter({
  ...process.env,
  INQUIRY_DELIVERY_MODE: INQUIRY_RELEASE_SENDING_ENABLED ? process.env.INQUIRY_DELIVERY_MODE : "disabled",
}));
