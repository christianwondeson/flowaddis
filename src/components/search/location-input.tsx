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
}

export const LocationInput: React.FC<LocationInputProps> = ({
    value,
    onChange,
    label = "Destination",
    placeholder = "Where are you going?"
}) => {
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

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
            if (value.length < 3) {
                setSuggestions([]);
                return;
            }

            setIsLoading(true);
            try {
                const response = await axios.get(`/api/hotels/locations?name=${value}`);
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
        onChange(location.name); // Or pass the full location object if needed
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
                onFocus={() => value.length >= 3 && setShowSuggestions(true)}
            />

            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 max-h-60 overflow-y-auto">
                    {suggestions.map((item: any) => (
                        <button
                            key={item.dest_id}
                            onClick={() => handleSelect(item)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0"
                        >
                            <div className="p-2 bg-gray-100 rounded-full">
                                <MapPin className="w-4 h-4 text-gray-500" />
                            </div>
                            <div>
                                <div className="font-medium text-gray-900">{item.name}</div>
                                <div className="text-xs text-gray-500">{item.label}</div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
