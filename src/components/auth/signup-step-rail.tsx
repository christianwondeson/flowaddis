'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
    steps: readonly string[];
    current: number;
    className?: string;
};

/** Shared horizontal step rail for guest/hotel signup and partner KYC. */
export function SignupStepRail({ steps, current, className }: Props) {
    return (
        <ol
            className={cn(
                'grid gap-2 text-[11px] font-semibold',
                steps.length <= 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4',
                className,
            )}
        >
            {steps.map((label, i) => {
                const done = i < current;
                const active = i === current;
                return (
                    <li
                        key={label}
                        className={cn(
                            'rounded-xl border px-2.5 py-2 leading-snug',
                            active &&
                                'border-brand-primary/40 bg-brand-primary/5 text-brand-primary',
                            done &&
                                !active &&
                                'border-teal-200 bg-teal-50/80 text-teal-800',
                            !done &&
                                !active &&
                                'border-slate-200 bg-slate-50 text-slate-500',
                        )}
                    >
                        <span className="inline-flex items-center gap-1">
                            {done ? (
                                <Check className="w-3 h-3 shrink-0" />
                            ) : (
                                <span className="tabular-nums">{i + 1}.</span>
                            )}
                            {label}
                        </span>
                    </li>
                );
            })}
        </ol>
    );
}
