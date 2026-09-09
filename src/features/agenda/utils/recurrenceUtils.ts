export {
  RECURRENCE_FREQUENCY_LABELS,
  RECURRENCE_MAX_OCCURRENCES,
  assertValidClientRequestId,
  countConflictingOccurrenceStarts,
  expandRecurrenceStarts,
  occurrenceStartAtMs,
  type RecurrenceEditScope,
  type RecurrenceEndMode,
  type RecurrenceFrequency,
  type RecurrenceRuleInput,
} from '../../../../functions/src/meetings/recurrenceLogic'

export function createRecurrenceClientRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 32)
  }
  return `rec${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
}
