"use client";

import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface CounterProps {
    label: string;
    subLabel?: string;
    value: number;
    min?: number;
    max?: number;
    onChange: (value: number) => void;
}

export const Counter: React.FC<CounterProps> = ({
    label,
    subLabel,
    value,
    min = 0,
    max = 99,
    onChange
}) => {
    return (
        <div className="flex justify-between items-center py-2">
            <div>
                <div className="font-medium text-gray-900 text-sm">{label}</div>
                {subLabel && <div className="text-xs text-gray-500">{subLabel}</div>}
            </div>
            <div className="flex items-center gap-3">
                <button
                    onClick={() => onChange(Math.max(min, value - 1))}
                    className="p-1.5 rounded-full border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    disabled={value <= min}
                >
                    <Minus className="w-3.5 h-3.5 text-gray-600" />
                </button>
                <span className="w-5 text-center font-semibold text-sm text-gray-900">{value}</span>
                <button
                    onClick={() => onChange(Math.min(max, value + 1))}
                    className="p-1.5 rounded-full border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    disabled={value >= max}
                >
                    <Plus className="w-3.5 h-3.5 text-gray-600" />
                </button>
            </div>
        </div>
    );
};
