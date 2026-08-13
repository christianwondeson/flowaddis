'use client';

import { useEffect, useState } from 'react';
import { adminInventoryFetch } from '@/lib/admin-inventory-api';
import { HotelChatPanel } from '@/components/chat/hotel-chat-panel';
import { AdminLoader } from '@/components/ui/admin-loader';
import { cn } from '@/lib/utils';

type HotelRow = { id: string; name: string };

export default function SuperAdminMessagesPage() {
    const [hotels, setHotels] = useState<HotelRow[]>([]);
    const [hotelId, setHotelId] = useState('');
    const [loading, setLoading] = useState(true);
    const [channel, setChannel] = useState<'ops' | 'support'>('ops');

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const data = await adminInventoryFetch<
                    { items?: HotelRow[] } | HotelRow[]
                >('hotels?limit=100', undefined, 'Loading hotels…');
                const items = Array.isArray(data) ? data : data.items || [];
                if (!cancelled) {
                    setHotels(items);
                    setHotelId((prev) => prev || items[0]?.id || '');
                }
            } catch {
                if (!cancelled) setHotels([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const selected = hotels.find((h) => h.id === hotelId);

    return (
        <div className="space-y-6 max-w-6xl">
            <div>
                <h1 className="text-2xl font-extrabold text-brand-dark">
                    Messages
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                    Ops chat with hotel desks, plus guest BookAddis support
                    threads for reservation help.
                </p>
            </div>

            {loading ? (
                <AdminLoader label="Loading hotels…" />
            ) : (
                <>
                    <label className="block max-w-md">
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            Property
                        </span>
                        <select
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                            value={hotelId}
                            onChange={(e) => setHotelId(e.target.value)}
                        >
                            {hotels.length === 0 ? (
                                <option value="">No hotels</option>
                            ) : (
                                hotels.map((h) => (
                                    <option key={h.id} value={h.id}>
                                        {h.name}
                                    </option>
                                ))
                            )}
                        </select>
                    </label>

                    <div className="flex gap-2 border-b border-slate-200">
                        {(
                            [
                                ['ops', 'Hotel desk (ops)'],
                                ['support', 'Guest support'],
                            ] as const
                        ).map(([id, label]) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => setChannel(id)}
                                className={cn(
                                    'px-4 py-2.5 text-sm font-bold border-b-2 -mb-px',
                                    channel === id
                                        ? 'border-brand-primary text-brand-primary'
                                        : 'border-transparent text-slate-500',
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {hotelId && selected ? (
                        <HotelChatPanel
                            key={`${hotelId}-${channel}`}
                            hotelId={hotelId}
                            hotelName={selected.name}
                            mode={channel}
                        />
                    ) : (
                        <p className="text-sm text-slate-500">
                            Select a hotel to open chat.
                        </p>
                    )}
                </>
            )}
        </div>
    );
}
