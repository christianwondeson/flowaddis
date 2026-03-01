"use client";

import React from 'react';
import { Minus, Plus, Users } from 'lucide-react';
import { Popover } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface GuestSelectorProps {
    adults: number;
    children: number;
    rooms: number;
    onChange: (adults: number, children: number, rooms: number) => void;
    /** When true, renders only the counter content (no Popover/trigger) for use inside a custom popover */
    contentOnly?: boolean;
}

import { Counter } from '@/components/shared/counter';

export const GuestSelector: React.FC<GuestSelectorProps> = ({ adults, children, rooms, onChange, contentOnly }) => {
    const update = (type: 'adults' | 'children' | 'rooms', value: number) => {
        if (type === 'adults') onChange(value, children, rooms);
        if (type === 'children') onChange(adults, value, rooms);
        if (type === 'rooms') onChange(adults, children, value);
    };

    const content = (
        <div className="space-y-1 w-64 p-1">
            <Counter
                label="Adults"
                subLabel="Ages 18+"
                value={adults}
                min={1}
                onChange={(v) => update('adults', v)}
            />
            <Counter
                label="Children"
                subLabel="Ages 0-17"
                value={children}
                min={0}
                onChange={(v) => update('children', v)}
            />
            <Counter
                label="Rooms"
                value={rooms}
                min={1}
                onChange={(v) => update('rooms', v)}
            />
        </div>
    );

    if (contentOnly) return content;

    return (
        <Popover
            trigger={
                <div className="w-full">
                    <div className="flex items-center gap-3 w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-white hover:border-brand-primary/50 transition-all cursor-pointer group">
                        <Users className="w-5 h-5 text-gray-400 group-hover:text-brand-primary transition-colors" />
                        <span className="text-gray-900 font-semibold text-sm truncate">
                            {adults} Adult{adults !== 1 ? 's' : ''}, {children} Child{children !== 1 ? 'ren' : ''}, {rooms} Room{rooms !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>
            }
            content={content}
        />
    );
};
