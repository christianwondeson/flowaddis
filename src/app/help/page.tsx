"use client";

import React, { useMemo, useState } from 'react';
import { Send, ShieldAlert, Ticket, Phone, Mail, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CreateSupportTicketInput, SupportServiceType, SupportTicketCategory } from '@/types/support';
import { BOOKADDIS_ETHIOPIA_PHONE, BOOKADDIS_INTERNATIONAL_LINES } from '@/lib/contact-phones';

const SERVICES: { value: SupportServiceType; label: string }[] = [
  { value: 'hotels', label: 'Hotels' },
  { value: 'flights', label: 'Flights' },
  { value: 'conferences', label: 'Conferences / Events' },
  { value: 'shuttles', label: 'Shuttles' },
  { value: 'other', label: 'Other' },
];

const CATEGORIES: { value: SupportTicketCategory; label: string }[] = [
  { value: 'booking_issue', label: 'Booking issue' },
  { value: 'duplicate_transaction', label: 'Duplicate transaction' },
  { value: 'payment_dispute', label: 'Payment dispute' },
  { value: 'refund_request', label: 'Refund request' },
  { value: 'technical_issue', label: 'Technical issue' },
  { value: 'other', label: 'Other' },
];

export default function HelpPage() {
  const [submitting, setSubmitting] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<CreateSupportTicketInput>({
    name: '',
    email: '',
    phone: '',
    service: 'hotels',
    category: 'booking_issue',
    priority: 'medium',
    bookingId: '',
    transactionId: '',
    subject: '',
    message: '',
  });

  const canSubmit = useMemo(() => {
    return Boolean(form.name.trim() && form.email.trim() && form.subject.trim() && form.message.trim());
  }, [form]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    setSuccessId(null);

    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          phone: form.phone?.trim() || undefined,
          bookingId: form.bookingId?.trim() || undefined,
          transactionId: form.transactionId?.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to submit ticket');

      setSuccessId(data?.item?.id || 'Created');
      setForm((prev) => ({
        ...prev,
        bookingId: '',
        transactionId: '',
        subject: '',
        message: '',
      }));
    } catch (err: any) {
      setError(err?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-gray/30 pt-16 md:pt-20">
      <section className="bg-brand-primary text-white py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center mb-3">
              <Ticket className="w-6 h-6" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold">Help Center</h1>
            <p className="text-white/90 mt-2">
              Report booking issues, payment disputes, duplicates, or technical problems. We’ll help you resolve it fast.
            </p>
          </div>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="container mx-auto px-4 sm:px-6 lg:px-6">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-xl font-extrabold text-brand-dark flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-brand-primary" />
                Contact support
              </h2>
              <p className="text-sm text-gray-600 mt-2">
                For faster resolution, include the booking ID and transaction ID if you have them.
              </p>

              <div className="mt-6 space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-brand-primary mt-0.5 shrink-0" />
                  <div className="space-y-3">
                    <div className="font-semibold text-brand-dark">Phone</div>
                    <div>
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-0.5">Ethiopia</div>
                      <a className="text-gray-700 hover:text-brand-primary" href={`tel:${BOOKADDIS_ETHIOPIA_PHONE.tel}`}>
                        {BOOKADDIS_ETHIOPIA_PHONE.display}
                      </a>
                    </div>
                    {BOOKADDIS_INTERNATIONAL_LINES.map((line) => (
                      <div key={line.region}>
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-0.5">{line.region}</div>
                        <a className="text-gray-700 hover:text-brand-primary" href={`tel:${line.tel}`}>
                          {line.display}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-brand-primary mt-0.5" />
                  <div>
                    <div className="font-semibold text-brand-dark">Email</div>
                    <a href="mailto:info@bookaddis.com" className="text-brand-primary hover:underline">
                      info@bookaddis.com
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MessageCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-semibold text-brand-dark">WhatsApp</div>
                    <a className="text-green-700 hover:text-green-800" href="https://wa.me/251921929159" target="_blank" rel="noreferrer">
                      Chat with us
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-xl font-extrabold text-brand-dark">Create a support ticket</h2>
              <p className="text-sm text-gray-600 mt-1">This will be visible to our admin support team.</p>

              <form onSubmit={submit} className="mt-6 space-y-5">
                {successId && (
                  <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                    Ticket submitted successfully. Your ticket ID is <span className="font-extrabold">{successId}</span>.
                  </div>
                )}
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Full name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                  <Input
                    label="Phone (optional)"
                    value={form.phone || ''}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Service</label>
                    <select
                      value={form.service}
                      onChange={(e) => setForm({ ...form, service: e.target.value as SupportServiceType })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                    >
                      {SERVICES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Issue type</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value as SupportTicketCategory })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Input
                    label="Booking ID (optional)"
                    value={form.bookingId || ''}
                    onChange={(e) => setForm({ ...form, bookingId: e.target.value })}
                    placeholder="e.g. BK-1234"
                  />
                  <Input
                    label="Transaction ID (optional)"
                    value={form.transactionId || ''}
                    onChange={(e) => setForm({ ...form, transactionId: e.target.value })}
                    placeholder="e.g. TX-9821"
                  />
                </div>

                <Input
                  label="Subject"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  required
                />

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                  <textarea
                    rows={6}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none"
                    placeholder="Explain the issue (what happened, expected result, any duplication/conflict details)..."
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" className="bg-brand-primary hover:bg-brand-secondary text-white gap-2" disabled={!canSubmit || submitting}>
                    <Send className="w-4 h-4" />
                    {submitting ? 'Submitting…' : 'Submit ticket'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

