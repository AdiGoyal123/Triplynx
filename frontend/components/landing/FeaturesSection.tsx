import { features } from "./content";

export function FeaturesSection() {
  return (
    <section id="features" className="py-16 sm:py-20 md:py-28">
      <div className="container">
        <h2 className="mb-12 text-center text-3xl md:mb-16 md:text-4xl">
          Intelligent Features Built for Group Harmony
        </h2>

        <div className="space-y-14 md:space-y-20">
          {features.map((feature) => (
            <article key={feature.title} className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
              <div className={feature.reverse ? "order-2" : "order-1"}>
                <img
                  src={feature.image}
                  alt={feature.alt}
                  className="mx-auto h-auto w-full max-w-md rounded-xl shadow-lg"
                />
              </div>
              <div className={feature.reverse ? "order-1" : "order-2"}>
                <h3 className="mb-4 text-3xl">{feature.title}</h3>
                <p className="mb-6 text-muted-foreground">{feature.description}</p>
                <ul className="space-y-3">
                  {feature.bullets.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-2 inline-block h-2 w-2 rounded-full bg-accent" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
