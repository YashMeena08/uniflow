import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutDashboard, CheckSquare, BookOpen, FileText, CalendarCheck, Timer, BarChart3, StickyNote, CalendarDays, MoreHorizontal, Settings, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/profile";

const nav = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", Icon: CheckSquare },
  { href: "/assignments", label: "Assignments", Icon: FileText },
  { href: "/subjects", label: "Subjects", Icon: BookOpen },
  { href: "/attendance", label: "Attendance", Icon: CalendarCheck },
  { href: "/study", label: "Study", Icon: Timer },
  { href: "/analytics", label: "Analytics", Icon: BarChart3 },
  { href: "/notes", label: "Notes", Icon: StickyNote },
  { href: "/calendar", label: "Calendar", Icon: CalendarDays },
  { href: "/settings", label: "Settings", Icon: Settings },
];

const primary = ["/dashboard", "/tasks", "/study", "/calendar"];

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const profile = await getProfile();
  if (profile && !profile.onboarded) redirect("/onboarding");
  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden w-56 shrink-0 border-r border-neutral-200 p-4 dark:border-neutral-800 md:block">
        <p className="mb-6 text-lg font-semibold">Student OS</p>
        <nav className="space-y-1" aria-label="Main">
          {nav.map(({ href, label, Icon }) => (
            <Link key={href} href={href} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <Icon size={16} /> {label}
            </Link>
          ))}
        </nav>
        <form action={signOut} className="mt-8">
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-500"><LogOut size={16} /> Log out</button>
        </form>
      </aside>
      <main className="flex-1 p-4 pb-24 md:p-8">{children}</main>
      <nav aria-label="Mobile" className="fixed inset-x-0 bottom-0 flex items-center justify-around border-t border-neutral-200 bg-white py-2 dark:border-neutral-800 dark:bg-neutral-900 md:hidden">
        {nav.filter((n) => primary.includes(n.href)).map(({ href, label, Icon }) => (
          <Link key={href} href={href} className="flex min-w-16 flex-col items-center text-xs"><Icon size={18} />{label}</Link>
        ))}
        <details className="relative">
          <summary className="flex min-w-16 cursor-pointer list-none flex-col items-center text-xs"><MoreHorizontal size={18} />More</summary>
          <div className="absolute bottom-12 right-0 w-44 space-y-1 rounded-xl border border-neutral-200 bg-white p-2 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
            {nav.filter((n) => !primary.includes(n.href)).map(({ href, label, Icon }) => (
              <Link key={href} href={href} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"><Icon size={16} />{label}</Link>
            ))}
            <form action={signOut}><button className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-500"><LogOut size={16} />Log out</button></form>
          </div>
        </details>
      </nav>
    </div>
  );
}
