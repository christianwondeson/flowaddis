'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { hotelAdminFetch } from '@/lib/hotel-admin-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdminLoader } from '@/components/ui/admin-loader';
import { toast } from 'sonner';
import { CheckCircle2, CreditCard, Loader2, Shield } from 'lucide-react';
import { ET_MOBILE_PATTERN, etMsisdnToLocalDisplay } from '@/lib/local-payment-checkout';
import { formatAdminDateTime } from '@/lib/admin-date-format';
import { cn } from '@/lib/utils';

type Plan = {
    id: string;
    code: string;
    name: string;
    description?: string | null;
    price_amount: string;
    currency: string;
    period_days: number;
    trial_days: number;
};

type Subscription = {
    id: string;
    status: string;
    current_period_end?: string | null;
    trial_ends_at?: string | null;
    plan?: Plan | null;
};

type Invoice = {
    id: string;
    status: string;
    amount: string;
    currency: string;
    payment_reference: string;
    provider_transaction_id?: string | null;
    paid_at?: string | null;
    created_at: string;
    failure_reason?: string | null;
    plan?: Plan | null;
};

type Access = {
    allowed: boolean;
    reason: string;
    status: string;
};

type Overview = {
    plans: Plan[];
    subscription: Subscription;
    invoices: Invoice[];
    access: Access;
};

type PayoutProfile = {
    bank_name?: string | null;
    account_number?: string | null;
    account_name?: string | null;
    cbe_account?: string | null;
    preferred_rail?: string;
} | null;

