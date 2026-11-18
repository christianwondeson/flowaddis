'use client';

import { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Popover } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import {
    formatDateLocal,
    formatDateRangeShort,
    parseDateLocal,
} from '@/lib/date-utils';
import { cn } from '@/lib/utils';
import {
    ADMIN_MIN_DATE,
    PERIOD_PRESETS,
    type PeriodPreset,
    detectPreset,
    presetToRange,
} from '@/lib/admin-period-utils';

type Props = {
    from: string;
    to: string;
    onChange: (from: string, to: string) => void;
    onApply?: () => void;
    applyLabel?: string;
    className?: string;
    children?: React.ReactNode;
};

export function AdminPeriodRangeFilter({
    from,
    to,
    onChange,
    onApply,
    applyLabel = 'Apply',
    className,
    children,
}: Props) {
    const [calendarOpen, setCalendarOpen] = useState(false);
    const activePreset = detectPreset(from, to);

    const applyPreset = (preset: PeriodPreset) => {
        if (preset === 'custom') return;
        const range = presetToRange(preset);
        onChange(range.from, range.to);
    };

    const updateFrom = (date: Date) => {
        const nextFrom = formatDateLocal(date);
        let nextTo = to;
        if (to && parseDateLocal(to) < date) {
            nextTo = nextFrom;
        }
        onChange(nextFrom, nextTo);
    };

    const updateTo = (date: Date) => {
        onChange(from, formatDateLocal(date));
    };

    return (
        <div
            className={cn(
                'rounded-xl border border-slate-200 bg-white p-4 space-y-4',
                className,
            )}
        >
            <div className="flex flex-wrap gap-2">
                {PERIOD_PRESETS.map(({ id, label }) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => applyPreset(id)}
                        className={cn(
                            'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                            activePreset === id
                                ? 'bg-teal-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                        )}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[220px] flex-1 sm:flex-none sm:min-w-[260px]">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1.5">
                        Period
                    </p>
                    <Popover
                        align="left"
                        isOpen={calendarOpen}
                        onOpenChange={setCalendarOpen}
                        className="p-2 sm:p-3"
                        trigger={
                            <button
                                type="button"
                                className="h-10 w-full inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-left text-sm font-medium text-brand-dark shadow-sm hover:border-teal-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30"
                            >
                                <CalendarIcon className="w-4 h-4 text-slate-400 shrink-0" />
                                <span className={from && to ? '' : 'text-slate-400'}>
                                    {from && to
                                        ? formatDateRangeShort(from, to)
                                        : 'Select date range'}
                                </span>
                            </button>
                        }
                        content={
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-[280px] sm:min-w-[520px]">
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">
                                        From
                                    </p>
                                    <Calendar
                                        selected={
                                            from ? parseDateLocal(from) : undefined
                                        }
                                        minDate={ADMIN_MIN_DATE}
                                        onSelect={(date) => updateFrom(date)}
                                    />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">
                                        To
                                    </p>
                                    <Calendar
                                        selected={to ? parseDateLocal(to) : undefined}
                                        minDate={
                                            from
                                                ? parseDateLocal(from)
                                                : ADMIN_MIN_DATE
                                        }
                                        onSelect={(date) => {
                                            updateTo(date);
                                            setCalendarOpen(false);
                                        }}
                                    />
                                </div>
                            </div>
                        }
                    />
                </div>

                {children}

                {onApply ? (
                    <Button
                        type="button"
                        className="rounded-xl h-10"
                        onClick={onApply}
                    >
                        {applyLabel}
                    </Button>
                ) : null}
            </div>
        </div>
    );
}
