import { RECOGNITION_CATEGORIES } from '@/features/recognitions/utils/recognitionCopy'
import { cn } from '@/lib/utils'

export function RecognitionCategoriesGrid() {
  return (
    <section aria-label="Categorías de reconocimiento">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-hero-text">Categorías de reconocimiento</h2>
        <p className="mt-1 text-sm text-hero-text/65">
          Diferentes formas de celebrar el esfuerzo sin competencia tóxica.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {RECOGNITION_CATEGORIES.map((category) => {
          const Icon = category.icon

          return (
            <article
              key={category.id}
              className="rounded-2xl border border-white/15 bg-white/8 p-4 backdrop-blur-xl sm:p-5"
            >
              <div
                className={cn(
                  'inline-flex h-10 w-10 items-center justify-center rounded-xl border',
                  category.accent,
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-hero-text">{category.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-hero-text/70">{category.description}</p>
            </article>
          )
        })}
      </div>
    </section>
  )
}
