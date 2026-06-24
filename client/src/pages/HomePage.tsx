import { useEffect, useState } from "react"
import { Navigate, useLocation } from "react-router-dom"

import { useAuthSession } from "@/components/auth/AuthSessionProvider"
import { AuthFormMessage } from "@/components/auth/AuthFormMessage"
import { Navbar } from "@/components/layout/Navbar"
import { CtaSection } from "@/features/home/sections/CtaSection"
import { FeaturesSection } from "@/features/home/sections/FeaturesSection"
import { FooterSection } from "@/features/home/sections/FooterSection"
import { HeroSection } from "@/features/home/sections/HeroSection"
import { HowItWorksSection } from "@/features/home/sections/HowItWorksSection"
import { SocialProofSection } from "@/features/home/sections/SocialProofSection"
import {
  handleMarketingHashOnLoad,
  isSupabaseAuthCallbackHash,
} from "@/lib/marketingNavigation"
import { ROUTES } from "@/lib/routes"

function HomePage() {
  const location = useLocation()
  const { isAuthenticated, isLoading } = useAuthSession()
  const [deletedNotice, setDeletedNotice] = useState(
    () => (location.state as { accountDeleted?: boolean } | null)?.accountDeleted === true
  )

  useEffect(() => {
    handleMarketingHashOnLoad()
  }, [])

  useEffect(() => {
    if (!deletedNotice) return
    const timer = window.setTimeout(() => setDeletedNotice(false), 6000)
    return () => window.clearTimeout(timer)
  }, [deletedNotice])

  if (
    !isLoading &&
    isAuthenticated &&
    !deletedNotice &&
    isSupabaseAuthCallbackHash()
  ) {
    return <Navigate to={ROUTES.dashboard} replace />
  }

  return (
    <main className="marketing-page app-atmosphere overflow-x-hidden">
      {deletedNotice ? (
        <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
          <AuthFormMessage variant="success" className="max-w-md shadow-[var(--shadow-medium)]">
            Your account has been permanently deleted.
          </AuthFormMessage>
        </div>
      ) : null}
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
