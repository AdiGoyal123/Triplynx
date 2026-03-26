import { steps } from "./content";

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-muted/30 py-16 sm:py-20 md:py-28">
      <div className="container">
        <h2 className="mb-12 text-center text-3xl md:mb-16 md:text-4xl">
          How It Works in 5 Simple Steps
        </h2>
        <div className="mx-auto max-w-3xl">
          {steps.map((step, index) => (
            <article key={step.title} className="mb-10 flex gap-4 sm:gap-6">
              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground sm:h-11 sm:w-11">
                  {index + 1}
                </div>
                {index < steps.length - 1 ? <div className="mt-3 h-10 w-px bg-accent/30 sm:h-12" /> : null}
              </div>
              <div>
                <h3 className="mb-1 text-2xl">{step.title}</h3>
                <p className="text-sm text-muted-foreground sm:text-base">{step.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
