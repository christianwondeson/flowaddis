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
    const progress = Math.min(100, Math.round(((current + 1) / steps.length) * 100));

    return (
        <div className={cn('space-y-3 mb-6 animate-fade-up', className)}>
            {/* Step Counter & Active Step Header */}
            <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-teal-600 dark:text-teal-400">
                        Step {current + 1} of {steps.length}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {steps[current]}
                    </span>
                </div>
                <span className="text-xs font-semibold text-slate-400 tabular-nums">
                    {progress}%
                </span>
            </div>

            {/* Gradient Progress Bar */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Step badges track */}
            <ol className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 -mx-1 px-1">
                {steps.map((label, i) => {
                    const done = i < current;
                    const active = i === current;
                    return (
                        <li
                            key={label}
                            className={cn(
                                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs transition-all duration-200 shrink-0 select-none',
                                active &&
                                    'border-teal-500 bg-teal-50/80 text-teal-900 font-bold shadow-sm shadow-teal-500/10 dark:border-teal-500/60 dark:bg-teal-950/40 dark:text-teal-200',
                                done &&
                                    !active &&
                                    'border-emerald-200 bg-emerald-50/50 text-emerald-800 font-medium dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300',
                                !done &&
                                    !active &&
                                    'border-slate-200 bg-slate-50/60 text-slate-400 font-medium dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500',
                            )}
                        >
                            <span
                                className={cn(
                                    'grid h-4 w-4 shrink-0 place-items-center rounded-full text-[10px] font-bold tabular-nums',
                                    active && 'bg-teal-600 text-white shadow-sm',
                                    done && 'bg-emerald-500 text-white',
                                    !done &&
                                        !active &&
                                        'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
                                )}
                            >
                                {done ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : i + 1}
                            </span>
                            <span className="whitespace-nowrap font-medium">{label}</span>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}
