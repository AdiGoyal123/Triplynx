export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-20 md:py-28">
      <div className="container grid items-center gap-10 md:grid-cols-2 md:gap-16">
        <div>
          <h1 className="mb-5 text-4xl leading-tight sm:text-5xl lg:text-6xl">
            Plan Group Trips That <span className="text-accent">Everyone Loves</span>
          </h1>
          <p className="mb-8 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Stop endless group chats and conflicting preferences. Travelynx uses intelligent
            AI and fair voting to create personalized itineraries that make everyone happy.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="#cta"
              className="inline-flex items-center justify-center rounded-md bg-accent px-6 py-3 text-xs font-semibold uppercase tracking-widest text-accent-foreground transition hover:opacity-90 sm:text-sm"
            >
              Plan Your Next Adventure
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-md border border-border px-6 py-3 text-xs font-semibold uppercase tracking-widest transition hover:bg-muted/50 sm:text-sm"
            >
              Watch Demo
            </a>
          </div>
        </div>
        <div>
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663473413459/NFhnpDi9BdBHmRNJEsSFq3/hero-travel-group-eq8r436VEkSdXHrtqPr4Gv.webp"
            alt="Happy group of travelers at sunset"
            className="h-auto w-full rounded-xl shadow-lg"
          />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-secondary to-accent/30" />
    </section>
  );
}
