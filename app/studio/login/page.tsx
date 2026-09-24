import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { STUDIO_SESSION_COOKIE, verifyStudioSession } from "@/lib/studio/auth";
import LoginForm from "./login-form";

export default async function StudioLoginPage() {
  const token = (await cookies()).get(STUDIO_SESSION_COOKIE)?.value;
  if (await verifyStudioSession(token)) redirect("/studio");
  return <LoginForm />;
}
