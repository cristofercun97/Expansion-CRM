import { EmptyState, PageHeader } from '@/components/ui'

export function TasksPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Tareas" subtitle="Organiza tu seguimiento diario." />
      <EmptyState title="Tareas en construcción" description="Pronto podrás gestionar tus tareas aquí." />
    </div>
  )
}
