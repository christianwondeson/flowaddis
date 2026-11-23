'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { hotelAdminFetch } from '@/lib/hotel-admin-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { AdminLoader } from '@/components/ui/admin-loader';
import { toast } from 'sonner';
import {
    Calendar as CalendarIcon,
    Percent,
    Tag,
    X,
    BedDouble,
    Building2,
    Plane,
    Users,
    CheckCircle2,
    PlusCircle,
    Calculator,
    Sparkles,
    Sliders,
    Layers,
    ArrowRight,
    AlertTriangle,
    Check,
    Copy,
    Share2,
} from 'lucide-react';
import {
    normalizePromotions,
    PROMOTION_TYPE_LABELS,
    evaluatePromotion,
    generatePromoCode,
    type HotelPromotion,
    type HotelPromotionType,
} from '@/lib/hotel-promotions';
import { formatAdminDate } from '@/lib/admin-date-format';
import { formatDateLocal, parseDateLocal } from '@/lib/date-utils';
import { cn } from '@/lib/utils';

function AdminDateField({
    label,
    value,
    onChange,
    minDate,
}: {
    label: string;
    value: string | null | undefined;
    onChange: (iso: string | null) => void;
    minDate?: Date;
}) {
    return (
        <div className="space-y-1.5">
            <Label>{label}</Label>
            <div className="flex gap-2">
                <Popover
                    trigger={
                        <button
                            type="button"
                            className="flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-left hover:border-brand-primary/40"
                        >
                            <CalendarIcon className="w-4 h-4 text-slate-400 shrink-0" />
                            <span
                                className={
                                    value
                                        ? 'text-brand-dark font-medium'
                                        : 'text-slate-400'
                                }
                            >
                                {value ? formatAdminDate(value) : 'Select date'}
                            </span>
                        </button>
                    }
                    content={
                        <div className="p-2">
                            <Calendar
                                selected={
                                    value ? parseDateLocal(value) : undefined
                                }
                                minDate={minDate}
                                onSelect={(d) => onChange(formatDateLocal(d))}
                            />
                        </div>
                    }
                />
                {value ? (
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        aria-label="Clear date"
                        onClick={() => onChange(null)}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                ) : null}
            </div>
        </div>
    );
}

type RoomOption = {
    id: string;
    name: string;
    base_price?: number;
};

const empty = (): Omit<HotelPromotion, 'id'> => ({
    type: 'early_bird',
    name: '',
    discount_percent: 10,
    active: true,
    code: '',
    book_window_days: 14,
    min_nights: 3,
    valid_from: null,
    valid_to: null,
    description: '',
    applicable_room_ids: ['all'],
    applicable_room_names: ['All room types'],
    facility_scope: ['hotel_room'],
});

const TEMPLATES: Array<{
    id: string;
    title: string;
    tagline: string;
    discount: number;
    type: HotelPromotionType;
    book_window_days?: number;
    min_nights?: number;
    code?: string;
    facility_scope: Array<'hotel_room' | 'airport_shuttle' | 'conference'>;
}> = [
    {
        id: 'early_bird',
        title: 'Early Booker Deal',
        tagline: 'Attract advance planners by offering a discount for early reservations (14+ days before arrival).',
        discount: 15,
        type: 'early_bird',
        book_window_days: 14,
        min_nights: 1,
        facility_scope: ['hotel_room'],
    },
    {
        id: 'last_minute',
        title: 'Last-minute Deal',
        tagline: 'Sell unbooked rooms fast for guests booking within 3 days of check-in.',
        discount: 10,
        type: 'last_minute',
        book_window_days: 3,
        min_nights: 1,
        facility_scope: ['hotel_room'],
    },
    {
        id: 'long_stay',
        title: 'Long Stay Deal',
        tagline: 'Increase average stay duration by rewarding guests staying 3 or more consecutive nights.',
        discount: 20,
        type: 'long_stay',
        min_nights: 3,
        facility_scope: ['hotel_room'],
    },
    {
        id: 'secret_deal',
        title: 'Secret Deal / Promo Code',
        tagline: 'Target select audiences, corporate partners, or loyalty members with an exclusive discount code.',
        discount: 12,
        type: 'promo_code',
        code: 'WELCOME12',
        facility_scope: ['hotel_room'],
    },
    {
        id: 'shuttle_bundle',
        title: 'Airport Transfer Bundle',
        tagline: 'Offer guests a promotional discount on pre-booked airport shuttle rides.',
        discount: 25,
        type: 'early_bird',
        book_window_days: 2,
        min_nights: 1,
        facility_scope: ['airport_shuttle'],
    },
];

