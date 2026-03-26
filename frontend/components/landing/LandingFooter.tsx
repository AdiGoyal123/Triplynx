const footerColumns = [
  {
    title: "Product",
    links: ["Features", "Pricing", "FAQ"],
  },
  {
    title: "Company",
    links: ["About", "Blog", "Contact"],
  },
  {
    title: "Legal",
    links: ["Privacy", "Terms", "Cookies"],
  },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-border py-10 sm:py-12">
      <div className="container">
        <div className="mb-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent">
                <span className="text-xs font-bold text-accent-foreground">TC</span>
              </div>
              <span className="font-semibold">TravelConsensus</span>
            </div>
            <p className="text-sm text-muted-foreground">
              AI-powered group travel planning for everyone.
            </p>
          </div>

          {footerColumns.map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-sm font-semibold">{col.title}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="transition-colors hover:text-accent">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 TravelConsensus. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="transition-colors hover:text-accent">
              Twitter
            </a>
            <a href="#" className="transition-colors hover:text-accent">
              LinkedIn
            </a>
            <a href="#" className="transition-colors hover:text-accent">
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
