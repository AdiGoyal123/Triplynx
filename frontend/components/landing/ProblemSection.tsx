import { painPoints } from "./content";

export function ProblemSection() {
  return (
    <section className="bg-muted/30 py-16 sm:py-20 md:py-28">
      <div className="container">
        <div className="mx-auto mb-12 max-w-3xl text-center sm:mb-16">
          <h2 className="mb-5 text-3xl md:text-4xl">The Challenge of Group Travel Planning</h2>
          <p className="text-base text-muted-foreground sm:text-lg">
            Organizing a trip with friends or family should not be stressful. Yet coordinating
            preferences and finding compromises is often the hardest part of travel.
          </p>
        </div>
        <div className="mb-10 grid gap-5 md:grid-cols-3 md:gap-8">
          {painPoints.map((item) => (
            <article
              key={item.title}
              className="rounded-xl border border-border bg-background p-6 transition-shadow hover:shadow-md"
            >
              <h3 className="mb-2 text-2xl text-accent">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </article>
          ))}
        </div>
        <p className="text-center text-xl font-semibold">We built Travelynx to solve this.</p>
      </div>
    </section>
  );
}
