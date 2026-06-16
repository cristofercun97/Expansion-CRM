import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { authService } from '@/features/auth/services/auth.service'
import type { GoogleRegisterInput, LoginInput, RegisterInput } from '@/features/auth/types'
import { translateAuthError } from '@/features/auth/utils/auth-errors'
import { getDashboardPathByRole, getPostAuthRedirect } from '@/features/auth/utils/getDashboardPathByRole'
import { getFirebaseAuth } from '@/lib/firebase'
import { usersService } from '@/services/users.service'
import type { AppUser } from '@/types'

type AuthContextValue = {
  currentUser: User | null
  appUser: AppUser | null
  loading: boolean
  initialized: boolean
  isEmailVerified: boolean
  refreshUser: () => Promise<User | null>
  resendVerificationEmail: () => Promise<void>
  completeEmailVerificationCheck: () => Promise<string | null>
  registerWithEmail: (input: RegisterInput) => Promise<void>
  registerWithGoogle: (input?: GoogleRegisterInput) => Promise<string>
  loginWithEmail: (input: LoginInput) => Promise<string>
  loginWithGoogle: () => Promise<string>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

type AuthProviderProps = {
  children: ReactNode
}

async function loadAppUser(uid: string): Promise<AppUser | null> {
  try {
    return await usersService.getUserById(uid)
  } catch {
    return null
  }
}

function logAuthDevError(message: string, error: unknown): void {
  if (import.meta.env.DEV) {
    console.error(message, error)
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [appUser, setAppUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  const syncSession = useCallback(async (user: User | null) => {
    setCurrentUser(user)

    if (!user) {
      setAppUser(null)
      return
    }

    try {
      await authService.syncEmailVerificationStatus(user)

      if (user.emailVerified) {
        await authService.ensureFreshAuthToken(user)
      }

      const profile = await loadAppUser(user.uid)
      setAppUser(profile)
    } catch (error) {
      logAuthDevError('[Auth] Error al sincronizar sesión', error)
      const profile = await loadAppUser(user.uid)
      setAppUser(profile)
    }
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (user) => {
      setLoading(true)

      void syncSession(user)
        .catch((error) => {
          logAuthDevError('[Auth] Error en onAuthStateChanged', error)
        })
        .finally(() => {
          setLoading(false)
          setInitialized(true)
        })
    })

    return unsubscribe
  }, [syncSession])

  const refreshUser = useCallback(async () => {
    const auth = getFirebaseAuth()
    const user = auth.currentUser

    if (!user) {
      setCurrentUser(null)
      setAppUser(null)
      return null
    }

    setLoading(true)

    try {
      const refreshedUser = await authService.reloadCurrentUser(user)
      const profile = await loadAppUser(refreshedUser.uid)
      setCurrentUser(refreshedUser)
      setAppUser(profile)
      return refreshedUser
    } finally {
      setLoading(false)
    }
  }, [])

  const resendVerificationEmail = useCallback(async () => {
    const user = getFirebaseAuth().currentUser

    if (!user) {
      throw new Error('No hay una sesión activa.')
    }

    await authService.sendVerificationEmailToUser(user)
  }, [])

  const completeEmailVerificationCheck = useCallback(async () => {
    const refreshedUser = await refreshUser()

    if (!refreshedUser?.emailVerified) {
      return null
    }

    const profile = await loadAppUser(refreshedUser.uid)
    setAppUser(profile)

    return getDashboardPathByRole(profile?.role)
  }, [refreshUser])

  const registerWithEmail = useCallback(async (input: RegisterInput) => {
    setLoading(true)

    try {
      const user = await authService.registerWithEmail(input)
      await syncSession(user)
    } catch (error) {
      throw new Error(translateAuthError(error))
    } finally {
      setLoading(false)
    }
  }, [syncSession])

  const loginWithEmail = useCallback(async (input: LoginInput) => {
    setLoading(true)

    try {
      const user = await authService.loginWithEmail(input.email, input.password)
      await syncSession(user)
      const profile = await loadAppUser(user.uid)

      return getPostAuthRedirect(user.emailVerified, profile?.role)
    } catch (error) {
      throw new Error(translateAuthError(error))
    } finally {
      setLoading(false)
    }
  }, [syncSession])

  const loginWithGoogle = useCallback(async () => {
    setLoading(true)

    try {
      const user = await authService.loginWithGoogle()
      await syncSession(user)
      const profile = await loadAppUser(user.uid)

      return getPostAuthRedirect(user.emailVerified, profile?.role)
    } catch (error) {
      throw new Error(translateAuthError(error))
    } finally {
      setLoading(false)
    }
  }, [syncSession])

  const registerWithGoogle = useCallback(async (input: GoogleRegisterInput = {}) => {
    setLoading(true)

    try {
      const user = await authService.registerWithGoogle(input)
      await syncSession(user)
      const profile = await loadAppUser(user.uid)

      return getPostAuthRedirect(user.emailVerified, profile?.role)
    } catch (error) {
      throw new Error(translateAuthError(error))
    } finally {
      setLoading(false)
    }
  }, [syncSession])

  const logout = useCallback(async () => {
    setLoading(true)

    try {
      await authService.logoutUser()
      setAppUser(null)
      setCurrentUser(null)
    } catch (error) {
      throw new Error(translateAuthError(error))
    } finally {
      setLoading(false)
    }
  }, [])

  const isEmailVerified = Boolean(currentUser?.emailVerified)

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      appUser,
      loading,
      initialized,
      isEmailVerified,
      refreshUser,
      resendVerificationEmail,
      completeEmailVerificationCheck,
      registerWithEmail,
      registerWithGoogle,
      loginWithEmail,
      loginWithGoogle,
      logout,
    }),
    [
      appUser,
      completeEmailVerificationCheck,
      currentUser,
      initialized,
      isEmailVerified,
      loading,
      loginWithEmail,
      loginWithGoogle,
      logout,
      refreshUser,
      registerWithEmail,
      registerWithGoogle,
      resendVerificationEmail,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { AuthContext }
