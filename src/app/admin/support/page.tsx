"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import type { SupportTicket, SupportTicketStatus } from '@/types/support';
import { CheckCircle2, Clock, Filter, LifeBuoy, Search, ShieldAlert, XCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

function statusLabel(status: SupportTicketStatus) {
  switch (status) {
    case 'open':
      return 'Open';
    case 'in_review':
      return 'In review';
    case 'resolved':
      return 'Resolved';
    case 'rejected':
      return 'Rejected';
  }
}

function statusBadge(status: SupportTicketStatus) {
  switch (status) {
    case 'open':
      return 'bg-brand-primary/10 text-brand-primary border-brand-primary/20';
    case 'in_review':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'resolved':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'rejected':
      return 'bg-red-50 text-red-700 border-red-200';
  }
}

export default function AdminSupportPage() {
  const [items, setItems] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | SupportTicketStatus>('all');
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState('');
  const [resolution, setResolution] = useState('');

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const url = new URL('/api/admin/support-tickets', window.location.origin);
      if (status !== 'all') url.searchParams.set('status', status);
      if (q.trim()) url.searchParams.set('q', q.trim());
      const res = await fetch(url.toString());
      const data = await res.json();
      setItems(data?.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const openTicket = (t: SupportTicket) => {
    setSelected(t);
    setNote(t.internalNote || '');
    setResolution(t.resolution || '');
    setModalOpen(true);
  };

  const quickStats = useMemo(() => {
    const open = items.filter((t) => t.status === 'open').length;
    const review = items.filter((t) => t.status === 'in_review').length;
    const resolved = items.filter((t) => t.status === 'resolved').length;
    const rejected = items.filter((t) => t.status === 'rejected').length;
    return { open, review, resolved, rejected };
  }, [items]);

  const savePatch = async (patch: Partial<Pick<SupportTicket, 'status' | 'internalNote' | 'resolution'>>) => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/support-tickets/${encodeURIComponent(selected.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (res.ok && data?.item) {
        setSelected(data.item);
        await fetchTickets();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-dark flex items-center gap-2">
            <LifeBuoy className="w-6 h-6 text-brand-primary" />
            Support & Disputes
          </h1>
          <p className="text-gray-500">Resolve booking issues, duplicates, transaction conflicts, and technical problems.</p>
        </div>
        <Button onClick={fetchTickets} className="bg-brand-primary hover:bg-brand-secondary text-white">
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Open</span>
            <div className="w-8 h-8 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-brand-dark mt-2">{quickStats.open}</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">In review</span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-brand-dark mt-2">{quickStats.review}</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Resolved</span>
            <div className="w-8 h-8 rounded-xl bg-green-50 text-green-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-brand-dark mt-2">{quickStats.resolved}</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Rejected</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-700 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-brand-dark mt-2">{quickStats.rejected}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by ticket ID, email, booking ID, transaction ID…"
            className="pl-10 bg-gray-50 border-transparent focus:bg-white"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') fetchTickets();
            }}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="rounded-xl border-gray-100 gap-2">
              <Filter className="w-4 h-4" />
              {status === 'all' ? 'All status' : statusLabel(status)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl">
            <DropdownMenuItem onClick={() => setStatus('all')}>All</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatus('open')}>Open</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatus('in_review')}>In review</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatus('resolved')}>Resolved</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatus('rejected')}>Rejected</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button onClick={fetchTickets} className="bg-brand-primary hover:bg-brand-secondary text-white gap-2">
          <Search className="w-4 h-4" />
          Search
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Ticket</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Service</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array(6)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={7} className="px-6 py-4">
                        <div className="h-10 bg-gray-50 rounded-lg w-full" />
                      </td>
                    </tr>
                  ))
              ) : items.length ? (
                items.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-extrabold text-brand-dark">{t.subject}</div>
                      <div className="text-xs text-gray-400 font-mono">{t.id}</div>
                      {(t.bookingId || t.transactionId) && (
                        <div className="text-[11px] text-gray-500 mt-1">
                          {t.bookingId ? <span className="mr-3">Booking: {t.bookingId}</span> : null}
                          {t.transactionId ? <span>TX: {t.transactionId}</span> : null}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-brand-dark">{t.name}</div>
                      <div className="text-xs text-gray-500">{t.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-brand-gray text-brand-dark">
                        {t.service}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600">
                        {t.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${statusBadge(t.status)}`}>
                        {statusLabel(t.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                      {new Date(t.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="outline" className="rounded-xl border-gray-100" onClick={() => openTicket(t)}>
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 font-medium">
                    No tickets found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Resolve ticket">
        {selected ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ticket</div>
                <div className="font-extrabold text-brand-dark mt-1">{selected.subject}</div>
                <div className="text-xs text-gray-500 font-mono mt-1">{selected.id}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</div>
                <div className="font-extrabold text-brand-dark mt-1">{selected.name}</div>
                <div className="text-xs text-gray-500 mt-1">{selected.email}</div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Message</div>
              <div className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{selected.message}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Internal note</label>
                <textarea
                  rows={5}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none"
                  placeholder="Admin notes (e.g. verified duplicate, requested logs, contacted payment provider...)"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Resolution (customer-facing)</label>
                <textarea
                  rows={5}
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none"
                  placeholder="Resolution summary (e.g. refunded, rebooked, confirmed single charge...)"
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl border-gray-100"
                  disabled={saving}
                  onClick={() => savePatch({ internalNote: note, resolution })}
                >
                  Save notes
                </Button>
                <Button
                  type="button"
                  className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl"
                  disabled={saving}
                  onClick={() => savePatch({ status: 'in_review', internalNote: note, resolution })}
                >
                  Mark in review
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                <Button
                  type="button"
                  className="bg-green-600 hover:bg-green-700 text-white rounded-xl"
                  disabled={saving}
                  onClick={() => savePatch({ status: 'resolved', internalNote: note, resolution })}
                >
                  Resolve
                </Button>
                <Button
                  type="button"
                  className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
                  disabled={saving}
                  onClick={() => savePatch({ status: 'rejected', internalNote: note, resolution })}
                >
                  Reject
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

