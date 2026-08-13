'use client';

/**
 * Super Admin property editor  reuses hotel portal property page patterns
 * via admin inventory API.
 */
import { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { adminInventoryFetch } from '@/lib/admin-inventory-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

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

    useEffect(() => {
        if (!hotelId) return;
        void (async () => {
            setLoading(true);
            try {
                const h = await adminInventoryFetch<{
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
            await adminInventoryFetch(`hotels/${hotelId}`, {
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
            toast.success('Property saved');
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
        <form
            onSubmit={save}
            className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm space-y-5 max-w-2xl"
        >
            <p className="text-xs text-slate-500">
                Section: {section}. Super Admin edits guest-facing property details here.
            </p>
            <div className="space-y-2">
                <Label>Hotel name</Label>
                <Input
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
            </div>
            <div className="space-y-2">
                <Label>Brand / chain</Label>
                <Input
                    value={form.brand}
                    onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                    placeholder="Momona Hotels"
                />
            </div>
            <div className="space-y-2">
                <Label>Description</Label>
                <textarea
                    className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.description}
                    onChange={(e) =>
                        setForm((f) => ({ ...f, description: e.target.value }))
                    }
                />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                        value={form.city}
                        onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Location / address</Label>
                    <Input
                        value={form.location}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, location: e.target.value }))
                        }
                    />
                </div>
                <div className="space-y-2">
                    <Label>Star rating</Label>
                    <Input
                        type="number"
                        min={0}
                        max={5}
                        step={0.5}
                        value={form.star_rating}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, star_rating: e.target.value }))
                        }
                    />
                </div>
                <div className="space-y-2">
                    <Label>Currency</Label>
                    <Input
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
            <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save property'}
            </Button>
        </form>
    );
}

export default function AdminInventoryPropertyPage() {
    return (
        <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
            <PropertyInner />
        </Suspense>
    );
}
