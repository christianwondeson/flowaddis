'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { hotelAdminFetch } from '@/lib/hotel-admin-api';
import { HotelSectionShell } from '@/components/hotel-portal/hotel-section-shell';
import { Button } from '@/components/ui/button';
import { AdminLoader } from '@/components/ui/admin-loader';
import { toast } from 'sonner';

type PoliciesForm = {
    checkin_from: string;
    checkin_to: string;
    checkout_until: string;
    cancellation_policy: string;
    pets_policy: string;
    children_policy: string;
    house_rules_text: string;
};

const EMPTY: PoliciesForm = {
    checkin_from: '14:00',
    checkin_to: '',
    checkout_until: '12:00',
    cancellation_policy: '',
    pets_policy: '',
    children_policy: '',
    house_rules_text: '',
};

export default function HotelPoliciesPage() {
    const params = useParams();
    const hotelId = String(params.hotelId || '');
    const [form, setForm] = useState<PoliciesForm>(EMPTY);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!hotelId) return;
        void (async () => {
            setLoading(true);
            try {
                const hotel = await hotelAdminFetch<{
                    policies?: Record<string, unknown> | null;
                }>(`hotels/${hotelId}`);
                const p = hotel.policies || {};
                const rules = Array.isArray(p.house_rules)
                    ? (p.house_rules as string[]).join('\n')
                    : '';
                setForm({
                    checkin_from: String(p.checkin_from || '14:00'),
                    checkin_to: String(p.checkin_to || ''),
                    checkout_until: String(p.checkout_until || '12:00'),
                    cancellation_policy: String(p.cancellation_policy || ''),
                    pets_policy: String(p.pets_policy || ''),
                    children_policy: String(p.children_policy || ''),
                    house_rules_text: rules,
                });
            } catch (e) {
                toast.error((e as Error).message);
            } finally {
                setLoading(false);
            }
        })();
    }, [hotelId]);

    const save = async () => {
        setSaving(true);
        try {
            const house_rules = form.house_rules_text
                .split('\n')
                .map((l) => l.trim())
                .filter(Boolean);
            await hotelAdminFetch(`hotels/${hotelId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    policies: {
                        checkin_from: form.checkin_from || null,
                        checkin_to: form.checkin_to || null,
                        checkout_until: form.checkout_until || null,
                        cancellation_policy: form.cancellation_policy || null,
                        pets_policy: form.pets_policy || null,
                        children_policy: form.children_policy || null,
                        house_rules,
                    },
                }),
            });
            toast.success('House rules saved  guests see these on the hotel page');
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            setSaving(false);
        }
    };

    const field = (
        label: string,
        key: keyof PoliciesForm,
        opts?: { type?: string; rows?: number; hint?: string },
    ) => (
        <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-brand-dark">{label}</span>
            {opts?.hint ? (
                <span className="block text-xs text-slate-500">{opts.hint}</span>
            ) : null}
            {opts?.rows ? (
                <textarea
                    rows={opts.rows}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={form[key]}
                    onChange={(e) =>
                        setForm((f) => ({ ...f, [key]: e.target.value }))
                    }
                />
            ) : (
                <input
                    type={opts?.type || 'text'}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={form[key]}
                    onChange={(e) =>
                        setForm((f) => ({ ...f, [key]: e.target.value }))
                    }
                />
            )}
        </label>
    );

    return (
        <HotelSectionShell
            title="House rules & hours"
            description="Check-in / check-out times and policies shown on the guest hotel detail page."
            items={[]}
        >
            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-5">
                <div className="flex justify-end">
                    <Button onClick={() => void save()} disabled={saving || loading}>
                        {saving ? 'Saving…' : 'Save policies'}
                    </Button>
                </div>

                {loading ? (
                    <AdminLoader label="Loading policies…" />
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {field('Check-in from', 'checkin_from', {
                            type: 'time',
                            hint: 'e.g. 14:00',
                        })}
                        {field('Check-in until', 'checkin_to', {
                            type: 'time',
                            hint: 'Optional late check-in cutoff',
                        })}
                        {field('Check-out until', 'checkout_until', {
                            type: 'time',
                        })}
                        <div className="sm:col-span-2">
                            {field('Cancellation policy', 'cancellation_policy', {
                                rows: 3,
                                hint: 'Property-level summary. Room rates can still have their own refundable window.',
                            })}
                        </div>
                        {field('Pets policy', 'pets_policy', { rows: 2 })}
                        {field('Children policy', 'children_policy', { rows: 2 })}
                        <div className="sm:col-span-2">
                            {field('House rules', 'house_rules_text', {
                                rows: 5,
                                hint: 'One rule per line (quiet hours, parties, ID at check-in, etc.)',
                            })}
                        </div>
                    </div>
                )}
            </div>
        </HotelSectionShell>
    );
}
