import { ArrowLeftRight } from 'lucide-react'
import { Button } from '@/components/ui'
import { TEAM_CONTEXT_SELECTOR_COPY } from '@/features/team/utils/teamContextUtils'
import { cn } from '@/lib/utils'

type TeamContextSwitcherProps = {
  mode: 'member' | 'leader'
  onSwitch: () => void
  className?: string
}

export function TeamContextSwitcher({ mode, onSwitch, className }: TeamContextSwitcherProps) {
  const modeLabel = mode === 'member' ? 'Miembro' : 'Líder'

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-hero-text/75">
        Contexto: {modeLabel}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="border-white/20 bg-transparent text-hero-text hover:bg-white/10"
        onClick={onSwitch}
      >
        <ArrowLeftRight className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
        {TEAM_CONTEXT_SELECTOR_COPY.switchLabel}
      </Button>
    </div>
  )
}
