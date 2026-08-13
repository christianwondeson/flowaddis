'use client';

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { Calendar as CalendarIcon } from 'lucide-react';
import { formatAdminDate } from '@/lib/admin-date-format';
import { formatDateLocal, parseDateLocal } from '@/lib/date-utils';

type DayPatch = {
    date: string;
    price?: number;
    allotment?: number;
    is_closed?: boolean;
    currency?: string;
};

type Props = {
    currency: string;
    defaultAllotment?: number;
    onApply: (days: DayPatch[]) => Promise<void>;
    disabled?: boolean;
};

function eachDate(from: string, to: string): string[] {
    const out: string[] = [];
    const start = new Date(`${from}T12:00:00`);
    const end = new Date(`${to}T12:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
        return out;
    }
    const cur = new Date(start);
    while (cur <= end) {
        const y = cur.getFullYear();
        const m = String(cur.getMonth() + 1).padStart(2, '0');
        const d = String(cur.getDate()).padStart(2, '0');
        out.push(`${y}-${m}-${d}`);
        cur.setDate(cur.getDate() + 1);
    }
    return out;
}

function DateField({
    label,
    value,
    onChange,
    minDate,
}: {
    label: string;
    value: string;
    onChange: (iso: string) => void;
    minDate: Date;
}) {
    return (
        <div className="space-y-1">
            <Label>{label}</Label>
            <Popover
                trigger={
                    <button
                        type="button"
                        className="flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-left hover:border-brand-primary/40"
                    >
                        <CalendarIcon className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className={value ? 'text-brand-dark font-medium' : 'text-slate-400'}>
                            {value ? formatAdminDate(value) : 'Select date'}
                        </span>
                    </button>
                }
                content={
                    <div className="p-2">
                        <Calendar
                            selected={value ? parseDateLocal(value) : undefined}
                            minDate={minDate}
                            onSelect={(d) => onChange(formatDateLocal(d))}
                        />
                    </div>
                }
            />
        </div>
    );
}

/**
 * Booking.com–style bulk edit: modern calendar from/to → price / rooms / open-close.
 */
export function BulkCalendarEdit({
    currency,
    defaultAllotment = 1,
    onApply,
    disabled,
}: Props) {
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [price, setPrice] = useState('');
    const [allotment, setAllotment] = useState(String(defaultAllotment));
    const [closed, setClosed] = useState(false);
    const [weekdaysOnly, setWeekdaysOnly] = useState(false);
    const [weekendOnly, setWeekendOnly] = useState(false);
    const [saving, setSaving] = useState(false);

    const minDate = useMemo(() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 1);
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    const previewCount = useMemo(() => {
        if (!from || !to) return 0;
        let dates = eachDate(from, to);
        if (weekdaysOnly) {
            dates = dates.filter((d) => {
                const day = new Date(`${d}T12:00:00`).getDay();
                return day >= 1 && day <= 5;
            });
        }
        if (weekendOnly) {
            dates = dates.filter((d) => {
                const day = new Date(`${d}T12:00:00`).getDay();
                return day === 0 || day === 6;
            });
        }
        return dates.length;
    }, [from, to, weekdaysOnly, weekendOnly]);

    const apply = async () => {
        if (!from || !to) {
            toast.error('Choose a start and end date');
            return;
        }
        if (!price && allotment === '' && !closed) {
            toast.error('Set a price, allotment, or close the dates');
            return;
        }
        let dates = eachDate(from, to);
        if (!dates.length) {
            toast.error('Invalid date range');
            return;
        }
        if (weekdaysOnly) {
            dates = dates.filter((d) => {
                const day = new Date(`${d}T12:00:00`).getDay();
                return day >= 1 && day <= 5;
            });
        }
        if (weekendOnly) {
            dates = dates.filter((d) => {
                const day = new Date(`${d}T12:00:00`).getDay();
                return day === 0 || day === 6;
            });
        }
        if (!dates.length) {
            toast.error('No dates match the weekday filter');
            return;
        }

        const days: DayPatch[] = dates.map((date) => {
            const row: DayPatch = { date, currency: currency.toUpperCase() };
            if (price !== '') row.price = Number(price);
            if (allotment !== '') row.allotment = Number(allotment);
            if (closed) row.is_closed = true;
            else row.is_closed = false;
            return row;
        });

        setSaving(true);
        try {
            await onApply(days);
            toast.success(`Updated ${days.length} night(s)`);
        } catch (e) {
            toast.error((e as Error).message || 'Bulk update failed');
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 sm:p-5 space-y-4">
            <div>
                <h2 className="font-bold text-brand-dark">Bulk edit (Rates & availability)</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                    Pick From / To with the calendar, set nightly rate and rooms to sell, then
                    fine-tune individual days in the grid.
                </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <DateField
                    label="From"
                    value={from}
                    minDate={minDate}
                    onChange={(iso) => {
                        setFrom(iso);
                        if (to && iso > to) setTo(iso);
                    }}
                />
                <DateField
                    label="To"
                    value={to}
                    minDate={from ? parseDateLocal(from) : minDate}
                    onChange={setTo}
                />
                <div className="space-y-1">
                    <Label>Nightly price ({currency})</Label>
                    <Input
                        type="number"
                        min={0}
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="4500"
                    />
                </div>
                <div className="space-y-1">
                    <Label>Rooms to sell</Label>
                    <Input
                        type="number"
                        min={0}
                        value={allotment}
                        onChange={(e) => setAllotment(e.target.value)}
                    />
                </div>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
                <label className="inline-flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={closed}
                        onChange={(e) => setClosed(e.target.checked)}
                    />
                    Close dates (stop sell)
                </label>
                <label className="inline-flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={weekdaysOnly}
                        onChange={(e) => {
                            setWeekdaysOnly(e.target.checked);
                            if (e.target.checked) setWeekendOnly(false);
                        }}
                    />
                    Weekdays only (Mon–Fri)
                </label>
                <label className="inline-flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={weekendOnly}
                        onChange={(e) => {
                            setWeekendOnly(e.target.checked);
                            if (e.target.checked) setWeekdaysOnly(false);
                        }}
                    />
                    Weekends only
                </label>
            </div>
            <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                    {previewCount > 0
                        ? `${previewCount} night(s) · ${from ? formatAdminDate(from) : ''} → ${to ? formatAdminDate(to) : ''}`
                        : 'Select a date range'}
                </p>
                <Button
                    type="button"
                    onClick={() => void apply()}
                    disabled={disabled || saving || previewCount === 0}
                >
                    {saving ? 'Applying…' : 'Apply bulk edit'}
                </Button>
            </div>
        </section>
    );
}
