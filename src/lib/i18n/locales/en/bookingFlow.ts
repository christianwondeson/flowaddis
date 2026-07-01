export const bookingFlowEn = {
    bookingFlow: {
        successTitle: 'Booking Confirmed!',
        successThankYou:
            'Thank you for choosing BookAddis. Your payment has been processed successfully and your booking is secured.',
        eticketLabel: 'E-Ticket Sent',
        eticketHint: 'Check your inbox for details',
        bookingIdLabel: 'Payment reference',
        bookingIdFallback: 'PROCESSED',
        bookingIdHint: 'Keep this reference for support and bank reconciliation',
        backToBookAddis: 'Back to BookAddis',
        stayOnBookAddis: 'Stay on BookAddis',
        viewBookingDetails: 'View Booking Details',
        cancelTitle: 'Booking Cancelled',
        cancelBody:
            'Your payment was not completed and the booking was cancelled. No charges were made to your card.',
        cancelBankHint:
            '"My bank was charged but I see this page" — Don\'t worry, any pending authorization will be automatically reversed by your bank within a few days.',
        continueOnBookAddis: 'Continue on BookAddis',
        mpgsCheckout: {
            title: 'Secure card payment',
            configuringTitle: 'Preparing secure checkout',
            redirectingTitle: 'Redirecting to payment',
            configuringHint:
                'We are connecting you to CBE / Mastercard hosted checkout. Your card details are entered on their secure page — BookAddis never sees your card number.',
            errorTitle: 'Could not open checkout',
            errorHint: 'Please try again or choose another payment method.',
            referenceLabel: 'Payment reference',
            doNotClose: 'Please do not close this window.',
            poweredBy: 'Powered by Mastercard Payment Gateway',
            invalidSessionTitle: 'Checkout session expired',
            invalidSessionHint: 'Start payment again from your booking.',
            backHome: 'Back to home',
            tryAgain: 'Try again',
        },
    },
} as const;
