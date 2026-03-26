type PageIntroProps = {
  title: string;
  description: string;
};

export function PageIntro({ title, description }: PageIntroProps) {
  return (
    <>
      <h1 className="mb-2 text-2xl font-semibold">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
    </>
  );
}
