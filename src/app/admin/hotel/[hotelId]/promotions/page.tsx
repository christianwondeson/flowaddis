'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { hotelAdminFetch } from '@/lib/hotel-admin-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { AdminLoader } from '@/components/ui/admin-loader';
import { toast } from 'sonner';
import { Calendar as CalendarIcon, Percent, Tag, X } from 'lucide-react';
import {
    normalizePromotions,
    PROMOTION_TYPE_LABELS,
    type HotelPromotion,
    type HotelPromotionType,
} from '@/lib/hotel-promotions';
import { formatAdminDate } from '@/lib/admin-date-format';
import { formatDateLocal, parseDateLocal } from '@/lib/date-utils';

function AdminDateField({
    label,
    value,
    onChange,
    minDate,
}: {
    label: string;
    value: string | null | undefined;
    onChange: (iso: string | null) => void;
    minDate?: Date;
}) {
    return (
        <div className="space-y-1.5">
            <Label>{label}</Label>
            <div className="flex gap-2">
                <Popover
                    trigger={
                        <button
                            type="button"
                            className="flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-left hover:border-brand-primary/40"
                        >
                            <CalendarIcon className="w-4 h-4 text-slate-400 shrink-0" />
                            <span
                                className={
                                    value
                                        ? 'text-brand-dark font-medium'
                                        : 'text-slate-400'
                                }
                            >
                                {value ? formatAdminDate(value) : 'Select date'}
                            </span>
                        </button>
                    }
                    content={
                        <div className="p-2">
                            <Calendar
                                selected={
                                    value ? parseDateLocal(value) : undefined
                                }
                                minDate={minDate}
                                onSelect={(d) => onChange(formatDateLocal(d))}
                            />
                        </div>
                    }
                />
                {value ? (
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        aria-label="Clear date"
                        onClick={() => onChange(null)}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                ) : null}
            </div>
        </div>
    );
}

const empty = (): Omit<HotelPromotion, 'id'> => ({
    type: 'early_bird',
    name: '',
    discount_percent: 10,
    active: true,
    code: '',
    book_window_days: 14,
    min_nights: 3,
    valid_from: null,
    valid_to: null,
    description: '',
});

