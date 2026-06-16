import type { ReactNode } from 'react'
import { AuthProvider } from '@/app/providers/AuthProvider'
import { ToastProvider } from '@/components/ui/toast/ToastProvider'

type AppProvidersProps = {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ToastProvider>
      <AuthProvider>{children}</AuthProvider>
    </ToastProvider>
  )
}
