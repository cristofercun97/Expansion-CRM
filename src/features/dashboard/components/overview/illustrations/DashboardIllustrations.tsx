import { cn } from '@/lib/utils'

type IllustrationProps = {
  className?: string
  size?: 'sm' | 'header' | 'hero' | 'empty'
}

const GOLD = '#D9A441'
const TEAL = '#6AC5BC'
const SOFT = 'rgba(255,255,255,0.35)'

const SIZE_CLASS: Record<NonNullable<IllustrationProps['size']>, string> = {
  sm: 'h-12 w-16',
  header: 'h-14 w-[4.5rem] sm:h-16 sm:w-20',
  hero: 'h-[7.5rem] w-[9.5rem] sm:h-32 sm:w-40',
  empty: 'h-20 w-24 sm:h-24 sm:w-28',
}

function illustrationClass(size: IllustrationProps['size'], className?: string) {
  return cn('shrink-0', SIZE_CLASS[size ?? 'header'], className)
}

export function HeroDirectionIllustration({ className, size = 'hero' }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 160 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(illustrationClass(size, className), 'opacity-100')}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="hero-panel-glow" x1="20%" y1="80%" x2="80%" y2="20%">
          <stop offset="0%" stopColor={TEAL} stopOpacity="0.12" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0.18" />
        </linearGradient>
        <linearGradient id="hero-path-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={TEAL} />
          <stop offset="100%" stopColor={GOLD} />
        </linearGradient>
      </defs>

      <rect x="8" y="8" width="144" height="112" rx="20" fill="url(#hero-panel-glow)" stroke="rgba(255,255,255,0.08)" />

      {/* Brújula — dirección clara */}
      <circle cx="52" cy="64" r="28" stroke={SOFT} strokeWidth="1" />
      <circle cx="52" cy="64" r="20" stroke={TEAL} strokeWidth="1" strokeOpacity="0.45" />
      <path d="M52 46 L54 64 L52 82 L50 64 Z" fill={GOLD} fillOpacity="0.35" stroke={GOLD} strokeWidth="1.2" />
      <path d="M34 64 L52 62 L70 64 L52 66 Z" fill={TEAL} fillOpacity="0.28" stroke={TEAL} strokeWidth="1" />
      <circle cx="52" cy="64" r="3" fill={GOLD} />

      {/* Ruta ascendente con hitos */}
      <path
        d="M88 92 C 98 88, 104 72, 112 58 C 118 48, 124 38, 132 28"
        stroke="url(#hero-path-gradient)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="1 0"
      />
      <circle cx="88" cy="92" r="4" fill={TEAL} fillOpacity="0.7" stroke={TEAL} strokeWidth="1" />
      <circle cx="112" cy="58" r="4" fill={TEAL} fillOpacity="0.85" stroke={TEAL} strokeWidth="1" />
      <circle cx="132" cy="28" r="6" stroke={GOLD} strokeWidth="1.6" fill="rgba(217,164,65,0.15)" />
      <path d="M129 32 L132 22 L135 32" stroke={GOLD} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />

      {/* Pequeñas estrellas decorativas */}
      <path d="M118 24 L119 27 L122 27 L119.5 29 L120.5 32 L118 30 L115.5 32 L116.5 29 L114 27 L117 27 Z" fill={GOLD} fillOpacity="0.5" />
    </svg>
  )
}

export function GrowthPathIllustration({ className, size = 'hero' }: IllustrationProps) {
  return <HeroDirectionIllustration className={className} size={size} />
}

export function GoalMountainIllustration({ className, size = 'header' }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 120 88"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={illustrationClass(size, className)}
      aria-hidden="true"
    >
      <path
        d="M8 70 L42 26 L58 44 L104 14 L104 70 Z"
        stroke={SOFT}
        strokeWidth="1.2"
        fill="rgba(106,197,188,0.1)"
      />
      <path d="M42 26 L58 44 L104 14" stroke={TEAL} strokeWidth="2" strokeLinejoin="round" />
      <circle cx="104" cy="14" r="6" stroke={GOLD} strokeWidth="1.8" fill="rgba(217,164,65,0.15)" />
      <path d="M100 18 L104 8 L108 18" stroke={GOLD} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M4 70 H116" stroke={SOFT} strokeWidth="1" />
    </svg>
  )
}

