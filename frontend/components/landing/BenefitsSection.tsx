import { benefits } from "./content";

export function BenefitsSection() {
  return (
    <section className="py-16 sm:py-20 md:py-28">
      <div className="container">
        <h2 className="mb-12 text-center text-3xl md:mb-16 md:text-4xl">
          Why Groups Choose TravelConsensus
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {benefits.map((item) => (
            <article
              key={item.title}
              className="rounded-xl border border-border bg-background p-6 transition-all duration-300 hover:border-accent hover:shadow-lg"
            >
              <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
                ✦
              </div>
              <h3 className="mb-2 text-3xl">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
