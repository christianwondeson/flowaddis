"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import axios from 'axios';

interface LocationInputProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
    api?: 'flights' | 'hotels';
}

export const LocationInput: React.FC<LocationInputProps> = ({
    value,
    onChange,
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
        { type: 'AIRPORT', name: 'Addis Ababa Bole International Airport', short_code: 'ADD', code: 'ADD.AIRPORT', cityName: 'Addis Ababa', countryName: 'Ethiopia' },
        { type: 'AIRPORT', name: 'Dubai International Airport', short_code: 'DXB', code: 'DXB.AIRPORT', cityName: 'Dubai', countryName: 'United Arab Emirates' },
        { type: 'AIRPORT', name: 'Heathrow Airport', short_code: 'LHR', code: 'LHR.AIRPORT', cityName: 'London', countryName: 'United Kingdom' },
        { type: 'AIRPORT', name: 'Frankfurt Airport', short_code: 'FRA', code: 'FRA.AIRPORT', cityName: 'Frankfurt', countryName: 'Germany' },
        { type: 'AIRPORT', name: 'Istanbul Airport', short_code: 'IST', code: 'IST.AIRPORT', cityName: 'Istanbul', countryName: 'Turkey' },
        { type: 'AIRPORT', name: 'John F. Kennedy International Airport', short_code: 'JFK', code: 'JFK.AIRPORT', cityName: 'New York', countryName: 'United States' },
        { type: 'AIRPORT', name: 'Toronto Pearson International Airport', short_code: 'YYZ', code: 'YYZ.AIRPORT', cityName: 'Toronto', countryName: 'Canada' },
        { type: 'AIRPORT', name: 'Doha Hamad International Airport', short_code: 'DOH', code: 'DOH.AIRPORT', cityName: 'Doha', countryName: 'Qatar' },
        { type: 'AIRPORT', name: 'Paris Charles de Gaulle Airport', short_code: 'CDG', code: 'CDG.AIRPORT', cityName: 'Paris', countryName: 'France' },
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
            if (v.length < 3 || codeLike) {
                // Show curated presets instead of calling the API to avoid rate limits
                if (codeLike) {
                    const q = v.toLowerCase();
                    const filtered = PRESETS.filter(
                        (i) => i.code.toLowerCase().includes(q) || i.short_code.toLowerCase().includes(q)
                    );
                    setSuggestions(filtered.length ? filtered : PRESETS);
                } else {
                    setSuggestions(PRESETS);
                }
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

        const timeoutId = setTimeout(fetchSuggestions, 500);
        return () => clearTimeout(timeoutId);
    }, [value]);

    const handleSelect = (location: any) => {
        // Prefer provider code like LHR.AIRPORT; fallback to IATA code
        onChange(location.code || location.short_code || location.name);
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
                <div className="absolute z-[9999] w-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 max-h-60 overflow-y-auto">
                    {suggestions.map((item: any) => (
                        <button
                            key={`${item.code || item.short_code || item.name}`}
                            onClick={() => handleSelect(item)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0"
                        >
                            <div className="p-2 bg-gray-100 rounded-full">
                                <MapPin className="w-4 h-4 text-gray-500" />
                            </div>
                            <div>
                                <div className="font-medium text-gray-900">{item.name}{item.short_code ? ` (${item.short_code})` : ''}</div>
                                <div className="text-xs text-gray-500">{[item.cityName, item.countryName].filter(Boolean).join(', ')}</div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
