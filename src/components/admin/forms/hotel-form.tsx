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
    const commonFacilities = [
        { id: 'wifi', label: 'Free Wi-Fi' },
        { id: 'restaurant', label: 'Restaurant' },
        { id: 'bar', label: 'Bar/Lounge' },
        { id: 'gym', label: 'Fitness Gym' },
        { id: 'pool', label: 'Pool' },
        { id: 'spa', label: 'Spa' },
        { id: 'sauna', label: 'Sauna/Steam' },
        { id: 'shuttle', label: 'Airport Shuttle' },
        { id: 'conference', label: 'Conference/Meeting Rooms' },
    ];

    const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
    const [customFacilities, setCustomFacilities] = useState<string[]>([]);
    const [newFacility, setNewFacility] = useState('');
    const [images, setImages] = useState<{ url: string; isPrimary: boolean }[]>([]);
    const [pricing, setPricing] = useState({
        original: '',
        discounted: '',
        currency: 'USD',
        category: 'Mid-range'
    });

    const toggleFacility = (id: string) => {
        setSelectedFacilities(prev =>
            prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
        );
    };

    const handleAddCustomFacility = () => {
        if (newFacility.trim() && !customFacilities.includes(newFacility.trim())) {
            setCustomFacilities([...customFacilities, newFacility.trim()]);
            setNewFacility('');
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            const newImages = newFiles.map((file, index) => ({
                url: URL.createObjectURL(file),
                isPrimary: images.length === 0 && index === 0 // Mark first image as primary if none exist
            }));
            setImages([...images, ...newImages]);
        }
    };

    const setPrimaryImage = (index: number) => {
        setImages(images.map((img, i) => ({
            ...img,
            isPrimary: i === index
        })));
    };

    const removeImage = (index: number) => {
        const removed = images[index];
        if (removed.isPrimary && images.length > 1) {
            // If we remove primary, set the first remaining one as primary
            const nextImages = images.filter((_, i) => i !== index);
            nextImages[0].isPrimary = true;
            setImages(nextImages);
        } else {
            setImages(images.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (onSubmit) {
            onSubmit({
                facilities: [...selectedFacilities.map(id => commonFacilities.find(f => f.id === id)?.label), ...customFacilities],
                images,
                pricing
            });
        }
        onCancel();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 p-6 no-scrollbar">
            {/* Basic Info */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <h3 className="text-sm font-bold text-brand-dark uppercase tracking-wider">Basic Information</h3>
                    <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/5 px-2 py-0.5 rounded-full">Step 1 of 3</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Hotel Name</label>
                        <Input placeholder="e.g. Skylight Hotel" className="rounded-xl border-gray-100 focus:border-brand-primary" required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Location</label>
                        <Input placeholder="e.g. Bole, Addis Ababa" className="rounded-xl border-gray-100 focus:border-brand-primary" required />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                    <textarea
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-primary transition-colors h-24 resize-none"
                        placeholder="Describe the hotel's features, unique selling points, and local context..."
                    />
                </div>
            </div>

            {/* Pricing Details */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <h3 className="text-sm font-bold text-brand-dark uppercase tracking-wider">Pricing & Category</h3>
                    <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/5 px-2 py-0.5 rounded-full">Step 2 of 3</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Original Price</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                            <Input
                                type="number"
                                placeholder="0.00"
                                className="pl-7 rounded-xl border-gray-100 focus:border-brand-primary"
                                value={pricing.original}
                                onChange={(e) => setPricing({ ...pricing, original: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Discounted Price</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-primary font-bold text-sm">$</span>
                            <Input
                                type="number"
                                placeholder="0.00"
                                className="pl-7 rounded-xl border-gray-100 focus:border-brand-primary font-bold text-brand-primary"
                                value={pricing.discounted}
                                onChange={(e) => setPricing({ ...pricing, discounted: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Currency</label>
                        <select
                            value={pricing.currency}
                            onChange={(e) => setPricing({ ...pricing, currency: e.target.value })}
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-primary transition-colors"
                        >
                            <option value="USD">USD ($)</option>
                            <option value="ETB">ETB (Br)</option>
                            <option value="EUR">EUR (€)</option>
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Price Category</label>
                        <select
                            value={pricing.category}
                            onChange={(e) => setPricing({ ...pricing, category: e.target.value })}
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-primary transition-colors font-bold"
                        >
                            <option>Budget</option>
                            <option>Mid-range</option>
                            <option>Luxury</option>
                            <option>Premium</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Star Rating</label>
                        <select className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-primary transition-colors">
                            <option>5 Stars</option>
                            <option>4 Stars</option>
                            <option>3 Stars</option>
                            <option>2 Stars</option>
                            <option>1 Star</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Facilities Grid */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <h3 className="text-sm font-bold text-brand-dark uppercase tracking-wider">Facilities & Amenities</h3>
                    <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/5 px-2 py-0.5 rounded-full">Step 3 of 3</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {commonFacilities.map((facility) => (
                        <button
                            key={facility.id}
                            type="button"
                            onClick={() => toggleFacility(facility.id)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left group ${selectedFacilities.includes(facility.id)
                                ? 'bg-brand-primary/10 border-brand-primary text-brand-primary shadow-sm'
                                : 'bg-white border-gray-100 text-gray-600 hover:border-brand-primary/30 hover:bg-gray-50'
                                }`}
                        >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedFacilities.includes(facility.id)
                                ? 'bg-brand-primary border-brand-primary'
                                : 'border-gray-300 group-hover:border-brand-primary'
                                }`}>
                                {selectedFacilities.includes(facility.id) && (
                                    <Plus className="w-3 h-3 text-white rotate-45" />
                                )}
                            </div>
                            <span className="text-xs font-bold">{facility.label}</span>
                        </button>
                    ))}
                </div>

                <div className="pt-4 border-t border-gray-50">
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-3">Custom Facilities</label>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Add other facility (e.g. Garden, Pet-friendly)"
                            value={newFacility}
                            onChange={(e) => setNewFacility(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddCustomFacility();
                                }
                            }}
                            className="rounded-xl border-gray-100 focus:border-brand-primary"
                        />
                        <Button onClick={handleAddCustomFacility} type="button" variant="outline" className="rounded-xl px-4 border-gray-100 hover:text-brand-primary hover:border-brand-primary">
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {customFacilities.map((facility, idx) => (
                        <div key={idx} className="bg-brand-dark text-white px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-2 shadow-sm">
                            {facility}
                            <button type="button" onClick={() => setCustomFacilities(customFacilities.filter((_, i) => i !== idx))} className="hover:text-red-400">
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Enhanced Gallery */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <h3 className="text-sm font-bold text-brand-dark uppercase tracking-wider">Gallery & Photos</h3>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">{images.length} photos added</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {images.map((img, idx) => (
                        <div key={idx} className={`relative aspect-[4/3] rounded-2xl overflow-hidden group border-2 transition-all ${img.isPrimary ? 'border-brand-primary shadow-lg ring-4 ring-brand-primary/10' : 'border-transparent'
                            }`}>
                            <img src={img.url} alt="Upload preview" className="w-full h-full object-cover" />

                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                {!img.isPrimary && (
                                    <button
                                        type="button"
                                        onClick={() => setPrimaryImage(idx)}
                                        className="bg-brand-primary text-white text-[10px] font-bold px-3 py-1 rounded-full hover:scale-105 transition-transform"
                                    >
                                        Set Primary
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => removeImage(idx)}
                                    className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {img.isPrimary && (
                                <div className="absolute top-2 left-2 bg-brand-primary text-white text-[8px] font-extrabold px-2 py-0.5 rounded-full shadow-lg uppercase tracking-widest">
                                    Primary
                                </div>
                            )}
                        </div>
                    ))}

                    <label className="aspect-[4/3] rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-brand-primary hover:bg-brand-primary/5 transition-all group">
                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-2 group-hover:bg-brand-primary/10 transition-colors">
                            <Upload className="w-5 h-5 text-gray-400 group-hover:text-brand-primary" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-500 group-hover:text-brand-primary uppercase tracking-wider">Select Photos</span>
                        <span className="text-[8px] text-gray-400 mt-1">Multi-upload supported</span>
                        <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageUpload} />
                    </label>
                </div>
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-gray-100 flex justify-end gap-4 sticky bottom-0 bg-white/95 backdrop-blur-sm -mx-6 px-6 pb-6 mt-8">
                <Button type="button" variant="ghost" onClick={onCancel} className="rounded-xl font-bold text-gray-400 hover:text-gray-600">
                    Cancel
                </Button>
                <Button type="submit" className="bg-brand-primary hover:bg-brand-primary/90 text-white font-bold px-8 rounded-xl shadow-lg shadow-brand-primary/20 transition-all active:scale-95">
                    Create Hotel Profile
                </Button>
            </div>
        </form>
    );
};