export default function HotelBillingPage() {
    const params = useParams();
    const hotelId = String(params.hotelId || '');
    const [overview, setOverview] = useState<Overview | null>(null);
    const [payout, setPayout] = useState<PayoutProfile>(null);
    const [loading, setLoading] = useState(true);
    const [planCode, setPlanCode] = useState('starter');
    const [msisdn, setMsisdn] = useState('');
    const [paying, setPaying] = useState(false);
    const [pendingRef, setPendingRef] = useState<string | null>(null);
    const [savingPayout, setSavingPayout] = useState(false);
    const [payoutForm, setPayoutForm] = useState({
        account_name: '',
        cbe_account: '',
        bank_name: '',
        account_number: '',
    });

    const load = useCallback(async () => {
        if (!hotelId) return;
        setLoading(true);
        try {
            const [ov, profile] = await Promise.all([
                hotelAdminFetch<Overview>(`hotels/${hotelId}/billing`),
                hotelAdminFetch<PayoutProfile>(
                    `hotels/${hotelId}/billing/payout-profile`,
                ).catch(() => null),
            ]);
            setOverview(ov);
            if (ov.plans?.length && !ov.plans.some((p) => p.code === planCode)) {
                setPlanCode(ov.plans[0].code);
            }
            setPayout(profile);
            if (profile) {
                setPayoutForm({
                    account_name: profile.account_name || '',
                    cbe_account: profile.cbe_account || '',
                    bank_name: profile.bank_name || '',
                    account_number: profile.account_number || '',
                });
            }
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            setLoading(false);
        }
    }, [hotelId, planCode]);

    useEffect(() => {
        void load();
    }, [hotelId]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!pendingRef || !hotelId) return;
        let cancelled = false;
        const id = window.setInterval(async () => {
            try {
                const st = await hotelAdminFetch<{
                    status: string;
                    providerTransactionId?: string | null;
                }>(
                    `hotels/${hotelId}/billing/invoices/status?paymentReference=${encodeURIComponent(pendingRef)}`,
                );
                if (cancelled) return;
                if (st.status === 'paid') {
                    window.clearInterval(id);
                    setPendingRef(null);
                    setPaying(false);
                    toast.success('Subscription payment confirmed. Plan is active.');
                    void load();
                } else if (st.status === 'failed') {
                    window.clearInterval(id);
                    setPendingRef(null);
                    setPaying(false);
                    toast.error('Payment failed. You can try again.');
                    void load();
                }
            } catch {
                /* keep polling */
            }
        }, 4000);
        return () => {
            cancelled = true;
            window.clearInterval(id);
        };
    }, [pendingRef, hotelId, load]);

    const startPay = async () => {
        const local = etMsisdnToLocalDisplay(msisdn) || msisdn.trim();
        if (!ET_MOBILE_PATTERN.test(local)) {
            toast.error('Enter a valid Ethiopian mobile (09xxxxxxxx or 07xxxxxxxx).');
            return;
        }
        setPaying(true);
        try {
            const res = await hotelAdminFetch<{
                paymentReference: string;
                message?: string;
            }>(`hotels/${hotelId}/billing/subscribe/cbe-birr`, {
                method: 'POST',
                body: JSON.stringify({
                    planCode,
                    customerMsisdn: local,
                }),
            });
            setPendingRef(res.paymentReference);
            toast.message(res.message || 'Approve the CBE Birr prompt on your phone.');
        } catch (e) {
            setPaying(false);
            toast.error((e as Error).message);
        }
    };

    const savePayout = async () => {
        setSavingPayout(true);
        try {
            await hotelAdminFetch(`hotels/${hotelId}/billing/payout-profile`, {
                method: 'PUT',
                body: JSON.stringify({
                    ...payoutForm,
                    preferred_rail: 'cbe',
                }),
            });
            toast.success('Payout profile saved.');
            void load();
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            setSavingPayout(false);
        }
    };

    if (loading || !overview) {
        return (
            <div className="p-6 sm:p-8">
                <AdminLoader label="Loading billing…" />
            </div>
        );
    }

    const selected = overview.plans.find((p) => p.code === planCode);
    const sub = overview.subscription;
    const access = overview.access;

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 sm:space-y-8">
            <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-brand-dark tracking-tight">
                    Billing & subscription
                </h1>
                <p className="text-sm text-slate-500 mt-1 max-w-2xl">
                    Pay BookAddis for the hotel management system with CBE Birr.
                    Access activates only after payment is validated (PayNar + bank
                    transaction).
                </p>
            </div>

            <div
                className={cn(
                    'rounded-2xl border px-4 py-3 sm:px-5 sm:py-4 flex gap-3 items-start',
                    access.allowed
                        ? 'bg-teal-50/80 border-teal-100'
                        : 'bg-amber-50 border-amber-100',
                )}
            >
                {access.allowed ? (
                    <CheckCircle2 className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                ) : (
                    <Shield className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0 text-sm">
                    <p className="font-semibold text-slate-900 capitalize">
                        Status: {sub.status.replace('_', ' ')}
                        {sub.plan?.name ? ` · ${sub.plan.name}` : ''}
                    </p>
                    <p className="text-slate-600 mt-0.5">{access.reason}</p>
                    {sub.current_period_end ? (
                        <p className="text-xs text-slate-500 mt-1">
                            Period ends {formatAdminDateTime(sub.current_period_end)}
                        </p>
                    ) : null}
                </div>
            </div>

            <section className="space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                    Choose a plan
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {overview.plans.map((plan) => {
                        const active = plan.code === planCode;
                        return (
                            <button
                                key={plan.id}
                                type="button"
                                onClick={() => setPlanCode(plan.code)}
                                className={cn(
                                    'text-left rounded-2xl border p-4 sm:p-5 transition-all',
                                    active
                                        ? 'border-teal-500 bg-white ring-2 ring-teal-500/20'
                                        : 'border-slate-200 bg-white hover:border-slate-300',
                                )}
                            >
                                <div className="flex items-baseline justify-between gap-2">
                                    <p className="font-bold text-brand-dark">{plan.name}</p>
                                    <p className="text-lg font-extrabold text-teal-700">
                                        {Number(plan.price_amount).toLocaleString()}{' '}
                                        <span className="text-xs font-semibold text-slate-500">
                                            {plan.currency}/mo
                                        </span>
                                    </p>
                                </div>
                                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                                    {plan.description}
                                </p>
                                {plan.trial_days > 0 ? (
                                    <p className="text-xs text-slate-500 mt-2">
                                        {plan.trial_days}-day trial available via Super Admin
                                    </p>
                                ) : null}
                            </button>
                        );
                    })}
                </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-teal-700" />
                    <h2 className="font-bold text-brand-dark">Pay with CBE Birr</h2>
                </div>
                <p className="text-sm text-slate-500">
                    Selected:{' '}
                    <span className="font-semibold text-slate-800">
                        {selected?.name || planCode}
                    </span>{' '}
                     {selected ? Number(selected.price_amount).toLocaleString() : ' '}{' '}
                    ETB. You will get a USSD prompt; we activate the plan after the bank
                    confirms.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
                    <div className="space-y-1.5">
                        <Label htmlFor="cbe-msisdn">Mobile number (CBE Birr)</Label>
                        <Input
                            id="cbe-msisdn"
                            inputMode="tel"
                            placeholder="0912345678"
                            value={msisdn}
                            onChange={(e) => setMsisdn(e.target.value)}
                            className="h-11 rounded-xl"
                            disabled={paying || Boolean(pendingRef)}
                        />
                    </div>
                    <Button
                        type="button"
                        onClick={() => void startPay()}
                        disabled={paying || Boolean(pendingRef)}
                        className="h-11 rounded-xl px-6 w-full sm:w-auto"
                    >
                        {paying || pendingRef ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Waiting for payment…
                            </>
                        ) : (
                            'Subscribe & pay'
                        )}
                    </Button>
                </div>
                {pendingRef ? (
                    <p className="text-xs text-slate-500 font-mono break-all">
                        Reference: {pendingRef}
                    </p>
                ) : null}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 space-y-4">
                <h2 className="font-bold text-brand-dark">Payout profile</h2>
                <p className="text-sm text-slate-500">
                    Where BookAddis will send your cut for prepaid guest bookings
                    (later). Separate from subscription fees you pay us.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5 sm:col-span-2">
                        <Label>Account name</Label>
                        <Input
                            value={payoutForm.account_name}
                            onChange={(e) =>
                                setPayoutForm((f) => ({
                                    ...f,
                                    account_name: e.target.value,
                                }))
                            }
                            className="h-11 rounded-xl"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>CBE account</Label>
                        <Input
                            value={payoutForm.cbe_account}
                            onChange={(e) =>
                                setPayoutForm((f) => ({
                                    ...f,
                                    cbe_account: e.target.value,
                                }))
                            }
                            className="h-11 rounded-xl"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Bank name</Label>
                        <Input
                            value={payoutForm.bank_name}
                            onChange={(e) =>
                                setPayoutForm((f) => ({
                                    ...f,
                                    bank_name: e.target.value,
                                }))
                            }
                            className="h-11 rounded-xl"
                        />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                        <Label>Other account number (optional)</Label>
                        <Input
                            value={payoutForm.account_number}
                            onChange={(e) =>
                                setPayoutForm((f) => ({
                                    ...f,
                                    account_number: e.target.value,
                                }))
                            }
                            className="h-11 rounded-xl"
                        />
                    </div>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => void savePayout()}
                    disabled={savingPayout}
                    className="rounded-xl"
                >
                    {savingPayout ? 'Saving…' : 'Save payout profile'}
                </Button>
                {payout ? (
                    <p className="text-xs text-slate-400">Profile on file for this hotel.</p>
                ) : null}
            </section>

            <section className="space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                    Invoices
                </h2>
                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                    {overview.invoices.length === 0 ? (
                        <p className="p-4 text-sm text-slate-500">No invoices yet.</p>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {overview.invoices.map((inv) => (
                                <li
                                    key={inv.id}
                                    className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm"
                                >
                                    <div className="min-w-0">
                                        <p className="font-semibold text-slate-900">
                                            {inv.plan?.name || 'Subscription'} ·{' '}
                                            {Number(inv.amount).toLocaleString()}{' '}
                                            {inv.currency}
                                        </p>
                                        <p className="text-xs text-slate-500 font-mono truncate">
                                            {inv.payment_reference}
                                            {inv.provider_transaction_id
                                                ? ` · txn ${inv.provider_transaction_id}`
                                                : ''}
                                        </p>
                                    </div>
                                    <div className="text-left sm:text-right shrink-0">
                                        <p className="font-semibold capitalize text-slate-800">
                                            {inv.status}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {formatAdminDateTime(
                                                inv.paid_at || inv.created_at,
                                            )}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>
        </div>
    );
}
