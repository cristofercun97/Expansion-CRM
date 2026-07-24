import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Search } from 'lucide-react'
import { Input } from '@/components/ui'
import { useToast } from '@/components/ui/toast/ToastProvider'
import { adminGlassCardClassName } from '@/features/admin/constants/adminNavItems'
import { formatContactDateTime } from '@/features/contacts/utils/formatContactDate'
import { usersService } from '@/services/users.service'
import type { AppUser, UserActivationStatus, UserRole, UserStatus } from '@/types'
import { cn } from '@/lib/utils'

type RoleFilter = 'all' | 'user' | 'member'
type AssignableRole = 'user' | 'member'

function formatRole(role: UserRole | undefined): string {
  if (role === 'admin') {
    return 'Admin'
  }

  if (role === 'leader') {
    return 'Líder'
  }

  if (role === 'member') {
    return 'Miembro'
  }

  if (role === 'prospect') {
    return 'Prospecto'
  }

  if (role === 'user') {
    return 'Usuario'
  }

  return 'Sin rol'
}

function formatAccountStatus(status: UserStatus): string {
  if (status === 'active') {
    return 'Activa'
  }

  if (status === 'inactive') {
    return 'Inactiva'
  }

  return 'Pendiente verificación'
}

function formatActivationStatus(status: UserActivationStatus | undefined): string {
  if (status === 'active') {
    return 'Activado'
  }

  if (status === 'pending') {
    return 'En revisión'
  }

  if (status === 'rejected') {
    return 'Rechazado'
  }

  if (status === 'expired') {
    return 'Expirado'
  }

  return 'Sin activar'
}

function resolveDisplayName(user: AppUser): string {
  const profileName = user.profile?.fullName?.trim() ?? ''
  const displayName = user.displayName?.trim() ?? ''

  return profileName || displayName || 'Sin nombre'
}

function matchesSearch(user: AppUser, query: string): boolean {
  if (!query) {
    return true
  }

  const haystack = [
    resolveDisplayName(user),
    user.email,
    user.phone,
    user.profile?.phone ?? '',
    user.uid,
    formatRole(user.role),
    formatActivationStatus(user.activationStatus),
  ]
    .join(' ')
    .toLowerCase()

  return haystack.includes(query)
}

function matchesRoleFilter(user: AppUser, filter: RoleFilter): boolean {
  if (filter === 'all') {
    return true
  }

  return user.role === filter
}

function canAssignRole(user: AppUser): boolean {
  return user.role !== 'admin'
}

function resolveSelectValue(role: UserRole | undefined): AssignableRole | '' {
  if (role === 'member' || role === 'user') {
    return role
  }

  return ''
}

const ROLE_FILTERS: Array<{ id: RoleFilter; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'user', label: 'Usuario' },
  { id: 'member', label: 'Miembro' },
]

