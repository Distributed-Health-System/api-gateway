export const ROUTE_PREFIXES: Record<string, string> = {
  '/patients': 'PATIENT_SERVICE_URL',
  '/doctors': 'DOCTOR_SERVICE_URL',
  '/appointments': 'APPOINTMENT_SERVICE_URL',
  '/telemedicine': 'TELEMEDICINE_SERVICE_URL',
  '/notifications': 'NOTIFICATION_SERVICE_URL',
  '/symptom-checker': 'AI_SERVICE_URL',
};

export const APP_ROLES = ['patient', 'doctor', 'admin'];
