'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { hotelAdminFetch } from '@/lib/hotel-admin-api';
import { HotelSectionShell } from '@/components/hotel-portal/hotel-section-shell';
import { Button } from '@/components/ui/button';
import { AdminLoader } from '@/components/ui/admin-loader';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
    Plus,
    Trash2,
    Pencil,
    Star,
    CheckCircle2,
    Eye,
    EyeOff,
    ThumbsUp,
    ThumbsDown,
    AlertCircle,
    User as UserIcon,
    Calendar,
    Globe,
    Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatAdminDate } from '@/lib/admin-date-format';

export type ReviewRow = {
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
        score: 8.5,
        date: new Date().toISOString().slice(0, 10),
        published: true,
    };
}

function scoreBadgeColor(score: number) {
    if (score >= 8.5) return 'bg-emerald-600 text-white';
    if (score >= 7.0) return 'bg-teal-600 text-white';
    if (score >= 5.0) return 'bg-amber-600 text-white';
    return 'bg-rose-600 text-white';
}

export default function HotelReviewsPage() {
    const params = useParams();
    const hotelId = String(params.hotelId || '');
    const [reviews, setReviews] = useState<ReviewRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Modal state for Add / Edit
    const [modalOpen, setModalOpen] = useState(false);
    const [editingReview, setEditingReview] = useState<ReviewRow | null>(null);
    const [formData, setFormData] = useState<ReviewRow>(emptyReview());

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

    const persistReviews = async (updatedList: ReviewRow[]) => {
        setSaving(true);
        try {
            await hotelAdminFetch(`hotels/${hotelId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    guest_reviews: updatedList.map((r) => ({
                        ...r,
                        date: r.date
                            ? new Date(r.date).toISOString()
                            : new Date().toISOString(),
                    })),
                }),
            });
            setReviews(updatedList);
            return true;
        } catch (e) {
            toast.error((e as Error).message);
            return false;
        } finally {
            setSaving(false);
        }
    };

    const handleOpenAdd = () => {
        setEditingReview(null);
        setFormData(emptyReview());
        setModalOpen(true);
    };

    const handleOpenEdit = (rev: ReviewRow) => {
        setEditingReview(rev);
        setFormData({ ...rev });
        setModalOpen(true);
    };

    const handleSaveReviewModal = async () => {
        if (!formData.author_name.trim()) {
            toast.error('Guest name is required.');
            return;
        }

        let updatedList: ReviewRow[];
        if (editingReview) {
            // Updating existing
            updatedList = reviews.map((r) =>
                r.id === editingReview.id ? { ...formData } : r,
            );
        } else {
            // Adding new
            updatedList = [formData, ...reviews];
        }

        const success = await persistReviews(updatedList);
        if (success) {
            toast.success(
                editingReview
                    ? 'Review updated successfully.'
                    : 'New review added successfully.',
            );
            setModalOpen(false);
        }
    };

    const handleTogglePublish = async (id: string, currentPublished: boolean) => {
        const nextPublished = !currentPublished;
        const updatedList = reviews.map((r) =>
            r.id === id ? { ...r, published: nextPublished } : r,
        );
        const success = await persistReviews(updatedList);
        if (success) {
            toast.success(
                nextPublished
                    ? 'Review published on hotel listing.'
                    : 'Review hidden from listing.',
            );
        }
    };

    const handleDeleteReview = async (id: string) => {
        if (!confirm('Are you sure you want to remove this review?')) return;
        const updatedList = reviews.filter((r) => r.id !== id);
        const success = await persistReviews(updatedList);
        if (success) {
            toast.success('Review removed.');
        }
    };

    const handleRequestReverse = async (r: ReviewRow) => {
        const reason = window.prompt(
            'Explain to BookAddis Super Admin why this verified review is false (min 10 chars):',
        );
        if (!reason || reason.trim().length < 10) {
            toast.error('A clear reason is required for reverse');
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
            toast.success('Reverse requested  awaiting Super Admin');
            const updated = reviews.map((x) =>
                x.id === r.id
                    ? { ...x, status: 'disputed', reverse_reason: reason.trim() }
                    : x,
            );
            setReviews(updated);
        } catch (e) {
            toast.error((e as Error).message);
        }
    };

    return (
        <HotelSectionShell
            title="Guest reviews"
            description="Manage traveler feedback for your property. Verified guest reviews require a real booking. You can add curated feedback or request removal for false verified reviews."
            items={[]}
        >
            <div className="space-y-6">
                {/* Header Actions */}
                <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                            <Star className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-900">
                                Total Reviews: {reviews.length}
                            </h2>
                            <p className="text-xs text-slate-500">
                                {reviews.filter((r) => r.published).length}{' '}
                                published on public listing page
                            </p>
                        </div>
                    </div>
                    <Button
                        type="button"
                        onClick={handleOpenAdd}
                        disabled={loading || saving}
                        className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold"
                    >
                        <Plus className="w-4 h-4 mr-1.5" />
                        Add review
                    </Button>
                </div>

                {/* Reviews Listing */}
                {loading ? (
                    <AdminLoader label="Loading reviews…" />
                ) : reviews.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                            <Star className="w-6 h-6" />
                        </div>
                        <h3 className="text-base font-bold text-slate-800">
                            No guest reviews yet
                        </h3>
                        <p className="text-sm text-slate-500 max-w-sm mx-auto">
                            Add guest feedback so travelers see social proof and ratings on
                            your hotel detail page.
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleOpenAdd}
                            className="rounded-xl mt-2"
                        >
                            <Plus className="w-4 h-4 mr-1.5" />
                            Add first review
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reviews.map((r) => {
                            const isVerified =
                                r.verified_stay ||
                                r.guest_type?.toLowerCase().includes('verified');

                            return (
                                <div
                                    key={r.id}
                                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition-all space-y-4"
                                >
                                    {/* Top Row: Guest Info, Score & Action Buttons */}
                                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-800 font-bold text-sm">
                                                {r.author_name?.[0]?.toUpperCase() || 'G'}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-900 text-base">
                                                        {r.author_name}
                                                    </span>
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                                        <Globe className="w-2.5 h-2.5 mr-1 text-slate-400" />
                                                        {r.countrycode || 'ET'}
                                                    </span>
                                                    {isVerified && (
                                                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                                            <CheckCircle2 className="w-3 h-3 text-blue-600" />
                                                            Verified stay
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>
                                                        {r.date
                                                            ? formatAdminDate(r.date)
                                                            : 'No date'}
                                                    </span>
                                                    <span>·</span>
                                                    <span>{r.guest_type || 'Guest'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {/* Score Pill */}
                                            <div
                                                className={cn(
                                                    'px-2.5 py-1 rounded-xl text-sm font-black flex items-center gap-1',
                                                    scoreBadgeColor(r.score),
                                                )}
                                                title={`Review Score: ${r.score} / 10`}
                                            >
                                                <Star className="w-3.5 h-3.5 fill-current" />
                                                <span>{Number(r.score).toFixed(1)}</span>
                                            </div>

                                            {/* Published Status Pill */}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleTogglePublish(r.id, r.published)
                                                }
                                                className={cn(
                                                    'inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-semibold border transition-colors',
                                                    r.published
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200',
                                                )}
                                                title={
                                                    r.published
                                                        ? 'Click to unpublish'
                                                        : 'Click to publish'
                                                }
                                            >
                                                {r.published ? (
                                                    <>
                                                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                                                        Published
                                                    </>
                                                ) : (
                                                    <>
                                                        <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                                                        Hidden
                                                    </>
                                                )}
                                            </button>

                                            {/* Edit Button */}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleOpenEdit(r)}
                                                className="rounded-xl h-8 px-2.5 text-slate-700 hover:text-slate-900 border-slate-200"
                                            >
                                                <Pencil className="w-3.5 h-3.5 mr-1 text-slate-500" />
                                                Edit
                                            </Button>

                                            {/* Delete / Reverse Button */}
                                            {isVerified ? (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRequestReverse(r)}
                                                    className="rounded-xl h-8 text-amber-700 hover:bg-amber-50 text-xs"
                                                >
                                                    Request reverse
                                                </Button>
                                            ) : (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteReview(r.id)}
                                                    className="rounded-xl h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                                    title="Delete review"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Disputed Notice */}
                                    {r.status === 'disputed' && (
                                        <div className="flex items-center gap-2 text-xs text-amber-900 bg-amber-50 rounded-xl px-3 py-2 border border-amber-200">
                                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                            <span>
                                                <strong>Dispute pending review:</strong>{' '}
                                                {r.reverse_reason ||
                                                    'Awaiting Super Admin decision.'}
                                            </span>
                                        </div>
                                    )}

                                    {/* Review Title */}
                                    {r.title && (
                                        <h4 className="font-bold text-slate-900 text-sm">
                                            &ldquo;{r.title}&rdquo;
                                        </h4>
                                    )}

                                    {/* Pros & Cons Display */}
                                    <div className="grid gap-3 sm:grid-cols-2 pt-1 text-xs">
                                        {r.pros ? (
                                            <div className="rounded-xl bg-emerald-50/50 border border-emerald-100 p-3 space-y-1">
                                                <span className="font-bold text-emerald-800 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                                                    <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                                                    Liked most
                                                </span>
                                                <p className="text-slate-700 leading-relaxed">
                                                    {r.pros}
                                                </p>
                                            </div>
                                        ) : null}

                                        {r.cons ? (
                                            <div className="rounded-xl bg-rose-50/50 border border-rose-100 p-3 space-y-1">
                                                <span className="font-bold text-rose-800 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                                                    <ThumbsDown className="w-3.5 h-3.5 text-rose-600" />
                                                    Areas for improvement
                                                </span>
                                                <p className="text-slate-700 leading-relaxed">
                                                    {r.cons}
                                                </p>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal for Add / Edit Review */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingReview ? 'Edit Guest Review' : 'Add New Guest Review'}
            >
                <div className="space-y-4 text-sm">
                    <p className="text-xs text-slate-500">
                        {editingReview
                            ? 'Update this review details and rating.'
                            : 'Add a guest testimonial or external verified feedback.'}
                    </p>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                            <Label htmlFor="rev-author">Guest Name *</Label>
                            <Input
                                id="rev-author"
                                placeholder="e.g. John Doe"
                                value={formData.author_name}
                                onChange={(e) =>
                                    setFormData((d) => ({
                                        ...d,
                                        author_name: e.target.value,
                                    }))
                                }
                                className="h-10 rounded-xl"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="rev-country">Country Code</Label>
                            <Input
                                id="rev-country"
                                placeholder="e.g. ET, US, GB"
                                maxLength={3}
                                value={formData.countrycode}
                                onChange={(e) =>
                                    setFormData((d) => ({
                                        ...d,
                                        countrycode: e.target.value.toUpperCase(),
                                    }))
                                }
                                className="h-10 rounded-xl uppercase font-mono"
                            />
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        <div className="space-y-1">
                            <Label htmlFor="rev-score">Score (0 to 10) *</Label>
                            <Input
                                id="rev-score"
                                type="number"
                                min={1}
                                max={10}
                                step={0.1}
                                value={formData.score}
                                onChange={(e) =>
                                    setFormData((d) => ({
                                        ...d,
                                        score: Number(e.target.value),
                                    }))
                                }
                                className="h-10 rounded-xl"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="rev-date">Review Date</Label>
                            <Input
                                id="rev-date"
                                type="date"
                                value={formData.date}
                                onChange={(e) =>
                                    setFormData((d) => ({
                                        ...d,
                                        date: e.target.value,
                                    }))
                                }
                                className="h-10 rounded-xl"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="rev-type">Traveler Type</Label>
                            <Input
                                id="rev-type"
                                placeholder="e.g. Couple, Solo traveler"
                                value={formData.guest_type}
                                onChange={(e) =>
                                    setFormData((d) => ({
                                        ...d,
                                        guest_type: e.target.value,
                                    }))
                                }
                                className="h-10 rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="rev-title">Review Headline / Title</Label>
                        <Input
                            id="rev-title"
                            placeholder="e.g. Wonderful stay, friendly staff!"
                            value={formData.title}
                            onChange={(e) =>
                                setFormData((d) => ({
                                    ...d,
                                    title: e.target.value,
                                }))
                            }
                            className="h-10 rounded-xl"
                        />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                            <Label
                                htmlFor="rev-pros"
                                className="text-emerald-800 font-semibold"
                            >
                                Pros (What was great)
                            </Label>
                            <textarea
                                id="rev-pros"
                                rows={3}
                                placeholder="Clean rooms, delicious breakfast..."
                                value={formData.pros}
                                onChange={(e) =>
                                    setFormData((d) => ({
                                        ...d,
                                        pros: e.target.value,
                                    }))
                                }
                                className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label
                                htmlFor="rev-cons"
                                className="text-rose-800 font-semibold"
                            >
                                Cons (Areas to improve)
                            </Label>
                            <textarea
                                id="rev-cons"
                                rows={3}
                                placeholder="Airport shuttle was slightly delayed..."
                                value={formData.cons}
                                onChange={(e) =>
                                    setFormData((d) => ({
                                        ...d,
                                        cons: e.target.value,
                                    }))
                                }
                                className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                        <input
                            type="checkbox"
                            id="rev-published"
                            checked={formData.published}
                            onChange={(e) =>
                                setFormData((d) => ({
                                    ...d,
                                    published: e.target.checked,
                                }))
                            }
                            className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                        />
                        <Label
                            htmlFor="rev-published"
                            className="cursor-pointer font-medium text-slate-800 text-xs"
                        >
                            Publish immediately on public hotel listing
                        </Label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setModalOpen(false)}
                            className="rounded-xl"
                            disabled={saving}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={() => void handleSaveReviewModal()}
                            disabled={saving}
                            className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving review…
                                </>
                            ) : editingReview ? (
                                'Update review'
                            ) : (
                                'Save review'
                            )}
                        </Button>
                    </div>
                </div>
            </Modal>
        </HotelSectionShell>
    );
}
