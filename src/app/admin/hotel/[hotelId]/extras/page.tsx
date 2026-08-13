'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { hotelAdminFetch } from '@/lib/hotel-admin-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdminLoader } from '@/components/ui/admin-loader';
import {
    DEFAULT_EXTRAS_PRICING,
    resolveExtrasPricing,
    type ExtrasPricingConfig,
} from '@/lib/hotel-stay-extras';
import { toast } from 'sonner';

/**
 * Hotel Admin: set stay add-on fees charged on top of room nights.
 */
export default function HotelExtrasPricingPage() {
    const params = useParams();
    const hotelId = String(params.hotelId || '');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [mediaRest, setMediaRest] = useState<Record<string, unknown>>({});
    const [form, setForm] = useState<ExtrasPricingConfig>(DEFAULT_EXTRAS_PRICING);
    const [shuttleFlat, setShuttleFlat] = useState('');

    useEffect(() => {
        if (!hotelId) return;
        void (async () => {
            setLoading(true);
            try {
                const hotel = await hotelAdminFetch<{
                    media?: Record<string, unknown> | null;
                }>(`hotels/${hotelId}`);
                const media = (hotel.media || {}) as Record<string, unknown>;
                const { extras_pricing: _drop, extrasPricing: _d2, ...rest } =
                    media as Record<string, unknown> & {
                        extras_pricing?: unknown;
                        extrasPricing?: unknown;
                    };
                setMediaRest(rest);
                const resolved = resolveExtrasPricing(media);
                setForm(resolved);
                setShuttleFlat(
                    resolved.airport_shuttle == null
                        ? ''
                        : String(resolved.airport_shuttle),
                );
            } catch (e) {
                toast.error((e as Error).message);
            } finally {
                setLoading(false);
            }
        })();
    }, [hotelId]);

    const save = async () => {
        setSaving(true);
        try {
            const airport =
                shuttleFlat.trim() === ''
                    ? null
                    : Math.max(0, Number(shuttleFlat) || 0);
            const extras_pricing = {
                meal_plan_per_guest_night: form.meal_plan_per_guest_night,
                early_check_in: form.early_check_in,
                late_check_out: form.late_check_out,
                airport_shuttle: airport,
                ride_hailing: form.ride_hailing,
                car_rental: form.car_rental,
            };
            await hotelAdminFetch(`hotels/${hotelId}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    media: { ...mediaRest, extras_pricing },
                }),
            });
            toast.success('Stay extras pricing saved');
            setForm(resolveExtrasPricing({ extras_pricing }));
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <AdminLoader label="Loading extras pricing…" />;

    const meal = form.meal_plan_per_guest_night;

    return (
        <div className="max-w-2xl space-y-6">
            <div>
                <h1 className="text-2xl font-extrabold text-brand-dark tracking-tight">
                    Stay extras pricing
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    These fees are added on top of the room stay when guests select
                    breakfast, shuttle, early check-in, and similar options. Leave
                    airport shuttle blank to use the cheapest active shuttle from your
                    fleet (if any), otherwise a platform default applies.
                </p>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
                <h2 className="font-bold text-brand-dark">Meal plan (per guest / night)</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                    {(
                        [
                            ['BB', 'Bed & breakfast'],
                            ['HB', 'Half board'],
                            ['FB', 'Full board'],
                            ['AI', 'All inclusive'],
                        ] as const
                    ).map(([code, label]) => (
                        <div key={code} className="space-y-1.5">
                            <Label>
                                {code}  {label}
                            </Label>
                            <Input
                                type="number"
                                min={0}
                                value={meal[code]}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        meal_plan_per_guest_night: {
                                            ...f.meal_plan_per_guest_night,
                                            [code]: Math.max(0, Number(e.target.value) || 0),
                                        },
                                    }))
                                }
                            />
                        </div>
                    ))}
                </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
                <h2 className="font-bold text-brand-dark">Stay options (flat fee)</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label>Early check-in</Label>
                        <Input
                            type="number"
                            min={0}
                            value={form.early_check_in}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    early_check_in: Math.max(0, Number(e.target.value) || 0),
                                }))
                            }
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Late check-out</Label>
                        <Input
                            type="number"
                            min={0}
                            value={form.late_check_out}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    late_check_out: Math.max(0, Number(e.target.value) || 0),
                                }))
                            }
                        />
                    </div>
                </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
                <h2 className="font-bold text-brand-dark">Transport add-ons</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                        <Label>Airport shuttle (flat override)</Label>
                        <Input
                            type="number"
                            min={0}
                            placeholder="Blank = cheapest active shuttle / default"
                            value={shuttleFlat}
                            onChange={(e) => setShuttleFlat(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Ride hailing fee</Label>
                        <Input
                            type="number"
                            min={0}
                            value={form.ride_hailing}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    ride_hailing: Math.max(0, Number(e.target.value) || 0),
                                }))
                            }
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Car rental fee</Label>
                        <Input
                            type="number"
                            min={0}
                            value={form.car_rental}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    car_rental: Math.max(0, Number(e.target.value) || 0),
                                }))
                            }
                        />
                    </div>
                </div>
            </section>

            <Button type="button" disabled={saving} onClick={() => void save()}>
                {saving ? 'Saving…' : 'Save extras pricing'}
            </Button>
        </div>
    );
}
