import Link from "next/link";

type AuthCardProps = {
  title: string;
  subtitle: string;
  submitLabel: string;
  footerLabel: string;
  footerActionLabel: string;
  footerHref: string;
  nameField?: boolean;
};

export function AuthCard({
  title,
  subtitle,
  submitLabel,
  footerLabel,
  footerActionLabel,
  footerHref,
  nameField = false,
}: AuthCardProps) {
  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-sm sm:p-8">
      <div className="mb-6 text-center">
        <h1 className="mb-2 text-4xl">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <form className="space-y-4">
        {nameField ? (
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Full Name</span>
            <input
              type="text"
              placeholder="Jane Doe"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-accent"
            />
          </label>
        ) : null}

        <label className="block">
          <span className="mb-2 block text-sm font-medium">Email</span>
          <input
            type="email"
            placeholder="you@example.com"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-accent"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium">Password</span>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-accent"
          />
        </label>

        <button
          type="button"
          className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-accent px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-accent-foreground transition hover:opacity-90 sm:text-sm"
        >
          {submitLabel}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {footerLabel}{" "}
        <Link href={footerHref} className="font-semibold text-accent hover:underline">
          {footerActionLabel}
        </Link>
      </p>
    </div>
  );
}
