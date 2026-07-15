/**
 * reCAPTCHA Enterprise action names (client execute + server CreateAssessment).
 * Use Google-recommended lowercase names: https://cloud.google.com/recaptcha/docs/actions-website
 */
export const RECAPTCHA_ACTIONS = {
  LOGIN: 'login',
  SIGNUP: 'signup',
} as const;

export type RecaptchaAction =
  (typeof RECAPTCHA_ACTIONS)[keyof typeof RECAPTCHA_ACTIONS];

export const ALLOWED_RECAPTCHA_ACTIONS = new Set<string>(
  Object.values(RECAPTCHA_ACTIONS),
);
