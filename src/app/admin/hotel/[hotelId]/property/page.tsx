'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { hotelAdminFetch } from '@/lib/hotel-admin-api';
import { useHotelPortal } from '@/components/hotel-portal/hotel-portal-context';
import { HotelSectionShell } from '@/components/hotel-portal/hotel-section-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { AdminLoader } from '@/components/ui/admin-loader';

type HotelForm = {
    name: string;
    brand: string;
    description: string;
    location: string;
    city: string;
    country: string;
    star_rating: string;
    default_currency: string;
};

function PropertyInner() {
    const params = useParams();
    const searchParams = useSearchParams();
    const hotelId = String(params.hotelId || '');
    const section = searchParams.get('section') || 'basics';
    const { refresh } = useHotelPortal();

    const [form, setForm] = useState<HotelForm>({
        name: '',
        brand: '',
        description: '',
        location: '',
        city: '',
        country: 'ET',
        star_rating: '',
        default_currency: 'ETB',
    });
    const [amenities, setAmenities] = useState<Record<string, unknown>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const base = `/admin/hotel/${hotelId}/property`;
    const nav = [
        { id: 'basics', label: 'Property basics', hint: 'Name & description', href: `${base}?section=basics` },
        { id: 'location', label: 'Location', hint: 'City & address', href: `${base}?section=location` },
        { id: 'details', label: 'Details', hint: 'Stars & currency', href: `${base}?section=details` },
    ];

    useEffect(() => {
        if (!hotelId) return;
        void (async () => {
            setLoading(true);
            try {
                const h = await hotelAdminFetch<{
                    name?: string;
                    description?: string | null;
                    location?: string | null;
                    city?: string | null;
                    country?: string | null;
                    star_rating?: number | null;
                    default_currency?: string;
                    amenities?: Record<string, unknown> | null;
                }>(`hotels/${hotelId}`);
                const am = h.amenities && typeof h.amenities === 'object' ? h.amenities : {};
                setAmenities(am);
                setForm({
                    name: h.name || '',
                    brand: String(am.brand || am.brand_name || ''),
                    description: h.description || '',
                    location: h.location || '',
                    city: h.city || '',
                    country: h.country || 'ET',
                    star_rating: h.star_rating != null ? String(h.star_rating) : '',
                    default_currency: h.default_currency || 'ETB',
                });
            } catch (e) {
                toast.error((e as Error).message);
            } finally {
                setLoading(false);
            }
        })();
    }, [hotelId]);

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) {
            toast.error('Hotel name is required');
            return;
        }
        setSaving(true);
        try {
            const nextAmenities = {
                ...amenities,
                brand: form.brand.trim() || undefined,
            };
            await hotelAdminFetch(`hotels/${hotelId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    name: form.name.trim(),
                    description: form.description.trim(),
                    location: form.location.trim(),
                    city: form.city.trim(),
                    country: form.country.trim() || 'ET',
                    default_currency: (form.default_currency || 'ETB')
                        .trim()
                        .toUpperCase(),
                    amenities: nextAmenities,
                    ...(form.star_rating === ''
                        ? {}
                        : { star_rating: Number(form.star_rating) }),
                }),
            });
            setAmenities(nextAmenities);
            toast.success('Property saved  details sync for BookAddis when published');
            await refresh();
        } catch (err) {
            toast.error((err as Error).message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <p className="text-sm text-slate-500">Loading property…</p>;
    }

    return (
        <HotelSectionShell
            title="Property"
            description="Guest-facing name, brand, and location. Super Admin publishes the hotel to BookAddis search."
            items={nav}
        >
            <form
                onSubmit={save}
                className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm space-y-5"
            >
                {section === 'basics' && (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="prop-name">Hotel name</Label>
                            <Input
                                id="prop-name"
                                required
                                value={form.name}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, name: e.target.value }))
                                }
                                placeholder="Official property name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="prop-brand">Brand / chain</Label>
                            <Input
                                id="prop-brand"
                                value={form.brand}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, brand: e.target.value }))
                                }
                                placeholder="e.g. Momona Hotels"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="prop-desc">Description</Label>
                            <textarea
                                id="prop-desc"
                                className="w-full min-h-[140px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={form.description}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        description: e.target.value,
                                    }))
                                }
                                placeholder="What makes your hotel special? Location highlights, style, guest experience…"
                            />
                        </div>
                    </>
                )}

                {section === 'location' && (
                    <>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="prop-city">City</Label>
                                <Input
                                    id="prop-city"
                                    value={form.city}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, city: e.target.value }))
                                    }
                                    placeholder="Addis Ababa"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="prop-country">Country code</Label>
                                <Input
                                    id="prop-country"
                                    value={form.country}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            country: e.target.value,
                                        }))
                                    }
                                    placeholder="ET"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="prop-loc">Street / area</Label>
                            <Input
                                id="prop-loc"
                                value={form.location}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        location: e.target.value,
                                    }))
                                }
                                placeholder="Bole Road, near airport"
                            />
                        </div>
                    </>
                )}

                {section === 'details' && (
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="prop-stars">Star rating</Label>
                            <Input
                                id="prop-stars"
                                type="number"
                                min={0}
                                max={5}
                                step={0.5}
                                value={form.star_rating}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        star_rating: e.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="prop-cur">Default currency</Label>
                            <Input
                                id="prop-cur"
                                value={form.default_currency}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        default_currency: e.target.value.toUpperCase(),
                                    }))
                                }
                                maxLength={3}
                            />
                        </div>
                    </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                    <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                        {saving ? 'Saving…' : 'Save changes'}
                    </Button>
                </div>
            </form>
        </HotelSectionShell>
    );
}

export default function HotelPropertyPage() {
    return (
        <Suspense fallback={<AdminLoader label="Loading property…" />}>
            <PropertyInner />
        </Suspense>
    );
}
