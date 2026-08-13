'use client';

import React, { useEffect, useState } from 'react';
import { Star, MessageSquare, BadgeCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/auth-provider';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';
import Link from 'next/link';

interface Review {
    review_id: number | string;
    title: string;
    pros: string;
    cons: string;
    average_score: number;
    date: string;
    verified_stay?: boolean;
    author: {
        name: string;
        avatar?: string;
        countrycode: string;
        type_string: string;
    };
}

interface HotelDetailReviewsProps {
    reviews: Review[];
    loading?: boolean;
    hotelId?: string;
    /** BookAddis Direct  allow verified guest submit */
    allowGuestSubmit?: boolean;
}

export const HotelDetailReviews: React.FC<HotelDetailReviewsProps> = ({
    reviews,
    loading = false,
    hotelId,
    allowGuestSubmit = false,
}) => {
    const { user } = useAuth();
    const [eligibleBookings, setEligibleBookings] = useState<
        Array<{ id: string; label: string }>
    >([]);
    const [bookingId, setBookingId] = useState('');
    const [score, setScore] = useState(8);
    const [title, setTitle] = useState('');
    const [pros, setPros] = useState('');
    const [cons, setCons] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [localReviews, setLocalReviews] = useState(reviews);

    useEffect(() => {
        setLocalReviews(reviews);
    }, [reviews]);

    useEffect(() => {
        if (!allowGuestSubmit || !user || !hotelId) return;
        let cancelled = false;
        (async () => {
            try {
                const token = await auth?.currentUser?.getIdToken();
                if (!token) return;
                const res = await fetch('/api/bookings/me?limit=50', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) return;
                const data = await res.json();
                const items = Array.isArray(data?.items)
                    ? data.items
                    : Array.isArray(data)
                      ? data
                      : [];
                const eligible = items
                    .filter((b: any) => {
                        const status = String(b.status || '').toUpperCase();
                        if (status !== 'PAID' && status !== 'CONFIRMED')
                            return false;
                        const hid = String(
                            b.external_item_id ||
                                b.external_snapshot?.hotel_id ||
                                b.external_snapshot?.hotelId ||
                                '',
                        );
                        return hid === hotelId;
                    })
                    .map((b: any) => ({
                        id: String(b.id),
                        label: `${b.external_snapshot?.serviceName || 'Stay'} · ${
                            b.external_snapshot?.checkIn ||
                            b.external_snapshot?.check_in ||
                            ''
                        }`,
                    }));
                if (!cancelled) {
                    setEligibleBookings(eligible);
                    if (eligible[0]) setBookingId(eligible[0].id);
                }
            } catch {
                /* ignore */
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [allowGuestSubmit, user, hotelId]);

    const submit = async () => {
        if (!user || !hotelId || !bookingId) {
            toast.error('Sign in and choose a completed stay to review');
            return;
        }
        setSubmitting(true);
        try {
            const token = await auth?.currentUser?.getIdToken();
            if (!token) throw new Error('Sign in required');
            const res = await fetch(`/api/hotels/direct/${hotelId}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    bookingId,
                    score,
                    title,
                    pros,
                    cons,
                    authorName: user.name || user.email || 'Guest',
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(
                    data.message || data.error || 'Could not submit review',
                );
            }
            toast.success('Review published  thank you');
            const r = data.review;
            if (r) {
                setLocalReviews((prev) => [
                    {
                        review_id: r.id,
                        title: r.title || '',
                        pros: r.pros || '',
                        cons: r.cons || '',
                        average_score: r.score,
                        date: r.date,
                        verified_stay: true,
                        author: {
                            name: r.author_name,
                            countrycode: r.countrycode || 'ET',
                            type_string: 'Verified guest',
                        },
                    },
                    ...prev,
                ]);
            }
            setTitle('');
            setPros('');
            setCons('');
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="animate-pulse flex gap-4 p-6 border border-border rounded-2xl"
                    >
                        <div className="w-12 h-12 bg-gray-200 dark:bg-slate-700 rounded-full shrink-0" />
                        <div className="flex-1 space-y-3">
                            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/4" />
                            <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-full" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {allowGuestSubmit ? (
                <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                    <h3 className="font-bold text-foreground">
                        Write a verified review
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        Only guests with a paid/confirmed booking at this hotel
                        can review. Hotels may request Super Admin reverse of
                        false reviews.
                    </p>
                    {!user ? (
                        <Button asChild variant="outline">
                            <Link
                                href={`/signin?redirect=${encodeURIComponent(
                                    typeof window !== 'undefined'
                                        ? window.location.pathname + '#reviews'
                                        : `/hotels/${hotelId}#reviews`,
                                )}`}
                            >
                                Sign in to review
                            </Link>
                        </Button>
                    ) : eligibleBookings.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No completed stay found for this property yet.
                        </p>
                    ) : (
                        <>
                            <label className="block text-sm space-y-1">
                                <span className="font-semibold">Your stay</span>
                                <select
                                    className="w-full h-10 rounded-md border border-input px-3 text-sm"
                                    value={bookingId}
                                    onChange={(e) => setBookingId(e.target.value)}
                                >
                                    {eligibleBookings.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="block text-sm space-y-1">
                                <span className="font-semibold">
                                    Score (1–10)
                                </span>
                                <input
                                    type="number"
                                    min={1}
                                    max={10}
                                    className="w-24 h-10 rounded-md border border-input px-3"
                                    value={score}
                                    onChange={(e) =>
                                        setScore(Number(e.target.value) || 8)
                                    }
                                />
                            </label>
                            <input
                                className="w-full h-10 rounded-md border border-input px-3 text-sm"
                                placeholder="Title (optional)"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                            <textarea
                                className="w-full min-h-[72px] rounded-md border border-input px-3 py-2 text-sm"
                                placeholder="What you liked"
                                value={pros}
                                onChange={(e) => setPros(e.target.value)}
                            />
                            <textarea
                                className="w-full min-h-[56px] rounded-md border border-input px-3 py-2 text-sm"
                                placeholder="What could improve (optional)"
                                value={cons}
                                onChange={(e) => setCons(e.target.value)}
                            />
                            <Button
                                onClick={() => void submit()}
                                disabled={submitting}
                                className="bg-brand-primary text-white"
                            >
                                {submitting ? 'Submitting…' : 'Publish review'}
                            </Button>
                        </>
                    )}
                </div>
            ) : null}

            {localReviews.length === 0 ? (
                <div className="text-center py-12 bg-muted/40 dark:bg-slate-800/40 rounded-2xl border border-dashed border-border">
                    <MessageSquare className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-foreground">
                        No reviews yet
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Be the first verified guest to share your stay.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {localReviews.map((review) => (
                        <div
                            key={review.review_id}
                            className="p-6 border border-border rounded-2xl hover:border-brand-primary/20 hover:shadow-sm transition-all duration-300 bg-card"
                        >
                            <div className="flex justify-between items-start mb-4 gap-3">
                                <div className="flex gap-4 min-w-0">
                                    <div className="w-12 h-12 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center font-bold text-lg shrink-0">
                                        {(review.author.name || 'G').charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-foreground truncate flex items-center gap-1.5">
                                            {review.author.name}
                                            {review.verified_stay ||
                                            review.author.type_string
                                                ?.toLowerCase()
                                                .includes('verified') ? (
                                                <BadgeCheck className="w-4 h-4 text-brand-primary shrink-0" />
                                            ) : null}
                                        </h4>
                                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                            <span>
                                                {(
                                                    review.author.countrycode ||
                                                    ''
                                                ).toUpperCase()}
                                            </span>
                                            {review.author.type_string ? (
                                                <>
                                                    <span>•</span>
                                                    <span>
                                                        {review.author.type_string}
                                                    </span>
                                                </>
                                            ) : null}
                                            {review.date ? (
                                                <>
                                                    <span>•</span>
                                                    <span>
                                                        {new Date(
                                                            review.date,
                                                        ).toLocaleDateString()}
                                                    </span>
                                                </>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 bg-brand-primary text-white px-2 py-1 rounded-lg font-bold text-sm shrink-0">
                                    <Star className="w-3 h-3 fill-current" />
                                    {Number(review.average_score || 0).toFixed(1)}
                                </div>
                            </div>
                            <div className="space-y-3">
                                {review.title ? (
                                    <h5 className="font-bold text-foreground text-sm">
                                        {review.title}
                                    </h5>
                                ) : null}
                                {review.pros ? (
                                    <div className="text-sm text-muted-foreground leading-relaxed">
                                        {review.pros}
                                    </div>
                                ) : null}
                                {review.cons ? (
                                    <div className="text-sm text-muted-foreground leading-relaxed">
                                        <span className="font-semibold text-foreground">
                                            Could improve:{' '}
                                        </span>
                                        {review.cons}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
