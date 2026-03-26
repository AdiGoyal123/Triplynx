export function CtaSection() {
  return (
    <section
      id="cta"
      className="border-y border-border bg-gradient-to-br from-accent/5 to-secondary/10 py-16 sm:py-20 md:py-28"
    >
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-5 text-3xl md:text-4xl">Ready to Plan Your Best Group Trip Yet?</h2>
          <p className="mb-8 text-base text-muted-foreground sm:text-lg">
            Join groups already using TravelConsensus to plan trips that everyone loves.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href="#"
              className="inline-flex items-center justify-center rounded-md bg-accent px-6 py-3 text-xs font-semibold uppercase tracking-widest text-accent-foreground transition hover:opacity-90 sm:text-sm"
            >
              Start Planning Now
            </a>
            <a
              href="#features"
              className="inline-flex items-center justify-center rounded-md border border-border px-6 py-3 text-xs font-semibold uppercase tracking-widest transition hover:bg-muted/50 sm:text-sm"
            >
              Learn More
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
