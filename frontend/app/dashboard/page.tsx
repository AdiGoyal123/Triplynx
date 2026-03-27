"use client";

import { useEffect } from "react";
import { PageIntro } from "@/components/dashboard/PageIntro";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  useEffect(() => {
    async function callHelloWorld() {
      const supabase = getSupabaseClient();

      if (!supabase) {
        console.error(
          "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY"
        );
        return;
      }

      const { data, error } = await supabase.functions.invoke("hello-world", {
        body: { name: "Triplynx" },
      });

      if (error) {
        console.error("hello-world function error:", error);
        return;
      }

      console.log("hello-world function response:", data);
    }

    callHelloWorld();
  }, []);

  return <PageIntro title="Dashboard" description="Welcome to your Travelynx dashboard." />;
}
