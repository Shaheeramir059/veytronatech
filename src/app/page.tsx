import CinematicExperience from "@/components/CinematicExperience";
import { CONTACT_EMAIL } from "@/lib/inquiry";
import { siteOrigin, SITE_DESCRIPTION } from "@/lib/site-config";

export default function Page() {
  const origin = siteOrigin();
  const structured = {"@context":"https://schema.org","@type":"Organization",name:"VeytronaTech",description:SITE_DESCRIPTION,email:CONTACT_EMAIL,...(origin ? {url:origin} : {})};
  return <><CinematicExperience /><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structured).replace(/</g,"\\u003c")}} /></>;
}
