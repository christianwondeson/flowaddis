'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { HotelChatPanel } from '@/components/chat/hotel-chat-panel';
import { hotelAdminFetch } from '@/lib/hotel-admin-api';

export default function HotelMessagesPage() {
    const params = useParams();
    const hotelId = String(params.hotelId || '');
    const [hotelName, setHotelName] = useState('Property');
    const [tab, setTab] = useState<'ops' | 'guest'>('guest');

    useEffect(() => {
        if (!hotelId) return;
        let cancelled = false;
        (async () => {
            try {
                const h = await hotelAdminFetch<{ name?: string }>(
                    `hotels/${hotelId}`,
                    undefined,
                    'Loading property…',
                );
                if (!cancelled && h?.name) setHotelName(h.name);
            } catch {
                /* name optional */
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [hotelId]);

    return (
        <div className="space-y-6 max-w-6xl">
            <div>
                <h1 className="text-2xl font-extrabold text-brand-dark">Messages</h1>
                <p className="text-sm text-slate-600 mt-1">
                    Live chat with BookAddis ops, and dedicated threads for each registered guest.
                </p>
            </div>

            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => setTab('guest')}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold border ${
                        tab === 'guest'
                            ? 'bg-brand-dark text-white border-brand-dark'
                            : 'bg-white text-slate-600 border-slate-200'
                    }`}
                >
                    Guest chats
                </button>
                <button
                    type="button"
                    onClick={() => setTab('ops')}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold border ${
                        tab === 'ops'
                            ? 'bg-brand-dark text-white border-brand-dark'
                            : 'bg-white text-slate-600 border-slate-200'
                    }`}
                >
                    BookAddis ops
                </button>
            </div>

            {hotelId ? (
                <HotelChatPanel
                    hotelId={hotelId}
                    hotelName={hotelName}
                    mode={tab}
                />
            ) : null}
        </div>
    );
}
