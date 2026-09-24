import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { STUDIO_SESSION_COOKIE, verifyStudioSession } from "@/lib/studio/auth";
import { StudioShell } from "@/components/studio/studio-shell";

export default async function ProtectedStudioLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(STUDIO_SESSION_COOKIE)?.value;
  if (!(await verifyStudioSession(token))) redirect("/studio/login");
  return <StudioShell>{children}</StudioShell>;
}
