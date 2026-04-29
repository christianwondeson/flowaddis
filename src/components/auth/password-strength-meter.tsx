"use client";

import { useMemo } from "react";
import { getPasswordStrengthMeter, type PasswordMeterState } from "@/lib/password-policy";
import { cn } from "@/lib/utils";

type Props = {
    password: string;
    className?: string;
};

function activeBarClass(m: PasswordMeterState): string {
    if (m.meetsAllRules) return "bg-emerald-600";
    switch (m.filledCount) {
        case 0:
            return "bg-gray-300";
        case 1:
            return "bg-red-400";
        case 2:
            return "bg-amber-500";
        case 3:
            return "bg-lime-500";
        default:
            return "bg-amber-500";
    }
}

export function PasswordStrengthMeter({ password, className }: Props) {
    const meter = useMemo(() => getPasswordStrengthMeter(password), [password]);
    const active = activeBarClass(meter);

    return (
        <div className={cn("space-y-1.5", className)} aria-live="polite">
            <div
                className="flex gap-1"
                role="meter"
                aria-valuemin={0}
                aria-valuemax={4}
                aria-valuenow={meter.filledCount}
                aria-label={meter.label}
            >
                {meter.bars.map((on, i) => (
                    <div
                        key={i}
                        className={cn(
                            "h-1.5 flex-1 rounded-full transition-colors duration-200",
                            on ? active : "bg-gray-200 dark:bg-slate-600",
                        )}
                    />
                ))}
            </div>
            <p
                className={cn(
                    "text-xs font-medium",
                    !password && "text-gray-500",
                    password && !meter.meetsAllRules && "text-gray-700 dark:text-slate-300",
                    meter.meetsAllRules && "text-emerald-700 dark:text-emerald-400",
                )}
            >
                {meter.label}
            </p>
        </div>
    );
}
