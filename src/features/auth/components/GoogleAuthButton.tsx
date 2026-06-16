import { Button } from '@/components/ui'
import { GoogleIcon } from '@/features/auth/components/GoogleIcon'

type GoogleAuthButtonProps = {
  label: string
  onClick: () => void
  disabled?: boolean
  loading?: boolean
}

export function GoogleAuthButton({
  label,
  onClick,
  disabled = false,
  loading = false,
}: GoogleAuthButtonProps) {
  return (
    <Button
      type="button"
      size="lg"
      variant="outline"
      className="h-11 w-full gap-3 border-white/25 bg-white/10 text-hero-text hover:border-white/40 hover:bg-white/15"
      onClick={onClick}
      disabled={disabled || loading}
    >
      <GoogleIcon />
      {loading ? 'Conectando...' : label}
    </Button>
  )
}
