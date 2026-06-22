export const REFERRAL_PAYOUT_COPY = {
  requestSectionTitle: 'Solicitar pago',
  requestSectionDescription:
    'Cuando tengas recompensas listas para solicitar pago, puedes enviar una solicitud para que el equipo realice el pago manual fuera de EXPANSIÓN. El admin revisará tu solicitud de pago.',
  payableReady: 'Recompensas listas para solicitar pago',
  requestedInReview: 'Recompensas ya solicitadas',
  activeRequestNote: 'Tienes una solicitud de pago en revisión.',
  requestButton: 'Solicitar pago',
  noPayableEmpty: 'Aún no tienes recompensas listas para pago.',
  myRequestsTitle: 'Mis solicitudes de pago',
  myRequestsEmpty: 'Aún no has enviado solicitudes de pago.',
  requestSuccessToast: 'Solicitud mandada con éxito 💸',
  requestSuccessModalTitle: 'Felicitaciones 🎉',
  requestSuccessModalDescription: 'En un momento llegará tu comisión',
  requestSuccessModalButton: 'Entendido',
  paymentMethodModalTitle: 'Método para recibir el pago',
  paymentMethodModalNote:
    'No introduzcas datos de tarjeta. El pago será manual por el método indicado.',
  paymentMethodModalAmountLabel: 'Cantidad a solicitar',
  paymentMethodModalAmountHint:
    'Puedes solicitar desde 10 €. El sistema reservará automáticamente las recompensas necesarias para cubrir el monto solicitado.',
  paymentMethodModalAvailableBalance: 'Saldo disponible',
  paymentMethodModalMinimumWithdrawal: 'Retiro mínimo',
  paymentMethodModalAmountPlaceholder: 'Ej. 10',
  minimumWithdrawalNote: 'El retiro mínimo es de 10 €.',
  adminPageTitle: 'Pagos',
  adminPageSubtitle: 'Gestiona solicitudes de pago manual del Programa de Recomendación.',
  adminEmpty: 'No hay solicitudes de pago por revisar.',
  adminMarkPaidTitle: 'Marcar como pagada',
  adminMarkPaidDescription:
    'Confirma solo si ya realizaste el pago manual fuera de EXPANSIÓN.',
  adminRejectTitle: 'Rechazar solicitud',
  adminReturnToPayable: 'Devolver recompensas a pagables',
  adminCancelRewardsWarning: 'Las recompensas quedarán canceladas.',
} as const

export const REFERRAL_PAYOUT_STATUS_LABELS = {
  pending: 'En revisión',
  approved: 'Aprobada',
  paid: 'Pagada',
  rejected: 'Rechazada',
  cancelled: 'Cancelada',
} as const

export const REFERRAL_PAYOUT_PAYMENT_TYPE_LABELS = {
  bank: 'Cuenta bancaria',
  crypto: 'Criptomoneda',
  paypal: 'PayPal',
  other: 'Otro',
} as const
