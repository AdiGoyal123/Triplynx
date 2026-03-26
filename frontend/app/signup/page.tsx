import { AuthCard } from "@/components/auth/AuthCard";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <AuthCard
        title="Signup"
        subtitle="Create your TravelConsensus account"
        submitLabel="Create Account"
        footerLabel="Already have an account?"
        footerActionLabel="Login"
        footerHref="/login"
        nameField
      />
    </main>
  );
}
