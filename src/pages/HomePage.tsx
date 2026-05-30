import { useEffect } from "react"

import { Navbar } from "@/components/layout/Navbar"
import { CtaSection } from "@/features/home/sections/CtaSection"
import { FeaturesSection } from "@/features/home/sections/FeaturesSection"
import { FooterSection } from "@/features/home/sections/FooterSection"
import { HeroSection } from "@/features/home/sections/HeroSection"
import { HowItWorksSection } from "@/features/home/sections/HowItWorksSection"
import { SocialProofSection } from "@/features/home/sections/SocialProofSection"
import { handleMarketingHashOnLoad } from "@/lib/marketingNavigation"

function HomePage() {
  useEffect(() => {
    handleMarketingHashOnLoad()
  }, [])

  return (
    <main className="app-atmosphere">
      <Navbar />
      <HeroSection />
      <SocialProofSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CtaSection />
      <FooterSection />
    </main>
  )
}

export default HomePage
