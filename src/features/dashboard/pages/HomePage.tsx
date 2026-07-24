import { LANDING_SEO } from '@/config/seo'
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
import { DocumentSeo } from '@/features/seo/DocumentSeo'
import { LANDING_JSON_LD } from '@/features/seo/landingJsonLd'

export function HomePage() {
  return (
    <div className="bg-landing-bg text-landing-text">
      <DocumentSeo
        title={LANDING_SEO.title}
        description={LANDING_SEO.description}
        path={LANDING_SEO.canonicalPath}
        keywords={LANDING_SEO.keywords}
        type={LANDING_SEO.ogType}
        jsonLd={LANDING_JSON_LD}
      />

      <main>
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
      </main>

      <LandingFooter />
    </div>
  )
}