export function PodiumIllustration({ className, size = 'header' }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 112 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={illustrationClass(size, className)}
      aria-hidden="true"
    >
      <rect x="10" y="44" width="24" height="24" rx="3" stroke={TEAL} strokeWidth="1.5" fill="rgba(106,197,188,0.1)" />
      <rect x="42" y="28" width="24" height="40" rx="3" stroke={GOLD} strokeWidth="2" fill="rgba(217,164,65,0.12)" />
      <rect x="74" y="50" width="24" height="18" rx="3" stroke={SOFT} strokeWidth="1.5" fill="rgba(255,255,255,0.04)" />
      <circle cx="54" cy="16" r="8" stroke={GOLD} strokeWidth="1.8" fill="rgba(217,164,65,0.15)" />
      <path d="M50 20 L54 10 L58 20" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function PrizeIllustration({ className, size = 'header' }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={illustrationClass(size, className)}
      aria-hidden="true"
    >
      <path
        d="M22 28 H58 V40 C58 50 50 56 40 56 C30 56 22 50 22 40 Z"
        stroke={GOLD}
        strokeWidth="1.8"
        fill="rgba(217,164,65,0.14)"
      />
      <path d="M40 56 V66 M30 66 H50" stroke={TEAL} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M26 28 C26 20 32 14 40 14 C48 14 54 20 54 28" stroke={GOLD} strokeWidth="1.8" />
      <path d="M14 30 L22 34 M66 30 L58 34" stroke={TEAL} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function AttentionRadarIllustration({ className, size = 'header' }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 88 88"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={illustrationClass(size, className)}
      aria-hidden="true"
    >
      <circle cx="44" cy="44" r="32" stroke={SOFT} strokeWidth="1" />
      <circle cx="44" cy="44" r="22" stroke={TEAL} strokeWidth="1.2" strokeOpacity="0.65" />
      <circle cx="44" cy="44" r="10" stroke={GOLD} strokeWidth="1.6" fill="rgba(217,164,65,0.08)" />
      <path d="M44 44 L64 30" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="64" cy="30" r="4" fill={GOLD} fillOpacity="0.85" />
    </svg>
  )
}

export function ActivityPulseIllustration({ className, size = 'header' }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 112 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(illustrationClass(size, className), size === 'header' && 'h-12 w-28')}
      aria-hidden="true"
    >
      <path
        d="M4 32 L18 32 L26 14 L36 38 L46 20 L58 32 L68 18 L78 32 L90 24 L108 32"
        stroke={TEAL}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="26" cy="14" r="3" fill={GOLD} />
      <circle cx="68" cy="18" r="3" fill={GOLD} fillOpacity="0.75" />
    </svg>
  )
}

export function TeamPathIllustration({ className, size = 'header' }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 100 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={illustrationClass(size, className)}
      aria-hidden="true"
    >
      <circle cx="18" cy="32" r="10" stroke={TEAL} strokeWidth="1.8" fill="rgba(106,197,188,0.1)" />
      <circle cx="50" cy="32" r="10" stroke={GOLD} strokeWidth="1.8" fill="rgba(217,164,65,0.1)" />
      <circle cx="82" cy="32" r="10" stroke={SOFT} strokeWidth="1.4" />
      <path d="M28 32 H40 M60 32 H72" stroke={SOFT} strokeWidth="1.4" strokeDasharray="4 3" />
    </svg>
  )
}

export function QuickLinksCompassIllustration({ className, size = 'header' }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={illustrationClass(size, className)}
      aria-hidden="true"
    >
      <circle cx="36" cy="36" r="28" stroke={SOFT} strokeWidth="1.4" />
      <circle cx="36" cy="36" r="4" fill={GOLD} />
      <path d="M36 14 L38 36 L36 58 L34 36 Z" fill={TEAL} fillOpacity="0.4" stroke={TEAL} strokeWidth="1.2" />
      <path d="M14 36 L36 34 L58 36 L36 38 Z" fill={GOLD} fillOpacity="0.3" stroke={GOLD} strokeWidth="1.2" />
    </svg>
  )
}

export function EmptyStateSparkIllustration({ className, size = 'empty' }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('mx-auto', illustrationClass(size, className))}
      aria-hidden="true"
    >
      <path
        d="M36 10 L38 30 L58 32 L38 34 L36 54 L34 34 L14 32 L34 30 Z"
        stroke={GOLD}
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill="rgba(217,164,65,0.14)"
      />
      <circle cx="54" cy="18" r="2.5" fill={TEAL} fillOpacity="0.85" />
      <circle cx="16" cy="48" r="2" fill={TEAL} fillOpacity="0.65" />
    </svg>
  )
}
