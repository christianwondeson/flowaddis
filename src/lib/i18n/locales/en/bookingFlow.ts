export const bookingFlowEn = {
    bookingFlow: {
        successTitle: 'Booking Confirmed!',
        successThankYou:
            'Thank you for choosing BookAddis. Your payment has been processed successfully and your booking is secured.',
        pendingTitle: 'Complete payment on your phone',
        pendingBody:
            'A CBE Birr USSD prompt was sent to your phone. Enter your PIN to confirm. This page updates automatically when payment is received.',
        pendingAmount: 'Amount to confirm: {amount}',
        failedTitle: 'Payment failed',
        failedBody:
            'Your CBE Birr payment was not completed. You can try again from your booking or contact support with your payment reference.',
        expiredTitle: 'Payment session expired',
        expiredBody:
            'This payment request has expired. Please start checkout again to receive a new USSD prompt.',
        eticketLabel: 'E-Ticket Sent',
        eticketHint: 'Check your inbox for details',
        eticketPendingHint: 'Confirmation email is sent after payment succeeds',
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
    },
} as const;
