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
    <div className="min-h-screen bg-background px-3 text-foreground sm:px-4 md:px-6">
      <LandingHeader />
      <main className="space-y-4 py-4 sm:space-y-6 sm:py-6 md:space-y-8 md:py-8">
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
