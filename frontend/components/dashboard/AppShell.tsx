"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Plane,
  Users,
  MessageSquareText,
  Vote,
  ListChecks,
  Rows3,
  Settings2,
  LogOut,
} from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Trips", href: "/dashboard/trips", icon: Plane },
  { label: "Participants", href: "/dashboard/participants", icon: Users },
  { label: "Surveys (SMS)", href: "/dashboard/surveys", icon: MessageSquareText },
  { label: "Consensus / Voting", href: "/dashboard/consensus", icon: Vote },
  { label: "Itineraries", href: "/dashboard/itineraries", icon: ListChecks },
  { label: "Live Trip Board", href: "/dashboard/live-trip-board", icon: Rows3 },
  { label: "Settings & Integrations", href: "/dashboard/settings-integrations", icon: Settings2 },
  // TODO: Future sidebar items (add routes before enabling)
  // { label: "Pricing & Availability", href: "/dashboard/pricing-availability", icon: Settings2 },
  // { label: "Monitoring", href: "/dashboard/monitoring", icon: Settings2 },
  // { label: "Rate Limits & Abuse", href: "/dashboard/rate-limits-abuse", icon: Settings2 },
  // { label: "Prompt Versions", href: "/dashboard/prompt-versions", icon: Settings2 },
];

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("user@example.com");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    async function loadUser() {
      const supabase = getSupabaseClient();
      if (!supabase) return;

      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) return;

      const metadata = data.user.user_metadata ?? {};
      setUserName(metadata.full_name ?? metadata.name ?? data.user.email?.split("@")[0] ?? "User");
      setUserEmail(data.user.email ?? "user@example.com");
      setAvatarUrl(metadata.avatar_url ?? metadata.picture ?? "");
    }

    loadUser();
  }, []);

  async function handleSignOut() {
    setErrorMessage("");
    setIsSigningOut(true);

    const supabase = getSupabaseClient();
    if (!supabase) {
      setErrorMessage(
        "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY"
      );
      setIsSigningOut(false);
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      setErrorMessage(error.message);
      setIsSigningOut(false);
      return;
    }

    router.push("/login");
    router.refresh();
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="px-4 py-4 group-data-[collapsible=icon]:px-2">
          <div className="flex h-8 items-center group-data-[collapsible=icon]:justify-center">
            <p className="text-lg font-semibold group-data-[collapsible=icon]:hidden">Travelynx</p>
            <p className="hidden text-lg font-semibold group-data-[collapsible=icon]:block">T</p>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={pathname === item.href}
                      tooltip={item.label}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-2 group-data-[collapsible=icon]:p-1.5">
          <div className="flex items-center gap-2 rounded-md border border-border p-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:p-0">
            {avatarUrl ? (
              <span className="relative size-8 shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-border/60">
                <img
                  src={avatarUrl}
                  alt={userName}
                  className="size-full object-cover"
                  sizes="32px"
                />
              </span>
            ) : (
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold ring-1 ring-border/60">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-medium">{userName}</p>
              <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="hover:border-red-300 hover:bg-red-50 hover:text-red-700 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0"
          >
            <LogOut />
            <span className="group-data-[collapsible=icon]:hidden">
              {isSigningOut ? "Signing out..." : "Sign out"}
            </span>
          </Button>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <main className="flex min-h-svh flex-1 flex-col p-6">
          <div className="mb-4">
            <SidebarTrigger />
          </div>
          {children}
          {errorMessage ? <p className="mt-4 text-sm text-red-600">{errorMessage}</p> : null}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
