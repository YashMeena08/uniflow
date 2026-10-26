import { getProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import FormShell from "@/components/settings/form-shell";
import ThemeSwitcher from "@/components/settings/theme-switcher";
import PasswordForm from "@/components/settings/password-form";
import { updateProfile, updateStudyPrefs, updateAcademic } from "./actions";

function Field({ label, name, defaultValue, type = "text", ...rest }: { label: string; name: string; defaultValue?: string | number | null; type?: string; min?: number; max?: number; list?: string }) {
  return (<div><label htmlFor={name} className="mb-1 block text-sm">{label}</label>
    <input id={name} name={name} type={type} defaultValue={defaultValue ?? ""} className="input" {...rest} /></div>);
}

export default async function SettingsPage() {
  const p = await getProfile();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const zones = Intl.supportedValuesOf("timeZone");
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <FormShell action={updateProfile} title="Profile">
        <p className="text-sm text-neutral-500">{user?.email}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name" name="full_name" defaultValue={p?.full_name} />
          <Field label="College" name="college" defaultValue={p?.college} />
          <Field label="Degree" name="degree" defaultValue={p?.degree} />
          <Field label="Branch" name="branch" defaultValue={p?.branch} />
          <Field label="Graduation year" name="graduation_year" type="number" min={2000} max={2100} defaultValue={p?.graduation_year} />
        </div>
      </FormShell>
      <ThemeSwitcher />
      <FormShell action={updateStudyPrefs} title="Study preferences">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Focus (min)" name="pomodoro_focus" type="number" min={1} max={120} defaultValue={p?.pomodoro_focus ?? 25} />
          <Field label="Short break (min)" name="pomodoro_short" type="number" min={1} max={60} defaultValue={p?.pomodoro_short ?? 5} />
          <Field label="Long break (min)" name="pomodoro_long" type="number" min={1} max={120} defaultValue={p?.pomodoro_long ?? 15} />
          <Field label="Daily study goal (min)" name="daily_study_goal_min" type="number" min={15} max={1440} defaultValue={p?.daily_study_goal_min ?? 180} />
          <Field label="Time zone" name="timezone" list="zones" defaultValue={p?.timezone ?? "UTC"} />
          <datalist id="zones">{zones.map((z) => <option key={z} value={z} />)}</datalist>
        </div>
      </FormShell>
      <FormShell action={updateAcademic} title="Academic">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Attendance target (%)" name="attendance_target" type="number" min={1} max={100} defaultValue={p?.attendance_target ?? 75} />
          <Field label="Semester" name="semester" type="number" min={1} max={12} defaultValue={p?.semester} />
        </div>
      </FormShell>
      <PasswordForm />
    </div>
  );
}