export function AdminUsersPanel() {
  const { showToast } = useToast()
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [updatingUid, setUpdatingUid] = useState<string | null>(null)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setLoadError('')

    try {
      const allUsers = await usersService.listAllUsers()
      setUsers(allUsers)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No pudimos cargar los usuarios de Expansión.'
      setLoadError(message)
      setUsers([])
      showToast(message, 'info')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  const normalizedSearch = search.trim().toLowerCase()

  const filteredUsers = useMemo(
    () =>
      users.filter(
        (user) => matchesRoleFilter(user, roleFilter) && matchesSearch(user, normalizedSearch),
      ),
    [users, roleFilter, normalizedSearch],
  )

  const stats = useMemo(() => {
    let pendingActivation = 0
    let activeMembership = 0
    let roleUser = 0
    let roleMember = 0

    for (const user of users) {
      if (user.activationStatus === 'pending') {
        pendingActivation += 1
      }

      if (user.activationStatus === 'active') {
        activeMembership += 1
      }

      if (user.role === 'user') {
        roleUser += 1
      }

      if (user.role === 'member') {
        roleMember += 1
      }
    }

    return {
      total: users.length,
      pendingActivation,
      activeMembership,
      roleUser,
      roleMember,
    }
  }, [users])

  async function handleRoleChange(user: AppUser, nextRole: AssignableRole) {
    if (!canAssignRole(user) || user.role === nextRole) {
      return
    }

    setUpdatingUid(user.uid)

    try {
      await usersService.updateUserRole(user.uid, nextRole)
      setUsers((current) =>
        current.map((entry) => (entry.uid === user.uid ? { ...entry, role: nextRole } : entry)),
      )
      showToast(
        nextRole === 'member'
          ? `${resolveDisplayName(user)} marcado como Miembro.`
          : `${resolveDisplayName(user)} marcado como Usuario.`,
        'success',
      )
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No pudimos actualizar el rol del usuario.'
      showToast(message, 'info')
    } finally {
      setUpdatingUid(null)
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumen de usuarios">
        <article className={adminGlassCardClassName}>
          <p className="text-xs uppercase tracking-wide text-hero-text/55">Total</p>
          <p className="mt-2 text-2xl font-semibold text-hero-text">{stats.total}</p>
          <p className="mt-1 text-sm text-hero-text/65">Usuarios en Expansión</p>
        </article>
        <article className={adminGlassCardClassName}>
          <p className="text-xs uppercase tracking-wide text-hero-text/55">Rol Usuario</p>
          <p className="mt-2 text-2xl font-semibold text-hero-text">{stats.roleUser}</p>
          <p className="mt-1 text-sm text-hero-text/65">Cuentas tipo usuario</p>
        </article>
        <article className={adminGlassCardClassName}>
          <p className="text-xs uppercase tracking-wide text-hero-text/55">Rol Miembro</p>
          <p className="mt-2 text-2xl font-semibold text-teal-accent">{stats.roleMember}</p>
          <p className="mt-1 text-sm text-hero-text/65">Cuentas tipo miembro</p>
        </article>
        <article className={adminGlassCardClassName}>
          <p className="text-xs uppercase tracking-wide text-hero-text/55">Activación</p>
          <p className="mt-2 text-2xl font-semibold text-gold-light">
            {stats.activeMembership}
            <span className="ml-1 text-base font-medium text-hero-text/50">
              / {stats.pendingActivation} rev.
            </span>
          </p>
          <p className="mt-1 text-sm text-hero-text/65">Activos / en revisión</p>
        </article>
      </section>

      <div className={adminGlassCardClassName}>
        <div className="flex flex-col gap-4 border-b border-white/10 pb-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-hero-text">Todos los usuarios</h2>
              <p className="mt-1 text-sm text-hero-text/70">
                Filtra y asigna rol Usuario o Miembro para organizar el listado.
              </p>
            </div>

            <div className="relative w-full sm:max-w-xs">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-hero-text/45"
                aria-hidden="true"
              />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre, email o rol"
                aria-label="Buscar usuarios"
                className="border-white/15 bg-white/10 pl-9 text-hero-text placeholder:text-hero-text/45 focus:border-gold/50 focus:ring-gold/20"
              />
            </div>
          </div>

          <div
            className="flex flex-wrap gap-2"
            role="tablist"
            aria-label="Filtrar por rol"
          >
            {ROLE_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                role="tab"
                aria-selected={roleFilter === filter.id}
                onClick={() => setRoleFilter(filter.id)}
                className={cn(
                  'min-h-10 rounded-lg border px-4 text-sm font-medium transition-colors',
                  roleFilter === filter.id
                    ? 'border-gold bg-gold/15 text-gold-light'
                    : 'border-white/15 bg-white/5 text-hero-text/75 hover:border-white/25 hover:bg-white/8',
                )}
              >
                {filter.label}
                {filter.id === 'user' ? ` (${stats.roleUser})` : null}
                {filter.id === 'member' ? ` (${stats.roleMember})` : null}
                {filter.id === 'all' ? ` (${stats.total})` : null}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-5">
          {loading ? (
            <p className="flex items-center gap-2 text-sm text-hero-text/70">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Cargando usuarios...
            </p>
          ) : loadError ? (
            <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {loadError}
            </p>
          ) : filteredUsers.length === 0 ? (
            <p className="text-sm text-hero-text/70">
              {users.length === 0
                ? 'No hay usuarios registrados todavía.'
                : 'Ningún usuario coincide con el filtro o la búsqueda.'}
            </p>
          ) : (
            <>
              <p className="mb-4 text-xs text-hero-text/55">
                Mostrando {filteredUsers.length} de {users.length}
              </p>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-hero-text/50">
                      <th className="px-3 py-3 font-medium">Usuario</th>
                      <th className="px-3 py-3 font-medium">Rol</th>
                      <th className="px-3 py-3 font-medium">Cuenta</th>
                      <th className="px-3 py-3 font-medium">Activación</th>
                      <th className="px-3 py-3 font-medium">Email</th>
                      <th className="px-3 py-3 font-medium">Alta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => {
                      const isUpdating = updatingUid === user.uid
                      const selectable = canAssignRole(user)

                      return (
                        <tr
                          key={user.uid}
                          className="border-b border-white/5 align-top last:border-0"
                        >
                          <td className="px-3 py-3">
                            <p className="font-medium text-hero-text">{resolveDisplayName(user)}</p>
                            <p className="mt-0.5 break-all text-hero-text/65">{user.email || '—'}</p>
                            {user.phone || user.profile?.phone ? (
                              <p className="mt-0.5 text-xs text-hero-text/50">
                                {user.phone || user.profile?.phone}
                              </p>
                            ) : null}
                          </td>
                          <td className="px-3 py-3">
                            {selectable ? (
                              <div className="flex flex-col gap-1.5">
                                <label className="sr-only" htmlFor={`role-${user.uid}`}>
                                  Rol de {resolveDisplayName(user)}
                                </label>
                                <select
                                  id={`role-${user.uid}`}
                                  value={resolveSelectValue(user.role)}
                                  disabled={isUpdating}
                                  onChange={(event) => {
                                    const nextRole = event.target.value as AssignableRole
                                    if (nextRole !== 'user' && nextRole !== 'member') {
                                      return
                                    }
                                    void handleRoleChange(user, nextRole)
                                  }}
                                  className={cn(
                                    'min-h-10 w-full min-w-[140px] rounded-lg border border-white/15 bg-petrol-deep/80 px-3 text-sm text-hero-text',
                                    'focus:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/20',
                                    'disabled:cursor-not-allowed disabled:opacity-60',
                                  )}
                                >
                                  {resolveSelectValue(user.role) === '' ? (
                                    <option value="" disabled>
                                      {formatRole(user.role)}
                                    </option>
                                  ) : null}
                                  <option value="user">Usuario</option>
                                  <option value="member">Miembro</option>
                                </select>
                                {isUpdating ? (
                                  <span className="inline-flex items-center gap-1 text-xs text-hero-text/55">
                                    <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                                    Guardando...
                                  </span>
                                ) : null}
                              </div>
                            ) : (
                              <span className="text-hero-text/80">{formatRole(user.role)}</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-hero-text/80">
                            {formatAccountStatus(user.status)}
                          </td>
                          <td className="px-3 py-3 text-hero-text/80">
                            {formatActivationStatus(user.activationStatus)}
                          </td>
                          <td className="px-3 py-3 text-hero-text/80">
                            {user.emailVerified ? 'Verificado' : 'Sin verificar'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-hero-text/70">
                            {formatContactDateTime(user.createdAt ?? null)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
