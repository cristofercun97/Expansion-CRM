import { LandingBenefits } from '@/features/landing/components/LandingBenefits'
import { LandingContact } from '@/features/landing/components/LandingContact'
import { LandingCta } from '@/features/landing/components/LandingCta'
import { LandingFaqs } from '@/features/landing/components/LandingFaqs'
import { LandingFooter } from '@/features/landing/components/LandingFooter'
import { LandingHero } from '@/features/landing/components/LandingHero'
import { LandingHowItWorks } from '@/features/landing/components/LandingHowItWorks'
import { LandingNav } from '@/features/landing/components/LandingNav'
import { LandingProblems } from '@/features/landing/components/LandingProblems'
import { LandingSolution } from '@/features/landing/components/LandingSolution'

export function HomePage() {
  return (
    <div className="bg-landing-bg text-landing-text">
      <div className="relative min-h-screen bg-hero-bg">
        <LandingNav />
        <LandingHero />
      </div>

      <LandingProblems />
      <LandingSolution />
      <LandingHowItWorks />
      <LandingBenefits />
      <LandingCta />
      <LandingContact />
      <LandingFaqs />
      <LandingFooter />
    </div>
  )
}
