'use client';

import { useEffect, useState } from 'react';
import { adminInventoryFetch } from '@/lib/admin-inventory-api';
import { AdminLoader } from '@/components/ui/admin-loader';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export type DisputedReviewRow = {
    hotel_id: string;
    hotel_name: string;
    review: {
        id: string;
        author_name: string;
        score: number;
        pros?: string | null;
        reverse_reason?: string | null;
        title?: string | null;
    };
};

export function DisputedReviewsPanel() {
    const [items, setItems] = useState<DisputedReviewRow[]>([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const data = await adminInventoryFetch<{ items: DisputedReviewRow[] }>(
                'hotels/reviews/disputed',
                undefined,
                'Loading disputed reviews…',
            );
            setItems(data.items || []);
        } catch (e) {
            toast.error((e as Error).message);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, []);

    const approve = async (row: DisputedReviewRow) => {
        const note =
            window.prompt(
                'Optional note after persuasion / investigation:',
            ) || '';
        try {
            await adminInventoryFetch(
                `hotels/${row.hotel_id}/reviews/${row.review.id}/approve-reverse`,
                {
                    method: 'POST',
                    body: JSON.stringify({ note }),
                },
                'Reversing review…',
            );
            toast.success('Review reversed and hidden from guests');
            void load();
        } catch (e) {
            toast.error((e as Error).message);
        }
    };

    if (loading) return <AdminLoader label="Loading review disputes…" />;

    if (items.length === 0) {
        return (
            <p className="text-sm text-slate-500 py-8 text-center">
                No open review disputes.
            </p>
        );
    }

    return (
        <ul className="space-y-4">
            {items.map((row) => (
                <li
                    key={`${row.hotel_id}-${row.review.id}`}
                    className="rounded-xl border border-slate-200 bg-white p-4 space-y-2"
                >
                    <p className="font-bold text-brand-dark">{row.hotel_name}</p>
                    <p className="text-sm">
                        {row.review.author_name} · score {row.review.score}
                    </p>
                    {row.review.title ? (
                        <p className="text-sm font-semibold">{row.review.title}</p>
                    ) : null}
                    {row.review.pros ? (
                        <p className="text-sm text-slate-600">{row.review.pros}</p>
                    ) : null}
                    <p className="text-xs text-amber-800 bg-amber-50 rounded-lg px-3 py-2">
                        Hotel reason: {row.review.reverse_reason || ' '}
                    </p>
                    <Button
                        size="sm"
                        onClick={() => void approve(row)}
                        className="bg-brand-primary text-white"
                    >
                        Approve reverse
                    </Button>
                </li>
            ))}
        </ul>
    );
}
