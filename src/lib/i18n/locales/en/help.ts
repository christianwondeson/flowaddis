export const helpEn = {
    help: {
        title: 'Help Center',
        subtitle:
            'Report booking issues, payment disputes, duplicates, or technical problems. We’ll help you resolve it fast.',
        contactSupport: 'Contact support',
        contactSupportHint:
            'For faster resolution, include the booking ID and transaction ID if you have them.',
        phoneLabel: 'Phone',
        emailLabel: 'Email',
        whatsAppLabel: 'WhatsApp',
        chatWithUs: 'Chat with us',
        createTicket: 'Create a support ticket',
        createTicketHint: 'This will be visible to our admin support team.',
        ticketSuccess:
            'Ticket submitted successfully. Your ticket ID is {id}.',
        ticketSubmitError: 'Failed to submit ticket',
        genericError: 'Something went wrong',
        fullName: 'Full name',
        phoneOptional: 'Phone (optional)',
        service: 'Service',
        issueType: 'Issue type',
        bookingIdOptional: 'Booking ID (optional)',
        transactionIdOptional: 'Transaction ID (optional)',
        bookingIdPlaceholder: 'e.g. BK-1234',
        transactionIdPlaceholder: 'e.g. TX-9821',
        subject: 'Subject',
        message: 'Message',
        messagePlaceholder:
            'Explain the issue (what happened, expected result, any duplication/conflict details)...',
        submitting: 'Submitting…',
        submitTicket: 'Submit ticket',
        services: {
            hotels: 'Hotels',
            flights: 'Flights',
            conferences: 'Conferences / Events',
            shuttles: 'Shuttles',
            other: 'Other',
        },
        categories: {
            booking_issue: 'Booking issue',
            duplicate_transaction: 'Duplicate transaction',
            payment_dispute: 'Payment dispute',
            refund_request: 'Refund request',
            technical_issue: 'Technical issue',
            other: 'Other',
        },
    },
} as const;
