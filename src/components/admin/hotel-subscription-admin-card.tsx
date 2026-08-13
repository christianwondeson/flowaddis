'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminInventoryFetch } from '@/lib/admin-inventory-api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Wallet } from 'lucide-react';

type Plan = { code: string; name: string; price_amount: string; currency: string };
type Overview = {
    plans: Plan[];
    subscription: { status: string; plan?: Plan | null; current_period_end?: string | null };
    access: { allowed: boolean; reason: string; status: string };
};

/**
 * Super Admin: force trial / active / inactive for hotel SaaS subscription.
 * Uses Nest `PATCH /v1/admin/billing/hotels/:id/subscription` via inventory proxy.
 */
export function HotelSubscriptionAdminCard({ hotelId }: { hotelId: string }) {
    const [overview, setOverview] = useState<Overview | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [planCode, setPlanCode] = useState('starter');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const ov = await adminInventoryFetch<Overview>(
                `billing/hotels/${hotelId}/subscription`,
            );
            setOverview(ov);
            if (ov.subscription.plan?.code) {
                setPlanCode(ov.subscription.plan.code);
            } else if (ov.plans[0]?.code) {
                setPlanCode(ov.plans[0].code);
            }
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            setLoading(false);
        }
    }, [hotelId]);

    useEffect(() => {
        if (hotelId) void load();
    }, [hotelId, load]);

    const setStatus = async (status: 'trialing' | 'active' | 'inactive' | 'past_due') => {
        setBusy(true);
        try {
            const ov = await adminInventoryFetch<Overview>(
                `billing/hotels/${hotelId}/subscription`,
                {
                    method: 'PATCH',
                    body: JSON.stringify({ status, planCode }),
                },
            );
            setOverview(ov);
            toast.success(`Subscription set to ${status}`);
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            setBusy(false);
        }
    };

    if (loading) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading subscription…
            </div>
        );
    }
    if (!overview) return null;

    const sub = overview.subscription;

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-3 shadow-sm">
            <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-teal-700" />
                <h2 className="font-bold text-brand-dark">SaaS subscription</h2>
            </div>
            <p className="text-sm text-slate-600">
                Status:{' '}
                <span className="font-semibold capitalize">
                    {sub.status.replace('_', ' ')}
                </span>
                {sub.plan?.name ? ` · ${sub.plan.name}` : ''}
                {!overview.access.allowed ? (
                    <span className="block text-amber-800 mt-1 text-xs">
                        {overview.access.reason}
                    </span>
                ) : null}
            </p>
            <div className="flex flex-wrap items-center gap-2">
                <select
                    value={planCode}
                    onChange={(e) => setPlanCode(e.target.value)}
                    className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm"
                    disabled={busy}
                >
                    {overview.plans.map((p) => (
                        <option key={p.code} value={p.code}>
                            {p.name} ({Number(p.price_amount).toLocaleString()}{' '}
                            {p.currency})
                        </option>
                    ))}
                </select>
                <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void setStatus('trialing')}
                >
                    Start trial
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void setStatus('active')}
                >
                    Mark active
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void setStatus('inactive')}
                >
                    Deactivate
                </Button>
            </div>
            <p className="text-xs text-slate-400">
                Hotels normally pay via CBE Birr on Billing. Use these for comps / ops.
            </p>
        </section>
    );
}
