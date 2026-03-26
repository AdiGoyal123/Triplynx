"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

type GoogleOneTapProps = {
  mode: "login" | "signup";
};

type GoogleCredentialResponse = {
  credential?: string;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            context?: "signin" | "signup";
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            itp_support?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with";
              width?: number;
              shape?: "rectangular" | "pill";
            }
          ) => void;
          prompt: () => void;
          cancel: () => void;
        };
      };
    };
  }
}

export function GoogleOneTap({ mode }: GoogleOneTapProps) {
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const supabase = getSupabaseClient();

    if (!googleClientId || !supabase) {
      return;
    }

    const initializeGoogle = () => {
      if (!window.google || !buttonRef.current) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        context: mode === "signup" ? "signup" : "signin",
        auto_select: false,
        cancel_on_tap_outside: true,
        itp_support: true,
        callback: async (response) => {
          if (!response.credential) {
            setErrorMessage("Google sign-in did not return a valid credential.");
            return;
          }

          setErrorMessage("");
          setIsLoading(true);

          const { error } = await supabase.auth.signInWithIdToken({
            provider: "google",
            token: response.credential,
          });

          if (error) {
            setErrorMessage(error.message);
            setIsLoading(false);
            return;
          }

          router.push("/dashboard");
          router.refresh();
        },
      });

      buttonRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        text: mode === "signup" ? "signup_with" : "signin_with",
        width: 360,
        shape: "rectangular",
      });

      window.google.accounts.id.prompt();
    };

    if (window.google) {
      initializeGoogle();
    } else {
      const scriptId = "google-identity-services";
      const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;

      if (existingScript) {
        existingScript.addEventListener("load", initializeGoogle);
        return () => existingScript.removeEventListener("load", initializeGoogle);
      }

      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogle;
      document.head.appendChild(script);
    }

    return () => {
      window.google?.accounts.id.cancel();
    };
  }, [mode, router]);

  const missingConfig = !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  return (
    <div className="mt-4">
      <div className="my-4 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-wider text-muted-foreground">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      {missingConfig ? (
        <p className="text-sm text-muted-foreground">
          Set <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> to enable Google One Tap.
        </p>
      ) : (
        <div className={isLoading ? "pointer-events-none opacity-70" : ""}>
          <div ref={buttonRef} className="flex w-full justify-center" />
        </div>
      )}

      {errorMessage ? <p className="mt-3 text-sm text-red-600">{errorMessage}</p> : null}
    </div>
  );
}
