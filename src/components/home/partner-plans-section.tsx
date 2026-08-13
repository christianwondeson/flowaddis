'use client';

import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionHeading } from '@/components/home/section-heading';
import { BILLING_PLANS } from '@/lib/billing-plans';
import { cn } from '@/lib/utils';

/**
 * Homepage: categorized hotel SaaS plans → standard choose-plan → signup flow.
 */
export function PartnerPlansSection() {
    return (
        <section id="partner-plans" className="scroll-mt-24">
            <SectionHeading
                title="Hotel partner plans"
                subtitle="Choose a BookAddis management plan, then complete partner registration. Access activates after Super Admin approval and validated CBE Birr payment."
            />

            <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
                {BILLING_PLANS.map((plan) => (
                    <article
                        key={plan.code}
                        className={cn(
                            'relative flex flex-col rounded-2xl border bg-white p-5 sm:p-6 shadow-sm',
                            plan.highlighted
                                ? 'border-teal-400 ring-2 ring-teal-500/15'
                                : 'border-slate-200',
                        )}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wide text-teal-700">
                                    {plan.category}
                                </p>
                                <h3 className="mt-1 text-xl font-extrabold text-brand-dark">
                                    {plan.name}
                                </h3>
                                <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                                    {plan.tagline}
                                </p>
                            </div>
                            {plan.highlighted ? (
                                <span className="shrink-0 rounded-lg bg-teal-600 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                                    Popular
                                </span>
                            ) : null}
                        </div>

                        <p className="mt-5 flex items-baseline gap-1">
                            <span className="text-3xl font-extrabold text-brand-dark tabular-nums">
                                {plan.priceEtb.toLocaleString()}
                            </span>
                            <span className="text-sm font-semibold text-slate-500">
                                {plan.currency}
                                {plan.periodLabel}
                            </span>
                        </p>
                        {plan.trialDays > 0 ? (
                            <p className="mt-1 text-xs text-slate-500">
                                Trial available after approval (ops / Super Admin)
                            </p>
                        ) : null}

                        <ul className="mt-5 space-y-2.5 flex-1">
                            {plan.features.map((f) => (
                                <li
                                    key={f}
                                    className="flex gap-2 text-sm text-slate-700"
                                >
                                    <Check className="w-4 h-4 shrink-0 mt-0.5 text-teal-600" />
                                    <span>{f}</span>
                                </li>
                            ))}
                            {plan.notIncluded?.map((f) => (
                                <li
                                    key={f}
                                    className="flex gap-2 text-sm text-slate-400"
                                >
                                    <X className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>{f}</span>
                                </li>
                            ))}
                        </ul>

                        <Button
                            asChild
                            className={cn(
                                'mt-6 w-full rounded-xl h-11 font-semibold',
                                plan.highlighted
                                    ? 'bg-brand-primary hover:bg-brand-primary/90'
                                    : '',
                            )}
                            variant={plan.highlighted ? 'default' : 'outline'}
                        >
                            <Link
                                href={`/signup?type=hotel_partner&plan=${plan.code}`}
                            >
                                Choose {plan.name}
                            </Link>
                        </Button>
                    </article>
                ))}
            </div>

            <p className="mt-6 text-center text-sm text-slate-500">
                Already have an account?{' '}
                <Link
                    href="/signin"
                    className="font-semibold text-brand-primary hover:underline"
                >
                    Sign in
                </Link>{' '}
                · Guests book free  {' '}
                <Link
                    href="/signup?type=guest"
                    className="font-semibold text-brand-primary hover:underline"
                >
                    create a guest account
                </Link>
            </p>
        </section>
    );
}
