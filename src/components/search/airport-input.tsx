"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Plane, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import axios from 'axios';

interface AirportInputProps {
    value: string;
    onSelect: (name: string, code: string) => void;
    label?: string;
    placeholder?: string;
}

export const AirportInput: React.FC<AirportInputProps> = ({
    value,
    onSelect,
    label = "Airport",
    placeholder = "City or Airport"
}) => {
    const [inputValue, setInputValue] = useState(value);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setInputValue(value);
    }, [value]);

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
            if (inputValue.length < 3) {
                setSuggestions([]);
                return;
            }

            setIsLoading(true);
            try {
                const response = await axios.get(`/api/flights/locations?name=${inputValue}`);
                if (Array.isArray(response.data)) {
                    setSuggestions(response.data);
                    setShowSuggestions(true);
                }
            } catch (error) {
                console.error('Error fetching airports:', error);
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchSuggestions, 500);
        return () => clearTimeout(timeoutId);
    }, [inputValue]);

    const handleSelect = (item: any) => {
        const displayName = `${item.name} (${item.iata_code})`;
        setInputValue(displayName);
        onSelect(displayName, item.iata_code);
        setShowSuggestions(false);
    };

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <Input
                label={label}
                placeholder={placeholder}
                icon={<Plane className="w-4 h-4" />}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onFocus={() => inputValue.length >= 3 && setShowSuggestions(true)}
            />

            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 max-h-60 overflow-y-auto">
                    {suggestions.map((item: any) => (
                        <button
                            key={item.id || item.iata_code}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 flex items-center justify-between group"
                            onClick={() => handleSelect(item)}
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-50 p-2 rounded-full group-hover:bg-blue-100 transition-colors">
                                    <Plane className="w-4 h-4 text-brand-primary" />
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900">{item.name}</div>
                                    <div className="text-xs text-gray-500">{item.city_name}, {item.country_name}</div>
                                </div>
                            </div>
                            <span className="font-mono text-xs font-bold bg-gray-100 px-2 py-1 rounded text-gray-600 group-hover:bg-white group-hover:shadow-sm">
                                {item.iata_code}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
