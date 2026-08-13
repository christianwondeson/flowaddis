/** Shared annotate types (safe for client + server). */

export type RecaptchaAnnotation = 'LEGITIMATE' | 'FRAUDULENT';

export type RecaptchaAnnotateReason =
    | 'CORRECT_PASSWORD'
    | 'INCORRECT_PASSWORD'
    | 'INITIATED_TWO_FACTOR'
    | 'PASSED_TWO_FACTOR'
    | 'FAILED_TWO_FACTOR';
