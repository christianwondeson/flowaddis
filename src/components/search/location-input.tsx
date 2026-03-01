"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, Search, Plane } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { LocationSuggestion } from '@/types/api';
import { LOCATION_PRESETS } from '@/data/location-presets';
import axios from 'axios';

interface LocationInputProps {
    value: string;
    onChange: (value: string) => void;
    onSelect?: (name: string, code: string) => void;
    onSelectLocation?: (location: any) => void;
    label?: string;
    placeholder?: string;
    api?: 'flights' | 'hotels';
    icon?: React.ReactNode;
    className?: string;
    dropdownAlign?: 'left' | 'right';
}

export const LocationInput: React.FC<LocationInputProps> = ({
    value,
    onChange,
    onSelect,
    onSelectLocation,
    label = "Destination",
    placeholder = "Where are you going?",
    api = 'flights',
    icon,
    className,
    dropdownAlign = 'left',
}) => {
    const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [notFound, setNotFound] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [dropdownCoords, setDropdownCoords] = useState<{ top: number; left: number; width: number } | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const inWrapper = wrapperRef.current?.contains(target);
            const inDropdown = dropdownRef.current?.contains(target);
            if (!inWrapper && !inDropdown) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const updatePosition = () => {
            if (!showSuggestions || !inputRef.current) return;
            const rect = inputRef.current.getBoundingClientRect();
            const dropdownWidth = 350;
            const left = dropdownAlign === 'right' ? rect.right - dropdownWidth : rect.left;
            const clampedLeft = Math.max(8, Math.min(left, (typeof window !== 'undefined' ? window.innerWidth : 1024) - dropdownWidth - 8));
            setDropdownCoords({ top: rect.bottom + 8, left: clampedLeft, width: Math.min(dropdownWidth, rect.width) });
        };
        if (showSuggestions) {
            updatePosition();
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
        }
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [showSuggestions, dropdownAlign]);

    useEffect(() => {
        const fetchSuggestions = async () => {
            const trimmedValue = value.trim();

            // Reset not found when user types
            setNotFound(false);

            // If user hasn't interacted yet, keep dropdown hidden
            if (!hasInteracted) {
                setShowSuggestions(false);
                return;
            }

            // Show nothing for very short queries
            if (trimmedValue.length < 2) {
                setSuggestions([]);
                setShowSuggestions(false);
                return;
            }

            setIsLoading(true);
            setShowSuggestions(true);
            try {
                const endpoint = api === 'hotels' ? '/api/hotels/locations' : '/api/flights/locations';
                const response = await axios.get(`${endpoint}?name=${encodeURIComponent(trimmedValue)}`);

                if (Array.isArray(response.data) && response.data.length > 0) {
                    setSuggestions(response.data);
                    setShowSuggestions(true);
                    setNotFound(false);
                } else {
                    // API returned empty array - location not found
                    setSuggestions([]);
                    setNotFound(true);
                    setShowSuggestions(true);
                }
            } catch (error) {
                console.error('Error fetching suggestions:', error);
                // On error, also show not found
                setSuggestions([]);
                setNotFound(true);
                setShowSuggestions(true);
            } finally {
                setIsLoading(false);
            }
        };

        const debounce = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(debounce);
    }, [value, api, hasInteracted]);

    const handleSelect = (suggestion: LocationSuggestion) => {
        const name = suggestion.name ?? '';
        const code = suggestion.id ?? suggestion.code ?? suggestion.dest_id ?? suggestion.short_code ?? suggestion.iata_code ?? '';

        onChange(name);
        if (onSelect) {
            onSelect(name, code);
        }
        if (onSelectLocation) {
            onSelectLocation(suggestion);
        }
        setShowSuggestions(false);
    };

    const showDropdown = showSuggestions && (suggestions.length > 0 || notFound || isLoading);
    const dropdownContent = showDropdown && (
        <div
            ref={dropdownRef}
            className="bg-white rounded-xl shadow-2xl border border-gray-200 max-h-[300px] sm:max-h-[350px] md:max-h-[400px] overflow-y-auto min-w-[280px] w-full max-w-[min(92vw,350px)] animate-in fade-in zoom-in-95 duration-200"
            style={{
                position: 'fixed',
                top: dropdownCoords?.top ?? 0,
                left: dropdownCoords?.left ?? 0,
                zIndex: 10050,
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
            }}
        >
            {isLoading ? (
                <div className="p-4 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary mx-auto"></div>
                    <p className="mt-2 text-sm">Searching...</p>
                </div>
            ) : notFound ? (
                <div className="p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                        <Search className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700">Location not found</p>
                    <p className="text-xs text-gray-500 mt-1">Please try a different search term</p>
                </div>
            ) : (
                <div className="py-2">
                    {suggestions.map((item: LocationSuggestion, idx) => (
                        <button
                            key={`${item.dest_id || item.code || item.short_code || item.iata_code || item.name}-${idx}`}
                            onClick={() => handleSelect(item)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0 group"
                        >
                            <div className="shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center group-hover:bg-white transition-colors">
                                {item.photoUri || item.image_url ? (
                                    <img src={item.photoUri || item.image_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="bg-teal-50 p-2 rounded-full group-hover:bg-teal-100 transition-colors">
                                        {api === 'flights' ? (
                                            <Plane className="w-5 h-5 text-brand-primary" />
                                        ) : (
                                            <MapPin className="w-5 h-5 text-brand-primary" />
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-gray-900 text-[13px] sm:text-sm md:text-base line-clamp-2 sm:truncate">
                                    {item.name || item.label}
                                    {(item.short_code || item.iata_code) ? ` (${item.short_code || item.iata_code})` : ''}
                                </div>
                                <div className="text-[11px] sm:text-xs text-gray-500 truncate">
                                    {[item.cityName || item.city_name, item.countryName || item.country].filter(Boolean).join(', ')}
                                    {item.nr_hotels ? ` • ${item.nr_hotels} hotels` : ''}
                                </div>
                            </div>
                            {(item.dest_type || item.type || item.iata_code) && (
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-brand-primary/5 text-brand-primary rounded-md border border-brand-primary/10">
                                    {item.dest_type || item.type || 'AIRPORT'}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div ref={wrapperRef} className={cn("relative w-full", className)}>
            <div ref={inputRef}>
                <Input
                    label={label}
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value);
                        if (!hasInteracted) {
                            setHasInteracted(true);
                        }
                    }}
                    placeholder={placeholder}
                    icon={icon || <MapPin className="w-4 h-4" />}
                    onClick={() => {
                        if (!hasInteracted) {
                            setSuggestions(LOCATION_PRESETS);
                            setShowSuggestions(true);
                            setHasInteracted(true);
                        }
                    }}
                    onFocus={() => {
                        if (hasInteracted && suggestions.length > 0) {
                            setShowSuggestions(true);
                        }
                    }}
                />
            </div>

            {/* Suggestions Dropdown - Rendered in portal to escape overflow/z-index */}
            {showDropdown && dropdownCoords && typeof document !== 'undefined' &&
                createPortal(dropdownContent, document.body)}
        </div>
    );
};
