import { useEffect, useState } from "react";

import { FeatureGrid } from "@/components/home/feature-grid";
import { HeroSection } from "@/components/home/hero-section";
import { ProcessSection } from "@/components/home/process-section";
import { SocialProofSection } from "@/components/home/social-proof-section";

export default function Home() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);

    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, [isDark]);

  return (
    <main className="relative min-h-screen text-foreground">
      <HeroSection
        isDark={isDark}
        onToggleTheme={() => setIsDark((current) => !current)}
      />
      <FeatureGrid />
      <ProcessSection />
      <SocialProofSection />
    </main>
  );
}
