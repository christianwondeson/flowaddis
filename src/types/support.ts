export type SupportTicketStatus = 'open' | 'in_review' | 'resolved' | 'rejected';

export type SupportTicketCategory =
  | 'booking_issue'
  | 'duplicate_transaction'
  | 'payment_dispute'
  | 'technical_issue'
  | 'refund_request'
  | 'other';

export type SupportServiceType = 'hotels' | 'flights' | 'conferences' | 'shuttles' | 'other';

export interface SupportTicket {
  id: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO

  status: SupportTicketStatus;
  category: SupportTicketCategory;
  service: SupportServiceType;
  priority: 'low' | 'medium' | 'high';

  name: string;
  email: string;
  phone?: string;

  bookingId?: string;
  transactionId?: string;

  subject: string;
  message: string;

  // Admin fields
  assignedTo?: string;
  internalNote?: string;
  resolution?: string;
}

export type CreateSupportTicketInput = Omit<
  SupportTicket,
  'id' | 'createdAt' | 'updatedAt' | 'status' | 'assignedTo' | 'internalNote' | 'resolution'
> & {
  status?: SupportTicket['status'];
};

