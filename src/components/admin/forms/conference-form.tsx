"use client";

import React from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ConferenceFormProps {
    onCancel: () => void;
    onSubmit?: (data: any) => void;
}

export const ConferenceForm: React.FC<ConferenceFormProps> = ({ onCancel, onSubmit }) => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (onSubmit) onSubmit({});
        onCancel();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Event Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Event Name</label>
                        <Input placeholder="e.g. African Tech Summit" required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Location / Venue</label>
                        <Input placeholder="e.g. Skylight Hotel" required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Start Date & Time</label>
                        <Input type="datetime-local" required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">End Date & Time</label>
                        <Input type="datetime-local" required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Capacity</label>
                        <Input type="number" placeholder="0" required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Organizer</label>
                        <Input placeholder="e.g. FlowAddis Events" />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <textarea
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-primary transition-colors h-24 resize-none"
                        placeholder="Describe the event..."
                    />
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Banner Image</h3>
                <label className="aspect-video rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-brand-primary hover:bg-brand-primary/5 transition-all group">
                    <Upload className="w-8 h-8 text-gray-400 group-hover:text-brand-primary mb-2" />
                    <span className="text-xs font-bold text-gray-500 group-hover:text-brand-primary">Upload Banner</span>
                    <input type="file" className="hidden" accept="image/*" />
                </label>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button type="submit" className="bg-brand-primary text-white">Create Event</Button>
            </div>
        </form>
    );
};
