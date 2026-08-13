'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { auth } from '@/lib/firebase';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from '@/types/auth';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

type HotelOption = {
    id: string;
    name: string;
    city?: string | null;
    status?: string;
    amenities?: Record<string, unknown> | null;
};

type Props = {
    user: User | null;
    open: boolean;
    onClose: () => void;
    onAssigned: (userId: string) => void;
    /** Prefill create-hotel from a partner request */
    preferCreateFromRequest?: boolean;
    /** Prefill existing hotel selection */
    defaultHotelId?: string;
};

async function authHeaders(): Promise<HeadersInit> {
    const token = await auth?.currentUser?.getIdToken();
    if (!token) throw new Error('Not signed in');
    return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
}

/**
 * Super Admin: assign a Firestore user as hotel_admin / hotel_staff for a hotel.
 * Creates Postgres membership + sets Firestore role (via Nest). Optionally publishes.
 */
export function AssignHotelAdminModal({
    user,
    open,
    onClose,
    onAssigned,
    preferCreateFromRequest = false,
    defaultHotelId,
}: Props) {
    const [hotels, setHotels] = useState<HotelOption[]>([]);
    const [loadingHotels, setLoadingHotels] = useState(false);
    const [hotelId, setHotelId] = useState('');
    const [hotelFilter, setHotelFilter] = useState('');
    const [createName, setCreateName] = useState('');
    const [createCity, setCreateCity] = useState('');
    const [createBrand, setCreateBrand] = useState('');
    const [membershipRole, setMembershipRole] = useState<'hotel_admin' | 'hotel_staff'>(
        'hotel_admin',
    );
    const [mode, setMode] = useState<'existing' | 'create'>('existing');
    const [publishToBookAddis, setPublishToBookAddis] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!open) return;
        const req = user?.hotelPartnerRequest;
        const hasRequestName = Boolean(req?.hotelName?.trim());
        setMode(
            preferCreateFromRequest && hasRequestName && !defaultHotelId
                ? 'create'
                : 'existing',
        );
        setHotelId(defaultHotelId || '');
        setHotelFilter(req?.hotelName?.trim() || '');
        setCreateName(req?.hotelName?.trim() || '');
        setCreateCity(req?.city?.trim() || '');
        setCreateBrand('');
        setMembershipRole('hotel_admin');
        // Default off  publish requires business license on the hotel record.
        setPublishToBookAddis(false);
    }, [open, preferCreateFromRequest, user, defaultHotelId]);

    const reqName = user?.hotelPartnerRequest?.hotelName?.trim() || '';

    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        (async () => {
            setLoadingHotels(true);
            try {
                const headers = await authHeaders();
                const res = await fetch(
                    '/api/admin/hotels?limit=100&inventory_source=bookaddis_direct',
                    { headers },
                );
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                    throw new Error((data as { error?: string }).error || 'Failed to load hotels');
                }
                if (cancelled) return;
                const items = Array.isArray((data as { items?: HotelOption[] }).items)
                    ? (data as { items: HotelOption[] }).items
                    : [];
                setHotels(items);

                // Auto-select best match for requested name (e.g. Momona)
                const needle = (
                    user?.hotelPartnerRequest?.hotelName?.trim() || ''
                ).toLowerCase();
                if (!defaultHotelId && needle) {
                    const match = items.find((h) =>
                        h.name.toLowerCase().includes(needle),
                    );
                    if (match) {
                        setHotelId(match.id);
                        setMode('existing');
                    }
                }
            } catch (e) {
                toast.error((e as Error).message || 'Failed to load hotels');
            } finally {
                if (!cancelled) setLoadingHotels(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [open, defaultHotelId, user?.hotelPartnerRequest?.hotelName]);

    const filteredHotels = useMemo(() => {
        const needle = hotelFilter.trim().toLowerCase();
        if (!needle) return hotels;
        return hotels.filter((h) => {
            const brand = String(h.amenities?.brand || '');
            return (
                h.name.toLowerCase().includes(needle) ||
                (h.city || '').toLowerCase().includes(needle) ||
                brand.toLowerCase().includes(needle)
            );
        });
    }, [hotels, hotelFilter]);

    const publishHotel = async (targetHotelId: string) => {
        const headers = await authHeaders();
        const res = await fetch(`/api/admin/hotels/${targetHotelId}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ status: 'published' }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            throw new Error(
                (data as { error?: string }).error || 'Failed to publish hotel',
            );
        }
    };

    const assign = async (targetHotelId: string) => {
        if (!user) return;
        const headers = await authHeaders();
        const res = await fetch('/api/admin/hotel-memberships', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                hotelId: targetHotelId,
                firebaseUid: user.id,
                role: membershipRole,
                setFirestoreRole: true,
                preferredPlanCode:
                    user.hotelPartnerRequest?.preferredPlanCode || 'starter',
                startTrial: true,
            }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            throw new Error(
                (data as { error?: string }).error || 'Failed to assign membership',
            );
        }

        if (db) {
            await updateDoc(doc(db, 'users', user.id), {
                hotelPartnerStatus: 'approved',
                updatedAt: serverTimestamp(),
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        const kyc = user.hotelPartnerRequest?.kyc;
        if (preferCreateFromRequest) {
            const { isKycPackageComplete, kycMissingLabels } = await import(
                '@/lib/hotel-partner-kyc'
            );
            if (!isKycPackageComplete(kyc)) {
                toast.error(
                    `Incomplete KYC: ${kycMissingLabels(kyc).join(', ')}. Inspect & reject or wait for resubmit.`,
                );
                return;
            }
        }
        setSaving(true);
        try {
            let targetHotelId = hotelId;

            if (mode === 'create') {
                const name =
                    createName.trim() ||
                    user.hotelPartnerRequest?.hotelName?.trim() ||
                    `${user.name || user.email}'s Hotel`;
                const headers = await authHeaders();
                const amenities: Record<string, unknown> = {};
                if (createBrand.trim()) amenities.brand = createBrand.trim();

                const { verificationFromPartnerKyc, withHotelVerification } =
                    await import('@/lib/hotel-verification');
                const kyc = user.hotelPartnerRequest?.kyc;
                const verification = verificationFromPartnerKyc(kyc);
                const media = withHotelVerification(
                    kyc?.logoUrl
                        ? {
                              photos: [
                                  {
                                      url: kyc.logoUrl,
                                      caption: 'Logo',
                                      sort: 0,
                                  },
                              ],
                          }
                        : {},
                    verification,
                );

                const createRes = await fetch('/api/admin/hotels', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        name,
                        city:
                            createCity.trim() ||
                            user.hotelPartnerRequest?.city ||
                            kyc?.city ||
                            undefined,
                        location: kyc?.businessAddress || undefined,
                        country: kyc?.country || 'ET',
                        inventory_source: 'bookaddis_direct',
                        // Always draft/pending until Super Admin publishes with docs.
                        status: 'pending_review',
                        media,
                        ...(Object.keys(amenities).length ? { amenities } : {}),
                    }),
                });
                const created = await createRes.json().catch(() => ({}));
                if (!createRes.ok) {
                    throw new Error(
                        (created as { error?: string; message?: string }).error ||
                            (created as { message?: string }).message ||
                            'Failed to create hotel',
                    );
                }
                targetHotelId = (created as { id?: string }).id || '';
                if (!targetHotelId) {
                    throw new Error('Hotel created but no id returned');
                }
            } else if (targetHotelId && user.hotelPartnerRequest?.kyc) {
                // Attach partner KYC onto existing hotel verification package.
                const headers = await authHeaders();
                const getRes = await fetch(`/api/admin/hotels/${targetHotelId}`, {
                    headers,
                });
                const existing = await getRes.json().catch(() => ({}));
                if (getRes.ok) {
                    const { verificationFromPartnerKyc, withHotelVerification } =
                        await import('@/lib/hotel-verification');
                    const media = withHotelVerification(
                        ((existing as { media?: Record<string, unknown> })
                            .media || {}) as Record<string, unknown>,
                        verificationFromPartnerKyc(user.hotelPartnerRequest.kyc),
                    );
                    await fetch(`/api/admin/hotels/${targetHotelId}`, {
                        method: 'PUT',
                        headers,
                        body: JSON.stringify({ media }),
                    });
                }
            }

            if (!targetHotelId) {
                toast.error('Select a hotel');
                return;
            }

            await assign(targetHotelId);

            if (publishToBookAddis) {
                await publishHotel(targetHotelId);
            }

            toast.success(
                `Approved ${user.name || user.email} as ${membershipRole.replace('_', ' ')}. ${
                    publishToBookAddis
                        ? 'Hotel is published  they can set rooms & rates for BookAddis.'
                        : 'Hotel stays pending review until you publish it (business license required).'
                }`,
            );
            onAssigned(user.id);
            onClose();
        } catch (err) {
            toast.error((err as Error).message || 'Assignment failed');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            isOpen={open && !!user}
            onClose={onClose}
            title={`Approve hotel access  ${user?.name || user?.email || ''}`}
        >
            <form onSubmit={handleSubmit} className="space-y-5 p-1">
                <p className="text-sm text-gray-600">
                    This grants Hotel Portal access for the reservation desk (rooms, beds,
                    rates, reservations). It is separate from BookAddis Super Admin.
                </p>

                {user?.hotelPartnerRequest?.hotelName && (
                    <div className="rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-2 text-sm text-amber-900">
                        <div className="font-semibold">Partner request</div>
                        <div>
                            {user.hotelPartnerRequest.hotelName}
                            {user.hotelPartnerRequest.city
                                ? ` · ${user.hotelPartnerRequest.city}`
                                : ''}
                        </div>
                        {user.hotelPartnerRequest.message ? (
                            <div className="mt-1 text-amber-800/90">
                                {user.hotelPartnerRequest.message}
                            </div>
                        ) : null}
                    </div>
                )}

                <div className="space-y-2">
                    <Label>Desk role</Label>
                    <select
                        className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                        value={membershipRole}
                        onChange={(e) =>
                            setMembershipRole(
                                e.target.value as 'hotel_admin' | 'hotel_staff',
                            )
                        }
                    >
                        <option value="hotel_admin">
                            Hotel Admin  full property extranet
                        </option>
                        <option value="hotel_staff">
                            Hotel Staff / agent  front desk
                        </option>
                    </select>
                </div>

                <div className="space-y-2">
                    <Label>Property</Label>
                    <div className="flex flex-wrap gap-3 text-sm">
                        <label className="inline-flex items-center gap-2">
                            <input
                                type="radio"
                                name="hotelMode"
                                checked={mode === 'existing'}
                                onChange={() => setMode('existing')}
                            />
                            Link existing hotel (e.g. Momona)
                        </label>
                        <label className="inline-flex items-center gap-2">
                            <input
                                type="radio"
                                name="hotelMode"
                                checked={mode === 'create'}
                                onChange={() => setMode('create')}
                            />
                            Create new Direct hotel
                        </label>
                    </div>
                </div>

                {mode === 'existing' ? (
                    <div className="space-y-2">
                        <Input
                            value={hotelFilter}
                            onChange={(e) => setHotelFilter(e.target.value)}
                            placeholder="Filter hotels…"
                        />
                        <select
                            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                            value={hotelId}
                            onChange={(e) => setHotelId(e.target.value)}
                            disabled={loadingHotels}
                            required
                        >
                            <option value="">
                                {loadingHotels ? 'Loading hotels…' : 'Select hotel…'}
                            </option>
                            {filteredHotels.map((h) => (
                                <option key={h.id} value={h.id}>
                                    {h.name}
                                    {h.city ? ` (${h.city})` : ''}
                                    {h.status ? `  ${h.status}` : ''}
                                </option>
                            ))}
                        </select>
                        {filteredHotels.length === 0 && !loadingHotels && (
                            <p className="text-xs text-amber-800">
                                No match. Switch to “Create new” or register the hotel under
                                Hotel Partners first.
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <Label>Hotel name</Label>
                            <Input
                                value={createName}
                                onChange={(e) => setCreateName(e.target.value)}
                                placeholder="Momona"
                                required
                            />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                                <Label>City</Label>
                                <Input
                                    value={createCity}
                                    onChange={(e) => setCreateCity(e.target.value)}
                                    placeholder="Addis Ababa"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Brand (optional)</Label>
                                <Input
                                    value={createBrand}
                                    onChange={(e) => setCreateBrand(e.target.value)}
                                    placeholder="Momona Hotels"
                                />
                            </div>
                        </div>
                    </div>
                )}

                <label className="flex items-start gap-2 rounded-lg border border-green-100 bg-green-50/70 px-3 py-2 text-sm text-green-950">
                    <input
                        type="checkbox"
                        className="mt-1"
                        checked={publishToBookAddis}
                        onChange={(e) => setPublishToBookAddis(e.target.checked)}
                    />
                    <span>
                        <span className="font-semibold">Publish on BookAddis now</span>
                        <span className="block text-xs text-green-900/80 mt-0.5">
                            Requires business license + tax + owner ID on the hotel
                            (copied from partner KYC when creating). Prefer leaving off
                            until rooms & rates exist.
                        </span>
                    </span>
                </label>

                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={saving || (mode === 'existing' && !hotelId)}>
                        {saving ? 'Saving…' : 'Approve & assign'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