export default function HotelPromotionsPage() {
    const params = useParams();
    const hotelId = String(params.hotelId || '');
    const [activeTab, setActiveTab] = useState<'active' | 'choose' | 'simulate'>('active');

    const [items, setItems] = useState<HotelPromotion[]>([]);
    const [rooms, setRooms] = useState<RoomOption[]>([]);
    const [mediaRest, setMediaRest] = useState<Record<string, unknown>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(empty);
    const [roomScopeMode, setRoomScopeMode] = useState<'all' | 'specific'>('all');

    // Simulator State
    const tomorrow = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().slice(0, 10);
    }, []);
    const dayAfter = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 4);
        return d.toISOString().slice(0, 10);
    }, []);

    const [simRoomId, setSimRoomId] = useState<string>('all');
    const [simFacility, setSimFacility] = useState<'hotel_room' | 'airport_shuttle' | 'conference'>('hotel_room');
    const [simCheckIn, setSimCheckIn] = useState<string>(tomorrow);
    const [simCheckOut, setSimCheckOut] = useState<string>(dayAfter);
    const [simCode, setSimCode] = useState<string>('');
    const [simBasePrice, setSimBasePrice] = useState<number>(100);

    const load = async () => {
        setLoading(true);
        try {
            const [hotel, roomList] = await Promise.all([
                hotelAdminFetch<{
                    media?: (Record<string, unknown> & { promotions?: unknown }) | null;
                }>(`hotels/${hotelId}`),
                hotelAdminFetch<RoomOption[]>(`hotels/${hotelId}/room-types`).catch(() => []),
            ]);

            const media = (hotel.media || {}) as Record<string, unknown> & {
                promotions?: unknown;
            };
            const { promotions, ...rest } = media;
            setMediaRest(rest);
            setItems(normalizePromotions(promotions));
            setRooms(Array.isArray(roomList) ? roomList : []);
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (hotelId) void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hotelId]);

    const persist = async (next: HotelPromotion[]) => {
        setSaving(true);
        try {
            await hotelAdminFetch(`hotels/${hotelId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    media: { ...mediaRest, promotions: next },
                }),
            });
            setItems(next);
            toast.success('Promotions updated successfully');
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            setSaving(false);
        }
    };

    const toggleRoom = (roomId: string, roomName: string) => {
        const current = form.applicable_room_ids || [];
        const isSelected = current.includes(roomId);
        let nextIds: string[];
        let nextNames: string[];

        if (isSelected) {
            nextIds = current.filter((id) => id !== roomId && id !== 'all');
            nextNames = (form.applicable_room_names || []).filter((n) => n !== roomName);
            if (nextIds.length === 0) {
                nextIds = ['all'];
                nextNames = ['All room types'];
            }
        } else {
            nextIds = [...current.filter((id) => id !== 'all'), roomId];
            nextNames = [...(form.applicable_room_names || []).filter((n) => n !== 'All room types'), roomName];
        }

        setForm((f) => ({
            ...f,
            applicable_room_ids: nextIds,
            applicable_room_names: nextNames,
        }));
    };

    const toggleFacility = (facility: 'hotel_room' | 'airport_shuttle' | 'conference') => {
        const current = form.facility_scope || ['hotel_room'];
        const isSelected = current.includes(facility);
        let next: Array<'hotel_room' | 'airport_shuttle' | 'conference'>;
        if (isSelected) {
            next = current.filter((f) => f !== facility);
            if (next.length === 0) next = ['hotel_room'];
        } else {
            next = [...current, facility];
        }
        setForm((f) => ({ ...f, facility_scope: next }));
    };

    const applyTemplate = (tpl: (typeof TEMPLATES)[0]) => {
        setForm({
            ...empty(),
            name: tpl.title,
            discount_percent: tpl.discount,
            type: tpl.type,
            book_window_days: tpl.book_window_days ?? 14,
            min_nights: tpl.min_nights ?? 1,
            code: tpl.code || '',
            facility_scope: tpl.facility_scope,
            applicable_room_ids: ['all'],
            applicable_room_names: ['All room types'],
        });
        setRoomScopeMode('all');
        setActiveTab('choose');
        toast.info(`Configuring "${tpl.title}" template`);
    };

    const add = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) {
            toast.error('Promotion name is required');
            return;
        }
        if (form.type === 'promo_code' && !form.code?.trim()) {
            toast.error('Promo code is required');
            return;
        }

        const resolvedRoomIds =
            roomScopeMode === 'all'
                ? ['all']
                : form.applicable_room_ids && form.applicable_room_ids.length > 0
                  ? form.applicable_room_ids
                  : ['all'];

        const resolvedRoomNames =
            roomScopeMode === 'all'
                ? ['All room types']
                : rooms
                      .filter((r) => resolvedRoomIds.includes(r.id))
                      .map((r) => r.name);

        const row: HotelPromotion = {
            id: crypto.randomUUID(),
            ...form,
            name: form.name.trim(),
            applicable_room_ids: resolvedRoomIds,
            applicable_room_names: resolvedRoomNames.length > 0 ? resolvedRoomNames : ['All room types'],
            code:
                form.type === 'promo_code'
                    ? form.code?.trim().toUpperCase()
                    : undefined,
        };
        void persist([...items, row]).then(() => {
            setForm(empty());
            setRoomScopeMode('all');
            setActiveTab('active');
        });
    };

    // Simulated evaluation
    const simulationResult = useMemo(() => {
        return evaluatePromotion({
            promotions: items,
            checkIn: simCheckIn,
            checkOut: simCheckOut,
            promoCode: simCode || undefined,
            roomTypeId: simRoomId === 'all' ? undefined : simRoomId,
            facility: simFacility,
        });
    }, [items, simCheckIn, simCheckOut, simCode, simRoomId, simFacility]);

    const simulatedSavings = (simBasePrice * simulationResult.percent) / 100;
    const simulatedFinalPrice = simBasePrice - simulatedSavings;

    if (loading) return <AdminLoader label="Loading promotions…" />;

    return (
        <div className="space-y-6 max-w-5xl">
            {/* Header with Title and Booking.com Aligned Nav Tabs */}
            <div className="border-b border-slate-200 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-extrabold text-brand-dark tracking-tight">
                            Promotions &amp; Discounts
                        </h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Booking.com standard promotional architecture. Target specific rooms, facilities, and advance booking windows.
                        </p>
                    </div>
                    <Button
                        type="button"
                        onClick={() => {
                            setForm(empty());
                            setActiveTab('choose');
                        }}
                        className="bg-brand-primary text-white hover:bg-teal-700 font-bold shrink-0 inline-flex items-center gap-1.5"
                    >
                        <PlusCircle className="w-4 h-4" />
                        <span>Create Promotion</span>
                    </Button>
                </div>

                {/* Sub-nav matching Booking.com Image 4 */}
                <div className="flex items-center gap-2 mt-5 overflow-x-auto no-scrollbar">
                    <button
                        type="button"
                        onClick={() => setActiveTab('active')}
                        className={cn(
                            'px-4 py-2 rounded-lg text-sm font-bold transition-all border',
                            activeTab === 'active'
                                ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                        )}
                    >
                        Your active promotions ({items.filter((p) => p.active).length}/{items.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('choose')}
                        className={cn(
                            'px-4 py-2 rounded-lg text-sm font-bold transition-all border inline-flex items-center gap-1.5',
                            activeTab === 'choose'
                                ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                        )}
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Choose new promotion</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('simulate')}
                        className={cn(
                            'px-4 py-2 rounded-lg text-sm font-bold transition-all border inline-flex items-center gap-1.5',
                            activeTab === 'simulate'
                                ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                        )}
                    >
                        <Calculator className="w-3.5 h-3.5" />
                        <span>Simulate max discount</span>
                    </button>
                </div>
            </div>

            {/* TAB 1: ACTIVE PROMOTIONS LIST */}
            {activeTab === 'active' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-extrabold text-brand-dark">
                            Active Promotions ({items.length})
                        </h2>
                        <span className="text-xs text-slate-500">
                            Clear target mapping for rooms, facilities, and booking conditions
                        </span>
                    </div>

                    {items.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center bg-white space-y-3">
                            <Percent className="w-10 h-10 text-slate-300 mx-auto" />
                            <h3 className="text-base font-bold text-slate-800">No active promotions</h3>
                            <p className="text-xs text-slate-500 max-w-md mx-auto">
                                You haven&apos;t added any promotion campaigns yet. Choose a template or create a custom promotion to drive direct reservations.
                            </p>
                            <Button
                                type="button"
                                onClick={() => setActiveTab('choose')}
                                className="bg-brand-primary text-white hover:bg-teal-700 font-bold text-xs"
                            >
                                Browse Promotional Templates
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-3.5">
                            {items.map((p) => {
                                const isAllRooms =
                                    !p.applicable_room_ids ||
                                    p.applicable_room_ids.length === 0 ||
                                    p.applicable_room_ids.includes('all');

                                return (
                                    <div
                                        key={p.id}
                                        className={cn(
                                            'rounded-xl border bg-white p-5 shadow-xs transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4',
                                            p.active ? 'border-slate-200' : 'border-slate-200 bg-slate-50/60 opacity-80',
                                        )}
                                    >
                                        <div className="flex items-start gap-4 min-w-0 flex-1">
                                            <div
                                                className={cn(
                                                    'h-12 w-12 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
                                                    p.type === 'promo_code'
                                                        ? 'bg-amber-100 text-amber-800'
                                                        : 'bg-emerald-100 text-emerald-800',
                                                )}
                                            >
                                                {p.type === 'promo_code' ? (
                                                    <Tag className="w-6 h-6" />
                                                ) : (
                                                    <Percent className="w-6 h-6" />
                                                )}
                                            </div>

                                            <div className="min-w-0 space-y-2 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="font-extrabold text-brand-dark text-base">
                                                        {p.name}
                                                    </h3>
                                                    <span className="rounded-md bg-emerald-100 px-2.5 py-0.5 text-xs font-black text-emerald-900 border border-emerald-300">
                                                        {p.discount_percent}% OFF
                                                    </span>
                                                    {p.code && (
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-mono font-bold text-amber-900 border border-amber-300">
                                                                CODE: {p.code}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (p.code) {
                                                                        void navigator.clipboard.writeText(p.code);
                                                                        toast.success(`Copied promo code: ${p.code}`);
                                                                    }
                                                                }}
                                                                className="p-1 rounded-md hover:bg-amber-100 text-amber-800 transition-colors"
                                                                title="Copy Promo Code"
                                                            >
                                                                <Copy className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (p.code && typeof window !== 'undefined') {
                                                                        const link = `${window.location.origin}/hotels/${hotelId}?promo=${encodeURIComponent(p.code)}`;
                                                                        void navigator.clipboard.writeText(link);
                                                                        toast.success(`Copied booking link with promo code: ${p.code}`);
                                                                    }
                                                                }}
                                                                className="p-1 rounded-md hover:bg-blue-100 text-blue-700 transition-colors"
                                                                title="Copy Guest Booking Link with Promo Code"
                                                            >
                                                                <Share2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    )}
                                                    <span
                                                        className={cn(
                                                            'rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider',
                                                            p.active
                                                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                                                : 'bg-slate-100 text-slate-600 border border-slate-200',
                                                        )}
                                                    >
                                                        {p.active ? 'Live on BookAddis' : 'Paused'}
                                                    </span>
                                                </div>

                                                <p className="text-xs text-slate-600 font-medium">
                                                    {PROMOTION_TYPE_LABELS[p.type]}
                                                    {p.book_window_days ? ` · Book at least ${p.book_window_days} days ahead` : ''}
                                                    {p.min_nights ? ` · Minimum stay: ${p.min_nights} nights` : ''}
                                                </p>

                                                {/* HIGH CLARITY TARGET SECTION: ROOMS & FACILITIES */}
                                                <div className="rounded-lg bg-slate-50 border border-slate-200/90 p-2.5 space-y-1.5">
                                                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                                        <span className="font-bold text-slate-700 inline-flex items-center gap-1 shrink-0">
                                                            <BedDouble className="w-3.5 h-3.5 text-brand-primary" />
                                                            Target Rooms:
                                                        </span>
                                                        {isAllRooms ? (
                                                            <span className="rounded bg-teal-50 px-2 py-0.5 font-bold text-teal-800 border border-teal-200">
                                                                Entire Hotel (All {rooms.length > 0 ? rooms.length : ''} Room Types)
                                                            </span>
                                                        ) : (
                                                            (p.applicable_room_names || p.applicable_room_ids || []).map((name) => (
                                                                <span
                                                                    key={name}
                                                                    className="rounded bg-white px-2 py-0.5 font-bold text-slate-800 border border-slate-300 shadow-2xs"
                                                                >
                                                                    {name}
                                                                </span>
                                                            ))
                                                        )}
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                                        <span className="font-bold text-slate-700 inline-flex items-center gap-1 shrink-0">
                                                            <Building2 className="w-3.5 h-3.5 text-brand-primary" />
                                                            Target Facilities:
                                                        </span>
                                                        {(p.facility_scope && p.facility_scope.length > 0
                                                            ? p.facility_scope
                                                            : (['hotel_room'] as const)
                                                        ).map((f) => {
                                                            const label =
                                                                f === 'hotel_room'
                                                                    ? 'Hotel Rooms'
                                                                    : f === 'airport_shuttle'
                                                                      ? 'Airport Shuttle'
                                                                      : 'Conference & Meetings';
                                                            return (
                                                                <span
                                                                    key={f}
                                                                    className="rounded bg-sky-50 px-2 py-0.5 font-semibold text-sky-800 border border-sky-200"
                                                                >
                                                                    {label}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>

                                                    {(p.valid_from || p.valid_to) && (
                                                        <p className="text-[11px] text-slate-500 pt-0.5">
                                                            Calendar Window: {p.valid_from ? formatAdminDate(p.valid_from) : 'Any arrival'}{' '}
                                                            → {p.valid_to ? formatAdminDate(p.valid_to) : 'Open-ended'}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                                            <button
                                                type="button"
                                                className={cn(
                                                    'px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors border',
                                                    p.active
                                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200',
                                                )}
                                                onClick={() =>
                                                    void persist(
                                                        items.map((x) =>
                                                            x.id === p.id
                                                                ? { ...x, active: !x.active }
                                                                : x,
                                                        ),
                                                    )
                                                }
                                            >
                                                {p.active ? 'Pause Deal' : 'Activate Deal'}
                                            </button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="text-rose-600 hover:bg-rose-50 text-xs font-bold"
                                                onClick={() => {
                                                    if (confirm(`Remove promotion "${p.name}"?`)) {
                                                        void persist(items.filter((x) => x.id !== p.id));
                                                    }
                                                }}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: CHOOSE NEW PROMOTION (TEMPLATES & CUSTOM FORM) */}
            {activeTab === 'choose' && (
                <div className="space-y-6">
                    {/* Template Selection Grid */}
                    <div>
                        <h2 className="text-lg font-extrabold text-brand-dark mb-1">
                            Choose a Promotion Template
                        </h2>
                        <p className="text-xs text-slate-500 mb-3.5">
                            Pre-configured based on Booking.com best-performing deals in East Africa. Click to customize.
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {TEMPLATES.map((tpl) => (
                                <button
                                    key={tpl.id}
                                    type="button"
                                    onClick={() => applyTemplate(tpl)}
                                    className="rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-brand-primary/60 hover:shadow-sm transition-all group relative flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-2 mb-1.5">
                                            <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-brand-primary transition-colors">
                                                {tpl.title}
                                            </h3>
                                            <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-black text-emerald-800">
                                                {tpl.discount}% OFF
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            {tpl.tagline}
                                        </p>
                                    </div>
                                    <div className="pt-3 flex items-center gap-1 text-xs font-bold text-brand-primary">
                                        <span>Use template</span>
                                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Customized Creation Form */}
                    <form
                        onSubmit={add}
                        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-5"
                    >
                        <div className="border-b border-slate-100 pb-3">
                            <h3 className="font-extrabold text-brand-dark text-base">
                                Customize Promotion Details
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Set rules, target rooms, facilities, and booking lead time.
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5 sm:col-span-2">
                                <Label className="font-bold">Promotion / Campaign Name *</Label>
                                <Input
                                    value={form.name}
                                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                    placeholder="e.g. Early Bird Summer Deal — 15% off"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="font-bold">Promotion Type</Label>
                                <select
                                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                    value={form.type}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            type: e.target.value as HotelPromotionType,
                                        }))
                                    }
                                >
                                    {(Object.keys(PROMOTION_TYPE_LABELS) as HotelPromotionType[]).map(
                                        (k) => (
                                            <option key={k} value={k}>
                                                {PROMOTION_TYPE_LABELS[k]}
                                            </option>
                                        ),
                                    )}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="font-bold">Discount Percentage (%) *</Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        min={1}
                                        max={90}
                                        value={form.discount_percent}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                discount_percent: Number(e.target.value) || 1,
                                            }))
                                        }
                                        required
                                    />
                                    <Percent className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                                </div>
                            </div>

                            {form.type === 'promo_code' && (
                                <div className="space-y-2.5 sm:col-span-2 bg-amber-50/50 border border-amber-200/80 p-4 rounded-xl">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <Label className="font-bold text-slate-800 flex items-center gap-1.5">
                                            <Tag className="w-4 h-4 text-amber-600" />
                                            Promo Code (Uppercase Voucher) *
                                        </Label>
                                        <div className="flex items-center gap-1.5">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    const newCode = generatePromoCode({
                                                        prefix: 'HOTEL',
                                                        discount: form.discount_percent || 15,
                                                        style: 'standard',
                                                    });
                                                    setForm((f) => ({ ...f, code: newCode }));
                                                    toast.success(`Generated promo code: ${newCode}`);
                                                }}
                                                className="h-7 text-xs gap-1 border-amber-300 bg-white hover:bg-amber-100/60 font-semibold text-amber-900"
                                            >
                                                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                                Auto-Generate
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    const newCode = generatePromoCode({
                                                        prefix: 'PROMO',
                                                        discount: form.discount_percent || 15,
                                                        style: 'voucher',
                                                    });
                                                    setForm((f) => ({ ...f, code: newCode }));
                                                    toast.success(`Generated voucher code: ${newCode}`);
                                                }}
                                                className="h-7 text-xs gap-1 border-amber-300 bg-white hover:bg-amber-100/60 font-semibold text-amber-900"
                                            >
                                                Voucher Style
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <Input
                                            value={form.code || ''}
                                            onChange={(e) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    code: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''),
                                                }))
                                            }
                                            placeholder="e.g. WELCOME15 or HOTEL-8X2F"
                                            className="font-mono uppercase font-bold tracking-wider text-base h-11 bg-white border-amber-300"
                                            required
                                        />
                                    </div>

                                    {/* Quick preset chips */}
                                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                        <span className="text-[11px] font-semibold text-slate-500 mr-1">Quick presets:</span>
                                        {['WELCOME10', 'STAY15', 'VIP20', 'WEEKEND25', 'HOLIDAY12'].map((preset) => (
                                            <button
                                                key={preset}
                                                type="button"
                                                onClick={() => {
                                                    setForm((f) => ({
                                                        ...f,
                                                        code: preset,
                                                        discount_percent: parseInt(preset.replace(/\D/g, ''), 10) || f.discount_percent,
                                                    }));
                                                }}
                                                className="text-xs px-2 py-0.5 rounded border border-amber-200 bg-white hover:bg-amber-100 text-amber-900 font-mono font-medium transition-colors"
                                            >
                                                {preset}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Duplicate detection warning */}
                                    {form.code && items.some((i) => i.code?.toUpperCase() === form.code?.trim().toUpperCase()) && (
                                        <div className="flex items-center gap-1.5 text-xs text-amber-700 font-semibold mt-1">
                                            <AlertTriangle className="w-3.5 h-3.5" />
                                            This code is already assigned to an existing active promotion for this hotel.
                                        </div>
                                    )}
                                </div>
                            )}

                            {(form.type === 'early_bird' || form.type === 'last_minute') && (
                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label className="font-bold">
                                        {form.type === 'early_bird'
                                            ? 'Book at least N days before check-in'
                                            : 'Book within N days of check-in'}
                                    </Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={form.book_window_days ?? 14}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                book_window_days: Number(e.target.value) || 1,
                                            }))
                                        }
                                    />
                                </div>
                            )}

                            {form.type === 'long_stay' && (
                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label className="font-bold">Minimum nights required</Label>
                                    <Input
                                        type="number"
                                        min={2}
                                        value={form.min_nights ?? 3}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                min_nights: Number(e.target.value) || 2,
                                            }))
                                        }
                                    />
                                </div>
                            )}

                            <AdminDateField
                                label="Valid from (optional)"
                                value={form.valid_from}
                                onChange={(iso) =>
                                    setForm((f) => ({
                                        ...f,
                                        valid_from: iso,
                                        valid_to:
                                            iso && f.valid_to && f.valid_to < iso
                                                ? null
                                                : f.valid_to,
                                    }))
                                }
                            />
                            <AdminDateField
                                label="Valid to (optional)"
                                value={form.valid_to}
                                minDate={
                                    form.valid_from
                                        ? parseDateLocal(form.valid_from)
                                        : undefined
                                }
                                onChange={(iso) =>
                                    setForm((f) => ({
                                        ...f,
                                        valid_to: iso,
                                    }))
                                }
                            />
                        </div>

                        {/* TARGET ROOMS SECTION */}
                        <div className="rounded-xl bg-slate-50 border border-slate-200/90 p-4 space-y-3">
                            <div>
                                <Label className="font-bold text-slate-900 flex items-center gap-1.5">
                                    <BedDouble className="w-4 h-4 text-brand-primary" />
                                    <span>Target Room Types (Applicable Inventory)</span>
                                </Label>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Choose whether this promotion applies across all rooms or only select inventory types.
                                </p>
                            </div>

                            <div className="flex items-center gap-4 text-xs font-semibold text-slate-800">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="roomScope"
                                        value="all"
                                        checked={roomScopeMode === 'all'}
                                        onChange={() => {
                                            setRoomScopeMode('all');
                                            setForm((f) => ({
                                                ...f,
                                                applicable_room_ids: ['all'],
                                                applicable_room_names: ['All room types'],
                                            }));
                                        }}
                                        className="h-4 w-4 accent-brand-primary"
                                    />
                                    <span>All room types (Property-wide)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="roomScope"
                                        value="specific"
                                        checked={roomScopeMode === 'specific'}
                                        onChange={() => setRoomScopeMode('specific')}
                                        className="h-4 w-4 accent-brand-primary"
                                    />
                                    <span>Specific room types only</span>
                                </label>
                            </div>

                            {roomScopeMode === 'specific' && (
                                <div className="pt-2 border-t border-slate-200/60">
                                    {rooms.length === 0 ? (
                                        <p className="text-xs text-slate-500 italic">
                                            No room types configured. Add room types in Inventory &gt; Rooms.
                                        </p>
                                    ) : (
                                        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                                            {rooms.map((room) => {
                                                const isSelected =
                                                    Boolean(form.applicable_room_ids?.includes(room.id)) &&
                                                    !form.applicable_room_ids?.includes('all');
                                                return (
                                                    <label
                                                        key={room.id}
                                                        className={cn(
                                                            'flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-all',
                                                            isSelected
                                                                ? 'border-brand-primary bg-brand-primary/5 font-semibold text-brand-dark'
                                                                : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700',
                                                        )}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => toggleRoom(room.id, room.name)}
                                                            className="h-4 w-4 rounded accent-brand-primary"
                                                        />
                                                        <span className="truncate">{room.name}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* TARGET FACILITIES SECTION */}
                        <div className="rounded-xl bg-slate-50 border border-slate-200/90 p-4 space-y-2.5">
                            <Label className="font-bold text-slate-900 flex items-center gap-1.5">
                                <Building2 className="w-4 h-4 text-brand-primary" />
                                <span>Facility &amp; Services Scope</span>
                            </Label>
                            <p className="text-xs text-slate-500">
                                Select which hotel products and add-ons this promotion discount can be redeemed for.
                            </p>
                            <div className="flex flex-wrap gap-3 text-xs font-semibold text-slate-800 pt-1">
                                <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-2xs hover:border-brand-primary/50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={form.facility_scope?.includes('hotel_room') ?? true}
                                        onChange={() => toggleFacility('hotel_room')}
                                        className="h-4 w-4 rounded accent-brand-primary"
                                    />
                                    <BedDouble className="w-3.5 h-3.5 text-slate-600" />
                                    <span>Hotel Stays / Rooms</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-2xs hover:border-brand-primary/50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={form.facility_scope?.includes('airport_shuttle') ?? false}
                                        onChange={() => toggleFacility('airport_shuttle')}
                                        className="h-4 w-4 rounded accent-brand-primary"
                                    />
                                    <Plane className="w-3.5 h-3.5 text-slate-600" />
                                    <span>Airport Shuttle Transfer</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-2xs hover:border-brand-primary/50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={form.facility_scope?.includes('conference') ?? false}
                                        onChange={() => toggleFacility('conference')}
                                        className="h-4 w-4 rounded accent-brand-primary"
                                    />
                                    <Users className="w-3.5 h-3.5 text-slate-600" />
                                    <span>Conference &amp; Meeting Spaces</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <Button
                                type="submit"
                                disabled={saving}
                                className="bg-brand-primary text-white hover:bg-teal-700 font-bold px-6"
                            >
                                {saving ? 'Saving…' : 'Save & Publish Promotion'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setActiveTab('active')}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* TAB 3: SIMULATE MAX DISCOUNT (Booking.com Image 4 feature) */}
            {activeTab === 'simulate' && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <Calculator className="w-5 h-5 text-brand-primary" />
                            <h2 className="text-lg font-extrabold text-brand-dark">
                                Simulate Max Discount &amp; Pricing
                            </h2>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Test how your active promotions apply to guest searches. Verify stacking rules, room restrictions, and ensure net room rates protect your profitability.
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                        <div className="space-y-1.5">
                            <Label className="font-bold text-xs">Test Room Type</Label>
                            <select
                                className="w-full h-10 rounded-md border border-input bg-background px-3 text-xs font-medium"
                                value={simRoomId}
                                onChange={(e) => setSimRoomId(e.target.value)}
                            >
                                <option value="all">Any / General Room</option>
                                {rooms.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {r.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="font-bold text-xs">Test Product / Facility</Label>
                            <select
                                className="w-full h-10 rounded-md border border-input bg-background px-3 text-xs font-medium"
                                value={simFacility}
                                onChange={(e) => setSimFacility(e.target.value as any)}
                            >
                                <option value="hotel_room">Hotel Stay / Room</option>
                                <option value="airport_shuttle">Airport Shuttle</option>
                                <option value="conference">Conference / Hall</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="font-bold text-xs">Simulated Base Price ($)</Label>
                            <Input
                                type="number"
                                min={1}
                                value={simBasePrice}
                                onChange={(e) => setSimBasePrice(Number(e.target.value) || 1)}
                                className="text-xs font-medium"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="font-bold text-xs">Check-in Date</Label>
                            <Input
                                type="date"
                                value={simCheckIn}
                                onChange={(e) => setSimCheckIn(e.target.value)}
                                className="text-xs"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="font-bold text-xs">Check-out Date</Label>
                            <Input
                                type="date"
                                value={simCheckOut}
                                onChange={(e) => setSimCheckOut(e.target.value)}
                                className="text-xs"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="font-bold text-xs">Guest Promo Code (Optional)</Label>
                            <Input
                                type="text"
                                placeholder="e.g. WELCOME12"
                                value={simCode}
                                onChange={(e) => setSimCode(e.target.value)}
                                className="text-xs uppercase font-mono"
                            />
                        </div>
                    </div>

                    {/* Simulation Calculation Result Box */}
                    <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-teal-200/70 pb-3">
                            <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
                                    Simulation Outcome
                                </span>
                                <h3 className="text-base font-extrabold text-brand-dark mt-0.5">
                                    {simulationResult.applied
                                        ? `Promotion Applied: "${simulationResult.applied.name}"`
                                        : 'No Active Promotion Qualified'}
                                </h3>
                            </div>
                            <span className="text-xl font-black text-brand-dark">
                                {simulationResult.percent}% DISCOUNT
                            </span>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3 text-center">
                            <div className="rounded-lg bg-white p-3 border border-slate-200 shadow-2xs">
                                <span className="text-xs text-slate-500 font-semibold block">Base Rate</span>
                                <span className="text-lg font-bold text-slate-800">
                                    ${simBasePrice.toFixed(2)}
                                </span>
                            </div>
                            <div className="rounded-lg bg-white p-3 border border-slate-200 shadow-2xs">
                                <span className="text-xs text-slate-500 font-semibold block">Guest Savings</span>
                                <span className="text-lg font-bold text-emerald-600">
                                    -${simulatedSavings.toFixed(2)} ({simulationResult.percent}%)
                                </span>
                            </div>
                            <div className="rounded-lg bg-emerald-50 p-3 border border-emerald-300 shadow-2xs">
                                <span className="text-xs text-emerald-800 font-semibold block">Final Guest Price</span>
                                <span className="text-xl font-black text-emerald-900">
                                    ${simulatedFinalPrice.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {simulationResult.applied ? (
                            <div className="rounded-lg bg-white p-3.5 border border-slate-200 text-xs space-y-1">
                                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                                    <Check className="w-4 h-4 text-emerald-600" />
                                    <span>Why this promotion applied:</span>
                                </p>
                                <p className="text-slate-600 pl-5">
                                    Matches facility scope ({simFacility}), room eligibility ({simRoomId === 'all' ? 'All Rooms' : rooms.find((r) => r.id === simRoomId)?.name || simRoomId}), and stay conditions.
                                </p>
                            </div>
                        ) : (
                            <div className="rounded-lg bg-amber-50 p-3.5 border border-amber-200 text-xs text-amber-800 space-y-1">
                                <p className="font-bold flex items-center gap-1.5">
                                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                                    <span>No promotion triggered for this test:</span>
                                </p>
                                <p className="pl-5 text-amber-700">
                                    {simulationResult.reason ||
                                        'None of your active campaigns matched the selected room type, advance booking window, minimum nights, or promo code.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
