/**
 * Mirrors Nest `CustomerBookingSummary` from GET /api/v1/bookings/me.
 */
export type CustomerBookingStatus =
    | 'INITIATED'
    | 'PAID'
    | 'CONFIRMED'
    | 'REFUNDED'
    | 'FAILED';

export interface CustomerBookingSummary {
    id: string;
    booking_type: string;
    source: string;
    status: CustomerBookingStatus;
    amount: number;
    currency: string;
    created_at: string;
    title: string;
    subtitle?: string;
    external_item_id: string;
}
