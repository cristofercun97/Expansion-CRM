export function scrollToRecognitionSection(sectionId: string): void {
  document.getElementById(sectionId)?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}
