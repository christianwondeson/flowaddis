'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { adminInventoryFetch } from '@/lib/admin-inventory-api';
import { InventoryHotelNav } from '@/components/admin/inventory-hotel-nav';

export default function InventoryHotelLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const params = useParams();
    const hotelId = String(params.hotelId || '');
    const [name, setName] = useState('');

    useEffect(() => {
        if (!hotelId) return;
        let cancelled = false;
        (async () => {
            try {
                const h = await adminInventoryFetch<{ name?: string }>(
                    `hotels/${hotelId}`,
                );
                if (!cancelled) setName(h.name || '');
            } catch {
                if (!cancelled) setName('');
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [hotelId]);

    return (
        <div className="max-w-6xl">
            <InventoryHotelNav hotelName={name} />
            {children}
        </div>
    );
}
