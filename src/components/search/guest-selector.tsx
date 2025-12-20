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
}

export const GuestSelector: React.FC<GuestSelectorProps> = ({ adults, children, rooms, onChange }) => {
    const update = (type: 'adults' | 'children' | 'rooms', delta: number) => {
        if (type === 'adults') onChange(Math.max(1, adults + delta), children, rooms);
        if (type === 'children') onChange(adults, Math.max(0, children + delta), rooms);
        if (type === 'rooms') onChange(adults, children, Math.max(1, rooms + delta));
    };

    const content = (
        <div className="space-y-4 w-64">
            <div className="flex justify-between items-center">
                <div>
                    <div className="font-medium text-gray-900">Adults</div>
                    <div className="text-xs text-gray-500">Ages 18+</div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => update('adults', -1)} className="p-1 rounded-full border border-gray-200 hover:bg-gray-50 disabled:opacity-50" disabled={adults <= 1}>
                        <Minus className="w-4 h-4 text-gray-600" />
                    </button>
                    <span className="w-4 text-center font-medium">{adults}</span>
                    <button onClick={() => update('adults', 1)} className="p-1 rounded-full border border-gray-200 hover:bg-gray-50">
                        <Plus className="w-4 h-4 text-gray-600" />
                    </button>
                </div>
            </div>
            <div className="flex justify-between items-center">
                <div>
                    <div className="font-medium text-gray-900">Children</div>
                    <div className="text-xs text-gray-500">Ages 0-17</div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => update('children', -1)} className="p-1 rounded-full border border-gray-200 hover:bg-gray-50 disabled:opacity-50" disabled={children <= 0}>
                        <Minus className="w-4 h-4 text-gray-600" />
                    </button>
                    <span className="w-4 text-center font-medium">{children}</span>
                    <button onClick={() => update('children', 1)} className="p-1 rounded-full border border-gray-200 hover:bg-gray-50">
                        <Plus className="w-4 h-4 text-gray-600" />
                    </button>
                </div>
            </div>
            <div className="flex justify-between items-center">
                <div>
                    <div className="font-medium text-gray-900">Rooms</div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => update('rooms', -1)} className="p-1 rounded-full border border-gray-200 hover:bg-gray-50 disabled:opacity-50" disabled={rooms <= 1}>
                        <Minus className="w-4 h-4 text-gray-600" />
                    </button>
                    <span className="w-4 text-center font-medium">{rooms}</span>
                    <button onClick={() => update('rooms', 1)} className="p-1 rounded-full border border-gray-200 hover:bg-gray-50">
                        <Plus className="w-4 h-4 text-gray-600" />
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <Popover
            trigger={
                <div className="w-full">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                        Guests
                    </label>
                    <div className="flex items-center gap-3 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-white hover:border-brand-primary/50 transition-all cursor-pointer group">
                        <Users className="w-5 h-5 text-gray-400 group-hover:text-brand-primary transition-colors" />
                        <span className="text-gray-900 font-medium truncate">
                            {adults} Adults, {children} Children, {rooms} Room
                        </span>
                    </div>
                </div>
            }
            content={content}
        />
    );
};
