'use client';

import { Check } from 'lucide-react';
import { BILLING_PLANS, type BillingPlanCode } from '@/lib/billing-plans';
import { cn } from '@/lib/utils';

type Props = {
    value: BillingPlanCode;
    onChange: (code: BillingPlanCode) => void;
};

/** Compact plan chooser for hotel signup (standard SaaS flow). */
export function BillingPlanPicker({ value, onChange }: Props) {
    return (
        <div className="grid gap-3 sm:grid-cols-2">
            {BILLING_PLANS.map((plan) => {
                const active = plan.code === value;
                return (
                    <button
                        key={plan.code}
                        type="button"
                        onClick={() => onChange(plan.code)}
                        className={cn(
                            'text-left rounded-2xl border p-4 transition-all',
                            active
                                ? 'border-teal-500 bg-white ring-2 ring-teal-500/20'
                                : 'border-slate-200 bg-slate-50/50 hover:border-slate-300',
                        )}
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wide text-teal-700">
                                    {plan.category}
                                </p>
                                <p className="font-bold text-brand-dark">{plan.name}</p>
                            </div>
                            {active ? (
                                <Check className="w-5 h-5 text-teal-600 shrink-0" />
                            ) : null}
                        </div>
                        <p className="mt-2 text-lg font-extrabold text-teal-700 tabular-nums">
                            {plan.priceEtb.toLocaleString()}{' '}
                            <span className="text-xs font-semibold text-slate-500">
                                {plan.currency}/mo
                            </span>
                        </p>
                        <ul className="mt-3 space-y-1">
                            {plan.features.slice(0, 4).map((f) => (
                                <li
                                    key={f}
                                    className="text-xs text-slate-600 flex gap-1.5"
                                >
                                    <span className="text-teal-600">·</span>
                                    {f}
                                </li>
                            ))}
                        </ul>
                    </button>
                );
            })}
        </div>
    );
}
