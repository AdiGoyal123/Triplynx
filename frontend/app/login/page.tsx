import { AuthCard } from "@/components/auth/AuthCard";
import { GoogleOneTap } from "@/components/auth/GoogleOneTap";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
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
