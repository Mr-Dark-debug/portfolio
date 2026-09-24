import { getSocialItems } from "@/lib/studio/content";
import { StudioPageHeader } from "@/components/studio/studio-shell";
import SocialManager from "@/components/studio/social-manager";

export const dynamic = "force-dynamic";

export default async function StudioSocialPage() {
  return <><StudioPageHeader eyebrow="Content hub / elsewhere" title="Social and signals" description="Curate the links and projects you want to surface around the portfolio. These are drafts for your public surfaces, not automatic posts." /><SocialManager initialItems={await getSocialItems()} /></>;
}
