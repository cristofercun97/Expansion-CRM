import { HandHeart, Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui'
import { useToast } from '@/components/ui/toast/ToastProvider'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { SendTeamRecognitionModal } from '@/features/recognitions/components/SendTeamRecognitionModal'
import { TeamRecognitionCard } from '@/features/recognitions/components/TeamRecognitionCard'
import { useTeamRecognitions } from '@/features/recognitions/hooks/useTeamRecognitions'
import type { RecognitionsViewRole } from '@/features/recognitions/utils/recognitionAccess'
import {
  SEND_TEAM_RECOGNITION_MODAL,
  TEAM_RECOGNITIONS_SECTION,
} from '@/features/recognitions/utils/teamRecognitionCopy'

type TeamRecognitionsSectionProps = {
  teamId: string
  viewRole: RecognitionsViewRole
}

export function TeamRecognitionsSection({ teamId, viewRole }: TeamRecognitionsSectionProps) {
  const { currentUser, appUser } = useAuth()
  const { showToast } = useToast()
  const [modalOpen, setModalOpen] = useState(false)

  const viewerUid = currentUser?.uid ?? null
  const senderName =
    appUser?.displayName?.trim() ||
    currentUser?.displayName?.trim() ||
    currentUser?.email?.split('@')[0] ||
    'Líder del equipo'

  const { recognitions, loading, error, reload } = useTeamRecognitions({
    teamId,
    viewerUid,
    viewRole,
  })

  const sectionTitle = useMemo(
    () =>
      viewRole === 'leader'
        ? TEAM_RECOGNITIONS_SECTION.leaderTitle
        : TEAM_RECOGNITIONS_SECTION.recentTitle,
    [viewRole],
  )

  const emptyMessage = useMemo(
    () =>
      viewRole === 'leader'
        ? TEAM_RECOGNITIONS_SECTION.leaderEmpty
        : TEAM_RECOGNITIONS_SECTION.memberEmpty,
    [viewRole],
  )

  function handleSent() {
    showToast(SEND_TEAM_RECOGNITION_MODAL.successToast, 'success')
    reload()
  }

  function handleError(message: string) {
    showToast(message, 'info')
  }

  return (
    <section id="team-recognitions" className="space-y-4 scroll-mt-24">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <HandHeart className="h-5 w-5 text-teal-accent" aria-hidden="true" />
          <div>
            <h2 className="text-lg font-semibold text-hero-text">{sectionTitle}</h2>
            {viewRole === 'leader' ? (
              <p className="text-sm text-hero-text/65">{TEAM_RECOGNITIONS_SECTION.recentTitle}</p>
            ) : null}
          </div>
        </div>

        {viewRole === 'leader' && viewerUid ? (
          <Button
            type="button"
            className="shrink-0 bg-gold text-petrol-deep hover:bg-gold-light"
            onClick={() => setModalOpen(true)}
          >
            {TEAM_RECOGNITIONS_SECTION.leaderButton}
          </Button>
        ) : null}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-white/15 bg-white/8 px-5 py-8 backdrop-blur-xl">
          <p className="flex items-center justify-center gap-2 text-sm text-hero-text/70">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Cargando reconocimientos...
          </p>
        </div>
      ) : error ? (
        <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : recognitions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-5 py-6 backdrop-blur-xl">
          <p className="text-sm leading-relaxed text-hero-text/70">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {recognitions.map((recognition) => (
            <TeamRecognitionCard key={recognition.id} recognition={recognition} />
          ))}
        </div>
      )}

      {viewRole === 'leader' && viewerUid ? (
        <SendTeamRecognitionModal
          open={modalOpen}
          teamId={teamId}
          senderUid={viewerUid}
          senderName={senderName}
          onClose={() => setModalOpen(false)}
          onSent={handleSent}
          onError={handleError}
        />
      ) : null}
    </section>
  )
}
