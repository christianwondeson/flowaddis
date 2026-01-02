"use client";

import React, { useState } from 'react';
import { Upload, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface HotelFormProps {
    onCancel: () => void;
    onSubmit?: (data: any) => void;
}

export const HotelForm: React.FC<HotelFormProps> = ({ onCancel, onSubmit }) => {
    const [facilities, setFacilities] = useState<string[]>([]);
    const [newFacility, setNewFacility] = useState('');
    const [images, setImages] = useState<string[]>([]);

    const handleAddFacility = () => {
        if (newFacility.trim()) {
            setFacilities([...facilities, newFacility.trim()]);
            setNewFacility('');
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const url = URL.createObjectURL(e.target.files[0]);
            setImages([...images, url]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Gather form data here
        if (onSubmit) {
            onSubmit({ facilities, images }); // Pass other fields too
        }
        onCancel(); // Close modal for now
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Hotel Name</label>
                        <Input placeholder="e.g. Skylight Hotel" required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Location</label>
                        <Input placeholder="e.g. Bole, Addis Ababa" required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Price per Night (USD)</label>
                        <Input type="number" placeholder="0.00" required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Star Rating</label>
                        <select className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand-primary transition-colors">
                            <option>5 Stars</option>
                            <option>4 Stars</option>
                            <option>3 Stars</option>
                            <option>2 Stars</option>
                            <option>1 Star</option>
                        </select>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <textarea
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-primary transition-colors h-24 resize-none"
                        placeholder="Describe the hotel..."
                    />
                </div>
            </div>

            {/* Facilities */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Facilities</h3>
                <div className="flex gap-2">
                    <Input
                        placeholder="Add a facility (e.g. Free WiFi)"
                        value={newFacility}
                        onChange={(e) => setNewFacility(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddFacility();
                            }
                        }}
                    />
                    <Button onClick={handleAddFacility} type="button" variant="outline">
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {facilities.map((facility, idx) => (
                        <div key={idx} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                            {facility}
                            <button type="button" onClick={() => setFacilities(facilities.filter((_, i) => i !== idx))} className="hover:text-red-500">
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                    {facilities.length === 0 && <span className="text-sm text-gray-400 italic">No facilities added yet.</span>}
                </div>
            </div>

            {/* Images */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Gallery</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group">
                            <img src={img} alt="Upload preview" className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={() => setImages(images.filter((_, i) => i !== idx))}
                                className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-brand-primary hover:bg-brand-primary/5 transition-all group">
                        <Upload className="w-6 h-6 text-gray-400 group-hover:text-brand-primary mb-2" />
                        <span className="text-[10px] font-bold text-gray-500 group-hover:text-brand-primary">Upload</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button type="submit" className="bg-brand-primary text-white">Create Hotel</Button>
            </div>
        </form>
    );
};
