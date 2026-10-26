import { redirect } from "next/navigation";
import { getProfile } from "@/lib/profile";
import OnboardingForm from "@/components/onboarding/form";

export default async function OnboardingPage() {
  const profile = await getProfile();
  if (profile?.onboarded) redirect("/dashboard");
  return <main className="flex min-h-screen items-center justify-center p-4"><OnboardingForm defaultName={profile?.full_name ?? ""} /></main>;
}
