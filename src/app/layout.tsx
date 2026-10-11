import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./business.css";
import { siteOrigin, SITE_DESCRIPTION } from "@/lib/site-config";

const origin = siteOrigin();
export const viewport: Viewport = { width:"device-width",initialScale:1,viewportFit:"cover",interactiveWidget:"resizes-content",themeColor:"#060d19" };

export const metadata: Metadata = {
  title: "VeytronaTech — Beyond Ordinary",
  description: SITE_DESCRIPTION,
  ...(origin ? { metadataBase:new URL(origin),alternates:{ canonical:"/" } } : {}),
  robots: { index:!!origin,follow:!!origin },
  openGraph: { type:"website",siteName:"VeytronaTech",title:"VeytronaTech — Beyond Ordinary",description:SITE_DESCRIPTION,...(origin ? { url:origin,images:[{url:"/social-image",width:1200,height:630,alt:"VeytronaTech — Websites, AI automation and voice workflows"}] } : {}) },
  twitter: { card:"summary_large_image",title:"VeytronaTech — Beyond Ordinary",description:SITE_DESCRIPTION,...(origin ? { images:["/social-image"] } : {}) },
  icons:{ icon:"/icon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
