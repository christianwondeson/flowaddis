'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { hotelAdminFetch } from '@/lib/hotel-admin-api';
import { HotelSectionShell } from '@/components/hotel-portal/hotel-section-shell';
import { Button } from '@/components/ui/button';
import { AdminLoader } from '@/components/ui/admin-loader';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

type ReviewRow = {
    id: string;
    author_name: string;
    countrycode: string;
    guest_type: string;
    title: string;
    pros: string;
    cons: string;
    score: number;
    date: string;
    published: boolean;
    status?: string;
    verified_stay?: boolean;
    reverse_reason?: string;
};

function newId() {
    return `rev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function emptyReview(): ReviewRow {
    return {
        id: newId(),
        author_name: '',
        countrycode: 'ET',
        guest_type: 'Guest',
        title: '',
        pros: '',
        cons: '',
        score: 8,
        date: new Date().toISOString().slice(0, 10),
        published: true,
    };
}

export default function HotelReviewsPage() {
    const params = useParams();
    const hotelId = String(params.hotelId || '');
    const [reviews, setReviews] = useState<ReviewRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!hotelId) return;
        void (async () => {
            setLoading(true);
            try {
                const hotel = await hotelAdminFetch<{
                    guest_reviews?: ReviewRow[] | null;
                }>(`hotels/${hotelId}`);
                const list = Array.isArray(hotel.guest_reviews)
                    ? hotel.guest_reviews
                    : [];
                setReviews(
                    list.map((r) => ({
                        id: r.id || newId(),
                        author_name: r.author_name || '',
                        countrycode: r.countrycode || 'ET',
                        guest_type: r.guest_type || 'Guest',
                        title: r.title || '',
                        pros: r.pros || '',
                        cons: r.cons || '',
                        score: Number(r.score) || 8,
                        date: (r.date || '').slice(0, 10),
                        published: r.published !== false,
                        status: (r as ReviewRow).status || 'published',
                        verified_stay: Boolean((r as ReviewRow).verified_stay),
                        reverse_reason: (r as ReviewRow).reverse_reason || '',
                    })),
                );
            } catch (e) {
                toast.error((e as Error).message);
            } finally {
                setLoading(false);
            }
        })();
    }, [hotelId]);

    const save = async () => {
        const invalid = reviews.find((r) => !r.author_name.trim());
        if (invalid) {
            toast.error('Each review needs a guest name');
            return;
        }
        setSaving(true);
        try {
            await hotelAdminFetch(`hotels/${hotelId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    guest_reviews: reviews.map((r) => ({
                        ...r,
                        date: r.date
                            ? new Date(r.date).toISOString()
                            : new Date().toISOString(),
                    })),
                }),
            });
            toast.success(
                'Reviews saved  published ones appear on the guest hotel page',
            );
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            setSaving(false);
        }
    };

    const update = (id: string, patch: Partial<ReviewRow>) => {
        setReviews((list) =>
            list.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        );
    };

    return (
        <HotelSectionShell
            title="Guest reviews"
            description="Verified guest reviews require a real booking. To remove a false review, request Super Admin reverse with a clear reason  you cannot silently delete verified stays."
            items={[]}
        >
            <div className="space-y-4">
                <div className="flex flex-wrap gap-2 justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setReviews((r) => [emptyReview(), ...r])}
                        disabled={loading}
                    >
                        <Plus className="w-4 h-4 mr-1" />
                        Add review
                    </Button>
                    <Button onClick={() => void save()} disabled={saving || loading}>
                        {saving ? 'Saving…' : 'Save reviews'}
                    </Button>
                </div>

                {loading ? (
                    <AdminLoader label="Loading reviews…" />
                ) : reviews.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                        No reviews yet. Add guest feedback so travelers see social proof on
                        your listing.
                    </div>
                ) : (
                    <ul className="space-y-4">
                        {reviews.map((r) => (
                            <li
                                key={r.id}
                                className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-3"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <label className="flex items-center gap-2 text-sm font-medium">
                                        <input
                                            type="checkbox"
                                            checked={r.published}
                                            onChange={(e) =>
                                                update(r.id, {
                                                    published: e.target.checked,
                                                })
                                            }
                                        />
                                        Published on guest page
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {r.verified_stay ||
                                        r.guest_type
                                            ?.toLowerCase()
                                            .includes('verified') ? (
                                            <button
                                                type="button"
                                                className="text-amber-700 text-sm font-semibold"
                                                onClick={async () => {
                                                    const reason = window.prompt(
                                                        'Explain to BookAddis Super Admin why this verified review is false (min 10 chars):',
                                                    );
                                                    if (!reason || reason.trim().length < 10) {
                                                        toast.error(
                                                            'A clear reason is required for reverse',
                                                        );
                                                        return;
                                                    }
                                                    try {
                                                        await hotelAdminFetch(
                                                            `hotels/${hotelId}/reviews/${r.id}/request-reverse`,
                                                            {
                                                                method: 'POST',
                                                                body: JSON.stringify({
                                                                    reason: reason.trim(),
                                                                }),
                                                            },
                                                        );
                                                        toast.success(
                                                            'Reverse requested  awaiting Super Admin',
                                                        );
                                                        update(r.id, {
                                                            status: 'disputed',
                                                            reverse_reason:
                                                                reason.trim(),
                                                        });
                                                    } catch (e) {
                                                        toast.error(
                                                            (e as Error).message,
                                                        );
                                                    }
                                                }}
                                            >
                                                Request reverse
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                className="text-red-600 text-sm inline-flex items-center gap-1"
                                                onClick={() =>
                                                    setReviews((list) =>
                                                        list.filter(
                                                            (x) => x.id !== r.id,
                                                        ),
                                                    )
                                                }
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {r.status === 'disputed' ? (
                                    <p className="text-xs text-amber-800 bg-amber-50 rounded-lg px-3 py-2">
                                        Disputed  waiting for BookAddis Super
                                        Admin. Reason: {r.reverse_reason || ' '}
                                    </p>
                                ) : null}
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    <label className="text-xs space-y-1">
                                        <span className="font-semibold">Guest name</span>
                                        <input
                                            className="w-full rounded-lg border px-2 py-1.5 text-sm"
                                            value={r.author_name}
                                            onChange={(e) =>
                                                update(r.id, {
                                                    author_name: e.target.value,
                                                })
                                            }
                                        />
                                    </label>
                                    <label className="text-xs space-y-1">
                                        <span className="font-semibold">Country</span>
                                        <input
                                            className="w-full rounded-lg border px-2 py-1.5 text-sm"
                                            value={r.countrycode}
                                            onChange={(e) =>
                                                update(r.id, {
                                                    countrycode: e.target.value,
                                                })
                                            }
                                        />
                                    </label>
                                    <label className="text-xs space-y-1">
                                        <span className="font-semibold">Score (0–10)</span>
                                        <input
                                            type="number"
                                            min={0}
                                            max={10}
                                            step={0.1}
                                            className="w-full rounded-lg border px-2 py-1.5 text-sm"
                                            value={r.score}
                                            onChange={(e) =>
                                                update(r.id, {
                                                    score: Number(e.target.value),
                                                })
                                            }
                                        />
                                    </label>
                                    <label className="text-xs space-y-1">
                                        <span className="font-semibold">Date</span>
                                        <input
                                            type="date"
                                            className="w-full rounded-lg border px-2 py-1.5 text-sm"
                                            value={r.date}
                                            onChange={(e) =>
                                                update(r.id, { date: e.target.value })
                                            }
                                        />
                                    </label>
                                </div>
                                <label className="block text-xs space-y-1">
                                    <span className="font-semibold">Title</span>
                                    <input
                                        className="w-full rounded-lg border px-2 py-1.5 text-sm"
                                        value={r.title}
                                        onChange={(e) =>
                                            update(r.id, { title: e.target.value })
                                        }
                                    />
                                </label>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <label className="text-xs space-y-1">
                                        <span className="font-semibold text-green-700">
                                            Pros
                                        </span>
                                        <textarea
                                            rows={2}
                                            className="w-full rounded-lg border px-2 py-1.5 text-sm"
                                            value={r.pros}
                                            onChange={(e) =>
                                                update(r.id, { pros: e.target.value })
                                            }
                                        />
                                    </label>
                                    <label className="text-xs space-y-1">
                                        <span className="font-semibold text-red-700">
                                            Cons
                                        </span>
                                        <textarea
                                            rows={2}
                                            className="w-full rounded-lg border px-2 py-1.5 text-sm"
                                            value={r.cons}
                                            onChange={(e) =>
                                                update(r.id, { cons: e.target.value })
                                            }
                                        />
                                    </label>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </HotelSectionShell>
    );
}
