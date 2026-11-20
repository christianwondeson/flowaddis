'use client';

import { useEffect, useRef } from 'react';
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
    const activeItemRef = useRef<HTMLLIElement | null>(null);

    // Auto-center active step chip horizontally on mobile viewports
    useEffect(() => {
        activeItemRef.current?.scrollIntoView({
            behavior: 'smooth',
            inline: 'center',
            block: 'nearest',
        });
    }, [current]);

    return (
        <div className={cn('space-y-2.5 sm:space-y-3 mb-5 sm:mb-6 animate-fade-up', className)}>
            {/* Step Counter & Active Step Header */}
            <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span className="shrink-0 px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-[11px] sm:text-xs font-bold tabular-nums border border-teal-200/60 dark:border-teal-800/60">
                        Step {current + 1} of {steps.length}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100 truncate text-xs sm:text-sm">
                        {steps[current]}
                    </span>
                </div>
                <span className="shrink-0 text-[11px] sm:text-xs font-semibold text-slate-400 tabular-nums">
                    {progress}%
                </span>
            </div>

            {/* Segmented Progress Bar (visual indicator for every step) */}
            <div className="grid grid-flow-col gap-1.5 w-full">
                {steps.map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            'h-1.5 rounded-full transition-all duration-300',
                            i < current
                                ? 'bg-teal-500'
                                : i === current
                                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 ring-2 ring-teal-500/30'
                                  : 'bg-slate-200 dark:bg-slate-800',
                        )}
                    />
                ))}
            </div>

            {/* Step badges track with smooth auto-centering and hidden scrollbars */}
            <div className="relative">
                <ol className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide no-scrollbar [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-1 -mx-0.5 px-0.5">
                    {steps.map((label, i) => {
                        const done = i < current;
                        const active = i === current;
                        return (
                            <li
                                key={label}
                                ref={active ? activeItemRef : undefined}
                                className={cn(
                                    'flex items-center gap-1.5 px-2.5 py-1 sm:py-1.5 rounded-xl border text-[11px] sm:text-xs transition-all duration-200 shrink-0 select-none',
                                    active &&
                                        'border-teal-500 bg-teal-50/90 text-teal-950 font-bold shadow-sm shadow-teal-500/10 dark:border-teal-400 dark:bg-teal-950/50 dark:text-teal-100 ring-1 ring-teal-500/30',
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
        </div>
    );
}
