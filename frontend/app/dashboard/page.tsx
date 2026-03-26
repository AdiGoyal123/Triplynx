"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Compass, LayoutDashboard, LogOut, MapPinned, Settings } from "lucide-react";
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
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "Trips", icon: MapPinned, active: false },
  { label: "Explore", icon: Compass, active: false },
  { label: "Settings", icon: Settings, active: false },
];

export default function DashboardPage() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("user@example.com");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    async function loadUser() {
      const supabase = getSupabaseClient();

      if (!supabase) {
        return;
      }

      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return;
      }

      const metadata = data.user.user_metadata ?? {};
      const resolvedName =
        metadata.full_name ?? metadata.name ?? data.user.email?.split("@")[0] ?? "User";
      const resolvedEmail = data.user.email ?? "user@example.com";
      const resolvedAvatar = metadata.avatar_url ?? metadata.picture ?? "";

      setUserName(resolvedName);
      setUserEmail(resolvedEmail);
      setAvatarUrl(resolvedAvatar);
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
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton isActive={item.active}>
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-2">
          <div className="flex items-center gap-2 rounded-md border border-border p-2 group-data-[collapsible=icon]:justify-center">
            {avatarUrl ? (
              <img src={avatarUrl} alt={userName} className="size-8 rounded-full object-cover" />
            ) : (
              <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-semibold">
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
            className="hover:border-red-300 hover:bg-red-50 hover:text-red-700"
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
          <div className="mb-4 flex items-center gap-2">
            <SidebarTrigger />
            <h1 className="text-2xl font-semibold">Dashboard</h1>
          </div>
          <p className="text-muted-foreground">Welcome to your Triplynx workspace.</p>
          {errorMessage ? <p className="mt-4 text-sm text-red-600">{errorMessage}</p> : null}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
