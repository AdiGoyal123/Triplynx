"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Compass, LayoutDashboard, MapPinned, Settings } from "lucide-react";
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
          <Button type="button" variant="outline" onClick={handleSignOut} disabled={isSigningOut}>
            {isSigningOut ? "Signing out..." : "Sign out"}
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
