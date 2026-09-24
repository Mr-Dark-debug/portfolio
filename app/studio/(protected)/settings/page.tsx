import { getSettings } from "@/lib/studio/content";
import { StudioPageHeader } from "@/components/studio/studio-shell";
import SettingsForm from "@/components/studio/settings-form";

export const dynamic = "force-dynamic";

export default async function StudioSettingsPage() {
  return <><StudioPageHeader eyebrow="Workspace / settings" title="Settings" description="Editorial defaults, consent behavior, and public discovery metadata live in a small Git-backed settings file." /><SettingsForm initialSettings={await getSettings()} /></>;
}
