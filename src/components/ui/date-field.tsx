'use client';

import { Calendar as CalendarIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Popover } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { formatAdminDate } from '@/lib/admin-date-format';
import { formatDateLocal, parseDateLocal } from '@/lib/date-utils';
import { cn } from '@/lib/utils';

type Props = {
    label: string;
    value: string;
    onChange: (isoDate: string) => void;
    minDate?: Date;
    placeholder?: string;
    className?: string;
};

/** App Calendar + Popover  never native `<input type="date">`. */
export function DateField({
    label,
    value,
    onChange,
    minDate,
    placeholder = 'Select date',
    className,
}: Props) {
    return (
        <div className={cn('space-y-1.5', className)}>
            <Label>{label}</Label>
            <Popover
                trigger={
                    <button
                        type="button"
                        className="h-11 w-full inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-left text-sm font-medium text-brand-dark shadow-sm hover:border-brand-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30"
                    >
                        <CalendarIcon className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className={value ? '' : 'text-slate-400'}>
                            {value ? formatAdminDate(value) : placeholder}
                        </span>
                    </button>
                }
                content={
                    <div className="p-1">
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
