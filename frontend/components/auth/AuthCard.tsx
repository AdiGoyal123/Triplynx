"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

type AuthCardProps = {
  mode: "login" | "signup";
  title: string;
  subtitle: string;
  submitLabel: string;
  footerLabel: string;
  footerActionLabel: string;
  footerHref: string;
  nameField?: boolean;
};

export function AuthCard({
  mode,
  title,
  subtitle,
  submitLabel,
  footerLabel,
  footerActionLabel,
  footerHref,
  nameField = false,
}: AuthCardProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);
    const supabase = getSupabaseClient();

    if (!supabase) {
      setErrorMessage(
        "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY"
      );
      setIsSubmitting(false);
      return;
    }

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setIsSubmitting(false);
        return;
      }

      if (data.session) {
        router.push("/dashboard");
        router.refresh();
        return;
      }

      setSuccessMessage("Signup successful. Check your email to confirm your account, then log in.");
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-sm sm:p-8">
      <div className="mb-6 text-center">
        <h1 className="mb-2 text-4xl">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {nameField ? (
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Full Name</span>
            <input
              type="text"
              placeholder="Jane Doe"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-accent"
            />
          </label>
        ) : null}

        <label className="block">
          <span className="mb-2 block text-sm font-medium">Email</span>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-accent"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium">Password</span>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-accent"
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-accent px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-accent-foreground transition hover:opacity-90 sm:text-sm"
        >
          {isSubmitting ? "Please wait..." : submitLabel}
        </button>
      </form>

      {errorMessage ? <p className="mt-4 text-sm text-red-600">{errorMessage}</p> : null}
      {successMessage ? <p className="mt-4 text-sm text-green-700">{successMessage}</p> : null}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {footerLabel}{" "}
        <Link href={footerHref} className="font-semibold text-accent hover:underline">
          {footerActionLabel}
        </Link>
      </p>
    </div>
  );
}
