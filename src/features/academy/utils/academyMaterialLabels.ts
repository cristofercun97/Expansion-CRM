export const ACADEMY_MATERIAL_TYPE_OPTIONS = [
  { value: 'presentation' as const, label: 'Presentación' },
  { value: 'pdf' as const, label: 'PDF' },
  { value: 'video' as const, label: 'Video' },
]

export function getAcademyMaterialTypeLabel(type: string): string {
  return ACADEMY_MATERIAL_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type
}
