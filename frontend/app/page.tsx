import { BenefitsSection } from "@/components/landing/BenefitsSection";
import { CtaSection } from "@/components/landing/CtaSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { ProblemSection } from "@/components/landing/ProblemSection";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingHeader />
      <main>
        <HeroSection />
        <ProblemSection />
        <FeaturesSection />
        <HowItWorksSection />
        <BenefitsSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
