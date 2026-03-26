import { navLinks } from "./content";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="container py-3 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent">
              <span className="text-xs font-bold text-accent-foreground">TC</span>
            </div>
            <span className="text-lg font-semibold">TravelConsensus</span>
          </div>
          <nav className="flex flex-wrap items-center gap-5 text-sm">
            {navLinks.map((item) => (
              <a key={item.href} href={item.href} className="transition-colors hover:text-accent">
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
