'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { HotelChatPanel } from '@/components/chat/hotel-chat-panel';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { AdminLoader } from '@/components/ui/admin-loader';
import { cn } from '@/lib/utils';

export default function GuestHotelMessagesPage() {
    const params = useParams();
    const hotelId = String(params.id || '');
    const { user, loading: authLoading } = useAuth();
    const [hotelName, setHotelName] = useState('Hotel');
    const [channel, setChannel] = useState<'hotel' | 'support'>('hotel');

    useEffect(() => {
        if (!hotelId) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`/api/hotels/direct/${hotelId}`, {
                    cache: 'no-store',
                });
                if (!res.ok) return;
                const data = await res.json();
                const name = data?.name || data?.item?.name || data?.hotel?.name;
                if (!cancelled && name) setHotelName(String(name));
            } catch {
                /* optional */
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [hotelId]);

    if (authLoading) {
        return <AdminLoader label="Checking sign-in…" />;
    }

    if (!user) {
        return (
            <div className="mx-auto max-w-lg px-4 py-16 text-center space-y-4">
                <h1 className="text-2xl font-extrabold text-brand-dark">
                    Reservation messaging
                </h1>
                <p className="text-sm text-slate-600">
                    Sign in to chat with the hotel desk and BookAddis support so
                    your reservation stays clean and coordinated.
                </p>
                <Button asChild>
                    <Link
                        href={`/signin?redirect=${encodeURIComponent(`/hotels/${hotelId}/messages`)}`}
                    >
                        Sign in
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
            <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Guest messaging
                </p>
                <h1 className="text-2xl font-extrabold text-brand-dark mt-1">
                    Chat about {hotelName}
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                    Talk to the hotel front desk and BookAddis Super Admin in
                    separate threads  both stay linked to this property.
                </p>
            </div>

            <div className="flex gap-2 border-b border-slate-200">
                {(
                    [
                        ['hotel', 'Hotel desk'],
                        ['support', 'BookAddis support'],
                    ] as const
                ).map(([id, label]) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => setChannel(id)}
                        className={cn(
                            'px-4 py-2.5 text-sm font-bold border-b-2 -mb-px transition-colors',
                            channel === id
                                ? 'border-brand-primary text-brand-primary'
                                : 'border-transparent text-slate-500 hover:text-brand-dark',
                        )}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <HotelChatPanel
                key={channel}
                hotelId={hotelId}
                hotelName={hotelName}
                mode={channel === 'hotel' ? 'guest' : 'support'}
                guestSelf
            />
        </div>
    );
}
