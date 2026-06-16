import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { RootLayout } from '@/components/layout/RootLayout'
import { OwnerModuleRoute } from '@/app/router/OwnerModuleRoute'
import { AcademyProgressRoute } from '@/app/router/AcademyProgressRoute'
import { ProtectedRoute } from '@/app/router/ProtectedRoute'
import { RoleProtectedRoute } from '@/app/router/RoleProtectedRoute'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        lazy: async () => {
          const { HomePage } = await import('@/features/dashboard/pages/HomePage')
          return { Component: HomePage }
        },
      },
      {
        path: 'login',
        lazy: async () => {
          const { LoginPage } = await import('@/features/auth/pages/LoginPage')
          return { Component: LoginPage }
        },
      },
      {
        path: 'recuperar-contrasena',
        lazy: async () => {
          const { ForgotPasswordPage } = await import('@/features/auth/pages/ForgotPasswordPage')
          return { Component: ForgotPasswordPage }
        },
      },
      {
        path: 'registro',
        lazy: async () => {
          const { RegisterPage } = await import('@/features/auth/pages/RegisterPage')
          return { Component: RegisterPage }
        },
      },
      {
        path: 'registro/:referralCode',
        lazy: async () => {
          const { RegisterPage } = await import('@/features/auth/pages/RegisterPage')
          return { Component: RegisterPage }
        },
      },
      {
        path: 'verificar-email',
        lazy: async () => {
          const { VerifyEmailPage } = await import('@/features/auth/pages/VerifyEmailPage')
          return { Component: VerifyEmailPage }
        },
      },
      {
        path: 'p/:slug',
        lazy: async () => {
          const { PublicPresentationPage } = await import(
            '@/features/presentation/pages/PublicPresentationPage'
          )
          return { Component: PublicPresentationPage }
        },
      },
    ],
  },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        lazy: async () => {
          const { DashboardPage } = await import('@/features/dashboard/pages/DashboardPage')
          return { Component: DashboardPage }
        },
      },
      {
        path: 'dashboard/presentacion',
        lazy: async () => {
          const { PresentationPage } = await import('@/features/presentation/pages/PresentationPage')
          return {
            Component: () => (
              <OwnerModuleRoute>
                <PresentationPage />
              </OwnerModuleRoute>
            ),
          }
        },
      },
      {
        path: 'dashboard/presentacion/vista-previa',
        lazy: async () => {
          const { PresentationPreviewPage } = await import(
            '@/features/presentation/pages/PresentationPreviewPage'
          )
          return {
            Component: () => (
              <OwnerModuleRoute>
                <PresentationPreviewPage />
              </OwnerModuleRoute>
            ),
          }
        },
      },
      {
        path: 'dashboard/contactos',
        lazy: async () => {
          const { ContactsPage } = await import('@/features/contacts/pages/ContactsPage')
          return {
            Component: () => (
              <OwnerModuleRoute>
                <ContactsPage />
              </OwnerModuleRoute>
            ),
          }
        },
      },
      {
        path: 'dashboard/radar',
        lazy: async () => {
          const { RadarPage } = await import('@/features/radar/pages/RadarPage')
          return {
            Component: () => (
              <OwnerModuleRoute>
                <RadarPage />
              </OwnerModuleRoute>
            ),
          }
        },
      },
      {
        path: 'dashboard/academia',
        lazy: async () => {
          const { AcademiaDashboardPage } = await import(
            '@/features/dashboard/pages/AcademiaDashboardPage'
          )
          return { Component: AcademiaDashboardPage }
        },
      },
      {
        path: 'dashboard/academia/grupo/:teamId',
        lazy: async () => {
          const { AcademyMemberGroupPage } = await import(
            '@/features/academy/pages/AcademyMemberGroupPage'
          )
          return { Component: AcademyMemberGroupPage }
        },
      },
      {
        path: 'dashboard/progreso-academia',
        lazy: async () => {
          const { AcademyProgressPage } = await import(
            '@/features/academy/pages/AcademyProgressPage'
          )
          return {
            Component: () => (
              <AcademyProgressRoute>
                <AcademyProgressPage />
              </AcademyProgressRoute>
            ),
          }
        },
      },
      {
        path: 'dashboard/plan',
        lazy: async () => {
          const { PlanDashboardPage } = await import('@/features/dashboard/pages/PlanDashboardPage')
          return { Component: PlanDashboardPage }
        },
      },
      {
        path: 'dashboard/mi-grupo',
        lazy: async () => {
          const { MyGroupPage } = await import('@/features/team/pages/MyGroupPage')
          return { Component: MyGroupPage }
        },
      },
      {
        path: 'dashboard/reconocimientos',
        lazy: async () => {
          const { ReconocimientosDashboardPage } = await import(
            '@/features/dashboard/pages/ReconocimientosDashboardPage'
          )
          return { Component: ReconocimientosDashboardPage }
        },
      },
      {
        path: 'leader',
        lazy: async () => {
          const { LeaderHomePage } = await import('@/features/leaders/pages/LeaderHomePage')
          return { Component: LeaderHomePage }
        },
      },
      {
        path: 'leader/leads',
        lazy: async () => {
          const { LeadsPage } = await import('@/features/leads/pages/LeadsPage')
          return { Component: LeadsPage }
        },
      },
      {
        path: 'leader/landing',
        lazy: async () => {
          const { LeaderLandingPage } = await import('@/features/landing/pages/LeaderLandingPage')
          return { Component: LeaderLandingPage }
        },
      },
      {
        path: 'leader/tasks',
        lazy: async () => {
          const { TasksPage } = await import('@/features/tasks/pages/TasksPage')
          return { Component: TasksPage }
        },
      },
      {
        path: 'leader/academy',
        lazy: async () => {
          const { AcademyPage } = await import('@/features/academy/pages/AcademyPage')
          return { Component: AcademyPage }
        },
      },
      {
        path: 'admin',
        element: (
          <RoleProtectedRoute allowedRoles={['admin']}>
            <Outlet />
          </RoleProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: <Navigate to="activacion" replace />,
          },
          {
            path: 'activacion',
            lazy: async () => {
              const { AdminActivationPage } = await import(
                '@/features/admin/pages/AdminActivationPage'
              )
              return { Component: AdminActivationPage }
            },
          },
          {
            path: 'usuarios',
            lazy: async () => {
              const { AdminUsersPage } = await import('@/features/admin/pages/AdminUsersPage')
              return { Component: AdminUsersPage }
            },
          },
        ],
      },
    ],
  },
])