export default function HotelPromotionsPage() {
    const params = useParams();
    const hotelId = String(params.hotelId || '');
    const [items, setItems] = useState<HotelPromotion[]>([]);
    const [mediaRest, setMediaRest] = useState<Record<string, unknown>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(empty);

    const load = async () => {
        setLoading(true);
        try {
            const hotel = await hotelAdminFetch<{
                media?: (Record<string, unknown> & { promotions?: unknown }) | null;
            }>(`hotels/${hotelId}`);
            const media = (hotel.media || {}) as Record<string, unknown> & {
                promotions?: unknown;
            };
            const { promotions, ...rest } = media;
            setMediaRest(rest);
            setItems(normalizePromotions(promotions));
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (hotelId) void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hotelId]);

    const persist = async (next: HotelPromotion[]) => {
        setSaving(true);
        try {
            await hotelAdminFetch(`hotels/${hotelId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    media: { ...mediaRest, promotions: next },
                }),
            });
            setItems(next);
            toast.success('Promotions saved');
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            setSaving(false);
        }
    };

    const add = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) {
            toast.error('Promotion name is required');
            return;
        }
        if (form.type === 'promo_code' && !form.code?.trim()) {
            toast.error('Promo code is required');
            return;
        }
        const row: HotelPromotion = {
            id: crypto.randomUUID(),
            ...form,
            name: form.name.trim(),
            code:
                form.type === 'promo_code'
                    ? form.code?.trim().toUpperCase()
                    : undefined,
        };
        void persist([...items, row]).then(() => setForm(empty()));
    };

    if (loading) return <AdminLoader label="Loading promotions…" />;

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h1 className="text-2xl font-extrabold text-brand-dark">Promotions</h1>
                <p className="text-sm text-slate-600 mt-1">
                    Early bird, last-minute, long-stay, and promo codes  industry-standard
                    levers to fill rooms. Applied at guest checkout when rules match.
                </p>
            </div>

            <form
                onSubmit={add}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm grid gap-4 sm:grid-cols-2"
            >
                <div className="space-y-1.5 sm:col-span-2">
                    <Label>Campaign name</Label>
                    <Input
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="Book 14+ days early  15% off"
                        required
                    />
                </div>
                <div className="space-y-1.5">
                    <Label>Type</Label>
                    <select
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                        value={form.type}
                        onChange={(e) =>
                            setForm((f) => ({
                                ...f,
                                type: e.target.value as HotelPromotionType,
                            }))
                        }
                    >
                        {(Object.keys(PROMOTION_TYPE_LABELS) as HotelPromotionType[]).map(
                            (k) => (
                                <option key={k} value={k}>
                                    {PROMOTION_TYPE_LABELS[k]}
                                </option>
                            ),
                        )}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <Label>Discount %</Label>
                    <Input
                        type="number"
                        min={1}
                        max={90}
                        value={form.discount_percent}
                        onChange={(e) =>
                            setForm((f) => ({
                                ...f,
                                discount_percent: Number(e.target.value) || 1,
                            }))
                        }
                    />
                </div>
                {form.type === 'promo_code' && (
                    <div className="space-y-1.5 sm:col-span-2">
                        <Label>Promo code</Label>
                        <Input
                            value={form.code || ''}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    code: e.target.value.toUpperCase(),
                                }))
                            }
                            placeholder="MOMONA15"
                            className="font-mono uppercase"
                        />
                    </div>
                )}
                {(form.type === 'early_bird' || form.type === 'last_minute') && (
                    <div className="space-y-1.5 sm:col-span-2">
                        <Label>
                            {form.type === 'early_bird'
                                ? 'Book at least N days before check-in'
                                : 'Book within N days of check-in'}
                        </Label>
                        <Input
                            type="number"
                            min={1}
                            value={form.book_window_days ?? 14}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    book_window_days: Number(e.target.value) || 1,
                                }))
                            }
                        />
                    </div>
                )}
                {form.type === 'long_stay' && (
                    <div className="space-y-1.5 sm:col-span-2">
                        <Label>Minimum nights</Label>
                        <Input
                            type="number"
                            min={2}
                            value={form.min_nights ?? 3}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    min_nights: Number(e.target.value) || 2,
                                }))
                            }
                        />
                    </div>
                )}
                <AdminDateField
                    label="Valid from (optional)"
                    value={form.valid_from}
                    onChange={(iso) =>
                        setForm((f) => ({
                            ...f,
                            valid_from: iso,
                            valid_to:
                                iso && f.valid_to && f.valid_to < iso
                                    ? null
                                    : f.valid_to,
                        }))
                    }
                />
                <AdminDateField
                    label="Valid to (optional)"
                    value={form.valid_to}
                    minDate={
                        form.valid_from
                            ? parseDateLocal(form.valid_from)
                            : undefined
                    }
                    onChange={(iso) =>
                        setForm((f) => ({
                            ...f,
                            valid_to: iso,
                        }))
                    }
                />
                <div className="sm:col-span-2">
                    <Button type="submit" disabled={saving}>
                        {saving ? 'Saving…' : 'Add promotion'}
                    </Button>
                </div>
            </form>

            <ul className="space-y-2">
                {items.map((p) => (
                    <li
                        key={p.id}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-3 flex items-start justify-between gap-3 shadow-sm"
                    >
                        <div className="flex gap-3 min-w-0">
                            <div className="h-10 w-10 rounded-lg bg-brand-primary/10 flex items-center justify-center shrink-0">
                                {p.type === 'promo_code' ? (
                                    <Tag className="w-5 h-5 text-brand-primary" />
                                ) : (
                                    <Percent className="w-5 h-5 text-brand-primary" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="font-semibold text-brand-dark">{p.name}</p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {PROMOTION_TYPE_LABELS[p.type]} · {p.discount_percent}% off
                                    {p.code ? ` · code ${p.code}` : ''}
                                    {p.book_window_days
                                        ? ` · ${p.book_window_days}d window`
                                        : ''}
                                    {p.min_nights ? ` · min ${p.min_nights} nights` : ''}
                                </p>
                                {(p.valid_from || p.valid_to) && (
                                    <p className="text-[11px] text-slate-400 mt-1">
                                        {p.valid_from
                                            ? formatAdminDate(p.valid_from)
                                            : '…'}{' '}
                                        → {p.valid_to ? formatAdminDate(p.valid_to) : '…'}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                type="button"
                                className="text-xs font-semibold text-slate-600"
                                onClick={() =>
                                    void persist(
                                        items.map((x) =>
                                            x.id === p.id
                                                ? { ...x, active: !x.active }
                                                : x,
                                        ),
                                    )
                                }
                            >
                                {p.active ? 'Active' : 'Paused'}
                            </button>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="text-red-600"
                                onClick={() =>
                                    void persist(items.filter((x) => x.id !== p.id))
                                }
                            >
                                Remove
                            </Button>
                        </div>
                    </li>
                ))}
                {items.length === 0 && (
                    <li className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center text-sm text-slate-500">
                        No promotions yet. Add early bird or a promo code to drive bookings.
                    </li>
                )}
            </ul>
        </div>
    );
}
