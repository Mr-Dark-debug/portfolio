import { StudioPageHeader } from "@/components/studio/studio-shell";
import ToolsWorkspace from "@/components/studio/tools-workspace";

export default function StudioToolsPage() {
  return <><StudioPageHeader eyebrow="Workspace / tools" title="Tools" description="Conservative checks for links, slugs, and repository hygiene. External requests run only when you ask." /><ToolsWorkspace /></>;
}
