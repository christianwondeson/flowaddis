"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ShuttleFormProps {
    onCancel: () => void;
    onSubmit?: (data: any) => void;
}

export const ShuttleForm: React.FC<ShuttleFormProps> = ({ onCancel, onSubmit }) => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (onSubmit) onSubmit({});
        onCancel();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Service Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Service Name</label>
                        <Input placeholder="e.g. Airport Express" required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Vehicle Type</label>
                        <Input placeholder="e.g. Minibus (Toyota HiAce)" required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Pickup Location</label>
                        <Input placeholder="e.g. Bole Airport Terminal 2" required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Dropoff Location</label>
                        <Input placeholder="e.g. Skylight Hotel" required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Schedule / Frequency</label>
                        <Input placeholder="e.g. Every 30 mins" required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Capacity (Seats)</label>
                        <Input type="number" placeholder="0" required />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Notes / Description</label>
                    <textarea
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-primary transition-colors h-24 resize-none"
                        placeholder="Additional details..."
                    />
                </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button type="submit" className="bg-brand-primary text-white">Create Shuttle</Button>
            </div>
        </form>
    );
};
