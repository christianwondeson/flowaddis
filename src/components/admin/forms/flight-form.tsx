"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FlightFormProps {
    onCancel: () => void;
    onSubmit?: (data: any) => void;
}

export const FlightForm: React.FC<FlightFormProps> = ({ onCancel, onSubmit }) => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (onSubmit) onSubmit({});
        onCancel();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Flight Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Airline Name</label>
                        <Input placeholder="e.g. Ethiopian Airlines" required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Flight Number</label>
                        <Input placeholder="e.g. ET 500" required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Origin (Airport Code)</label>
                        <Input placeholder="e.g. ADD" required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Destination (Airport Code)</label>
                        <Input placeholder="e.g. JFK" required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Departure Time</label>
                        <Input type="datetime-local" required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Arrival Time</label>
                        <Input type="datetime-local" required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Price (USD)</label>
                        <Input type="number" placeholder="0.00" required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Class</label>
                        <select className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand-primary transition-colors">
                            <option>Economy</option>
                            <option>Business</option>
                            <option>First Class</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button type="submit" className="bg-brand-primary text-white">Create Flight</Button>
            </div>
        </form>
    );
};
