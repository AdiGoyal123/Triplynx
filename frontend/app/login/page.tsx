import { AuthCard } from "@/components/auth/AuthCard";
import { BackToLanding } from "@/components/auth/back-to-landing";
import { GoogleOneTap } from "@/components/auth/GoogleOneTap";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <div className="absolute left-4 top-6 md:left-8 md:top-8">
        <BackToLanding />
      </div>
      <div className="w-full max-w-md">
        <AuthCard
          mode="login"
          title="Login"
          subtitle="Welcome back to Travelynx"
          submitLabel="Login"
          footerLabel="Don't have an account?"
          footerActionLabel="Signup"
          footerHref="/signup"
        />
        <GoogleOneTap mode="login" />
      </div>
    </main>
  );
}
