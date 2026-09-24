import PostEditor from "@/components/studio/post-editor";
import { StudioPageHeader } from "@/components/studio/studio-shell";

export default function NewPostPage() {
  return <><StudioPageHeader eyebrow="Content library / new" title="Start a Field Note" description="Begin privately in this browser. Nothing reaches the public site until you choose a repository action." /><PostEditor /></>;
}
