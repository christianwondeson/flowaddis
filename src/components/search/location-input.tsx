"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import axios from 'axios';

interface LocationInputProps {
    value: string;
    onChange: (value: string) => void;
    onSelectLocation?: (location: any) => void;
    label?: string;
    placeholder?: string;
    api?: 'flights' | 'hotels';
}

export const LocationInput: React.FC<LocationInputProps> = ({
    value,
    onChange,
    onSelectLocation,
    label = "Destination",
    placeholder = "Where are you going?",
    api = 'flights',
}) => {
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Curated presets for Ethiopian diaspora routes
    const PRESETS = [
        { type: 'AIRPORT', name: 'Addis Ababa Bole International Airport', short_code: 'ADD', code: 'ADD.AIRPORT', cityName: 'Addis Ababa', countryName: 'Ethiopia', dest_id: '-553173', dest_type: 'city' },
        { type: 'AIRPORT', name: 'Dubai International Airport', short_code: 'DXB', code: 'DXB.AIRPORT', cityName: 'Dubai', countryName: 'United Arab Emirates', dest_id: '20088325', dest_type: 'city' },
        { type: 'AIRPORT', name: 'Heathrow Airport', short_code: 'LHR', code: 'LHR.AIRPORT', cityName: 'London', countryName: 'United Kingdom', dest_id: '-2601889', dest_type: 'city' },
        { type: 'AIRPORT', name: 'Frankfurt Airport', short_code: 'FRA', code: 'FRA.AIRPORT', cityName: 'Frankfurt', countryName: 'Germany', dest_id: '-1771148', dest_type: 'city' },
        { type: 'AIRPORT', name: 'Istanbul Airport', short_code: 'IST', code: 'IST.AIRPORT', cityName: 'Istanbul', countryName: 'Turkey', dest_id: '-755070', dest_type: 'city' },
        { type: 'AIRPORT', name: 'John F. Kennedy International Airport', short_code: 'JFK', code: 'JFK.AIRPORT', cityName: 'New York', countryName: 'United States', dest_id: '20088325', dest_type: 'city' },
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchSuggestions = async () => {
            const v = value.trim();
            const codeLike = /^(?:[A-Za-z]{3}\.(?:AIRPORT|CITY))$/.test(v) || v.includes('.AIRPORT') || v.includes('.CITY');

            if (v.length < 2) {
                setSuggestions(PRESETS);
                setShowSuggestions(true);
                return;
            }

            if (codeLike) {
                const q = v.toLowerCase();
                const filtered = PRESETS.filter(
                    (i) => i.code.toLowerCase().includes(q) || i.short_code.toLowerCase().includes(q)
                );
                setSuggestions(filtered.length ? filtered : PRESETS);
                setShowSuggestions(true);
                return;
            }

            setIsLoading(true);
            try {
                const endpoint = api === 'hotels' ? '/api/hotels/locations' : '/api/flights/locations';
                const response = await axios.get(`${endpoint}?name=${encodeURIComponent(value)}`);
                if (Array.isArray(response.data)) {
                    setSuggestions(response.data);
                    setShowSuggestions(true);
                }
            } catch (error) {
                console.error('Error fetching locations:', error);
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timeoutId);
    }, [value, api]);

    const handleSelect = (location: any) => {
        // Prefer provider code like LHR.AIRPORT for flights; fallback to name/label
        if (api === 'flights' && location.code) {
            onChange(location.code);
        } else {
            onChange(location.name || location.label || location.short_code);
        }

        if (onSelectLocation) {
            onSelectLocation(location);
        }
        setShowSuggestions(false);
    };

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <Input
                label={label}
                placeholder={placeholder}
                icon={<MapPin className="w-4 h-4" />}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
            />

            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-[10000] left-0 right-0 md:right-auto md:min-w-[400px] mt-1 bg-white rounded-xl shadow-2xl border border-gray-100 max-h-80 overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                    {suggestions.map((item: any, idx) => (
                        <button
                            key={`${item.dest_id || item.code || item.short_code || item.name}-${idx}`}
                            onClick={() => handleSelect(item)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0 group"
                        >
                            <div className="flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center group-hover:bg-white transition-colors">
                                {item.image_url ? (
                                    <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <MapPin className="w-6 h-6 text-gray-400 group-hover:text-brand-primary transition-colors" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-gray-900 truncate text-sm md:text-base">
                                    {item.name || item.label}
                                    {item.short_code ? ` (${item.short_code})` : ''}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                    {[item.cityName || item.city_name, item.countryName || item.country].filter(Boolean).join(', ')}
                                    {item.nr_hotels ? ` • ${item.nr_hotels} hotels` : ''}
                                </div>
                            </div>
                            {(item.dest_type || item.type) && (
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-brand-primary/5 text-brand-primary rounded-md border border-brand-primary/10">
                                    {item.dest_type || item.type}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
