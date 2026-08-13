export type PaymentSuccessMethod =
    | 'telebirr'
    | 'cbebirr'
    | 'stripe'
    | 'mpgs'
    | 'pay_on_site';

/** Result handed from PaymentForm → booking modal → Receipt. */
export type PaymentSuccessResult = {
    method: PaymentSuccessMethod;
    /** Settled / reserved amount from Nest (or charged USD for cards). */
    amount: number;
    currency: 'ETB' | 'USD';
    paymentReference?: string | null;
    bookingId?: string | null;
};

export function paymentMethodLabel(method: PaymentSuccessMethod): string {
    switch (method) {
        case 'cbebirr':
            return 'CBE Birr';
        case 'telebirr':
            return 'Telebirr';
        case 'stripe':
            return 'Card (Stripe)';
        case 'mpgs':
            return 'Card (Mastercard)';
        case 'pay_on_site':
            return 'Pay at property';
        default:
            return 'Payment';
    }
}
