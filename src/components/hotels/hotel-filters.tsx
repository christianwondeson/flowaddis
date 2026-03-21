"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { ChevronDown, X, MapPin } from "lucide-react"
import { HotelFilters as FilterType } from "@/types"
import { Input } from "@/components/ui/input"
import { Hotel } from "@/types"
import { HotelMapPreview } from "./hotel-map-preview"
import { LocationInput } from "@/components/search/location-input"

interface HotelFiltersProps {
    filters: FilterType
    onFilterChange: (filters: FilterType) => void
    hotels?: Hotel[]
    showMapPreview?: boolean
    linkParams?: Record<string, string | number | undefined | null>
    checkIn?: string
    checkOut?: string
    destId?: string
}

export const HotelFilters: React.FC<HotelFiltersProps> = ({
    filters,
    onFilterChange,
    hotels,
    showMapPreview = true,
    linkParams,
    checkIn,
    checkOut,
    destId,
}) => {
    const [expandedSections, setExpandedSections] = useState({
        location: true,
        property: true,
        rating: true,
        score: false,
        price: false,
    })

    // Local state for debounced inputs
    const [localQuery, setLocalQuery] = useState(filters.query || "")
    const [localHotelName, setLocalHotelName] = useState(filters.hotelName || "")

    // Sync local state with props when props change
    useEffect(() => {
        // If prop is empty (cleared), always sync
        if (!filters.query) {
            setLocalQuery("")
        } else if (filters.query !== localQuery) {
            // Only sync if different (avoids cursor jumps if parent echoes back same value)
            setLocalQuery(filters.query)
        }
    }, [filters.query])

    useEffect(() => {
        // If prop is empty (cleared), always sync
        if (!filters.hotelName) {
            setLocalHotelName("")
        } else if (filters.hotelName !== localHotelName) {
            // Only sync if different
            setLocalHotelName(filters.hotelName)
        }
    }, [filters.hotelName])

    // Debounce destination text (typed without picking from list) — clear dest_id so API resolves by name
    useEffect(() => {
        const timer = setTimeout(() => {
            if (localQuery !== (filters.query || "")) {
                onFilterChange({
                    ...filters,
                    query: localQuery,
                    // Empty strings so parent can remove destId from URL (see hotels page handleFilterChange)
                    destId: "",
                    destType: "",
                })
            }
        }, 500)
        return () => clearTimeout(timer)
    }, [localQuery])

    // Debounce Hotel Name
    useEffect(() => {
        const timer = setTimeout(() => {
            if (localHotelName !== (filters.hotelName || "")) {
                onFilterChange({ ...filters, hotelName: localHotelName })
            }
        }, 500)
        return () => clearTimeout(timer)
    }, [localHotelName])

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
    }

    const handleStarChange = (star: number) => {
        const currentStars = filters.stars || []
        const newStars = currentStars.includes(star) ? currentStars.filter((s) => s !== star) : [...currentStars, star]
        onFilterChange({ ...filters, stars: newStars })
    }

    const handlePriceChange = (type: "min" | "max", value: string) => {
        const numValue = value ? Number.parseInt(value) : undefined
        onFilterChange({
            ...filters,
            [type === "min" ? "minPrice" : "maxPrice"]: numValue,
        })
    }

    const activeFilterCount = [
        filters.stars?.length || 0,
        filters.minRating ? 1 : 0,
        filters.minPrice ? 1 : 0,
        filters.maxPrice ? 1 : 0,
        // filters.query ? 1 : 0, // Don't count query as a filter to be cleared
        filters.hotelName ? 1 : 0,
    ].reduce((a, b) => a + b, 0)

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
            {/* Modern Header with Filter Count */}
            <div className="p-4 md:p-6 border-b border-gray-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-brand-dark dark:text-foreground">Refine your search</h2>
                    {activeFilterCount > 0 && (
                        <button
                            onClick={() =>
                                onFilterChange({
                                    ...filters,
                                    stars: [],
                                    minRating: undefined,
                                    minPrice: undefined,
                                    maxPrice: undefined,
                                    hotelName: "",
                                    destId: undefined,
                                    destType: undefined,
                                })
                            }
                            className="text-xs font-bold text-brand-primary hover:text-brand-primary/70 transition-colors flex items-center gap-1"
                        >
                            <X className="w-3 h-3" />
                            Clear all ({activeFilterCount})
                        </button>
                    )}
                </div>

                {/* Map Preview - Premium positioning */}
                {showMapPreview && <HotelMapPreview hotels={hotels} linkParams={linkParams} />}
            </div>

            <div className="divide-y divide-gray-100 dark:divide-slate-700">
                {/* Location Filter - Collapsible */}
                <FilterSection
                    title="Location"
                    isExpanded={expandedSections.location}
                    onToggle={() => toggleSection("location")}
                    hasValue={Boolean(filters.query?.trim() || filters.destId)}
                >
                    <LocationInput
                        label="Destination"
                        placeholder="e.g. Addis Ababa, Ethiopia"
                        value={localQuery}
                        onChange={(val) => {
                            setLocalQuery(val)
                        }}
                        onSelectLocation={(loc) => {
                            const label = (loc.name ?? loc.label ?? "").trim()
                            onFilterChange({
                                ...filters,
                                query: label || localQuery,
                                destId: loc.dest_id != null ? String(loc.dest_id) : undefined,
                                destType: loc.dest_type != null ? String(loc.dest_type) : undefined,
                            })
                            setLocalQuery(label || localQuery)
                        }}
                        api="hotels"
                        icon={<MapPin className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" />}
                        className="[&_label]:text-xs [&_label]:font-bold [&_label]:text-brand-dark [&_label]:dark:text-foreground [&_label]:mb-1.5"
                    />
                </FilterSection>

                {/* Property Name Filter - Collapsible */}
                <FilterSection
                    title="Property Name"
                    isExpanded={expandedSections.property}
                    onToggle={() => toggleSection("property")}
                    hasValue={!!filters.hotelName}
                >
                    <Input
                        type="text"
                        placeholder="e.g. Hilton, Hyatt, Skylight..."
                        value={localHotelName}
                        onChange={(e) => setLocalHotelName(e.target.value)}
                        className="h-10 text-sm border-brand-primary/20 focus:border-brand-primary"
                    />
                </FilterSection>

                {/* Star Rating Filter - Enhanced */}
                <FilterSection
                    title="Star Rating"
                    isExpanded={expandedSections.rating}
                    onToggle={() => toggleSection("rating")}
                    hasValue={!!filters.stars?.length}
                >
                    <div className="flex flex-col gap-2">
                        {[5, 4, 3, 2, 1].map((star) => {
                            const isSelected = filters.stars?.includes(star)
                            return (
                                <label
                                    key={star}
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => handleStarChange(star)}
                                        className="w-4 h-4 accent-brand-primary rounded border-gray-300 cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-slate-200 font-medium">
                                        {Array.from({ length: star }).map((_, i) => (
                                            <span key={i}>⭐</span>
                                        ))}{" "}
                                        {star} star{star > 1 ? "s" : ""}
                                    </span>
                                </label>
                            )
                        })}
                    </div>
                </FilterSection>

                {/* Review Score Filter - Enhanced */}
                <FilterSection
                    title="Guest Rating"
                    isExpanded={expandedSections.score}
                    onToggle={() => toggleSection("score")}
                    hasValue={!!filters.minRating}
                >
                    <div className="flex flex-col gap-2">
                        {[
                            { label: "Wonderful: 9+", value: 90, color: "bg-green-50 border-green-200" },
                            { label: "Very Good: 8+", value: 80, color: "bg-teal-50 border-teal-200" },
                            { label: "Good: 7+", value: 70, color: "bg-yellow-50 border-yellow-200" },
                            { label: "Pleasant: 6+", value: 60, color: "bg-orange-50 border-orange-200" },
                        ].map((score) => {
                            const isSelected = filters.minRating === score.value
                            return (
                                <button
                                    key={score.value}
                                    onClick={() => onFilterChange({ ...filters, minRating: isSelected ? undefined : score.value })}
                                    className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${isSelected
                                        ? `${score.color} border-current text-gray-900`
                                        : "border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800"
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span>{score.label}</span>
                                        {isSelected && <span className="text-xs">✓</span>}
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </FilterSection>

                {/* Price Range Filter - Enhanced */}
                <FilterSection
                    title="Price Range"
                    isExpanded={expandedSections.price}
                    onToggle={() => toggleSection("price")}
                    hasValue={!!filters.minPrice || !!filters.maxPrice}
                >
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-600 dark:text-slate-400 mb-1">Min</label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={filters.minPrice || ""}
                                    onChange={(e) => handlePriceChange("min", e.target.value)}
                                    className="h-10 text-sm border-brand-primary/20 focus:border-brand-primary"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-600 dark:text-slate-400 mb-1">Max</label>
                                <Input
                                    type="number"
                                    placeholder="999"
                                    value={filters.maxPrice || ""}
                                    onChange={(e) => handlePriceChange("max", e.target.value)}
                                    className="h-10 text-sm border-brand-primary/20 focus:border-brand-primary"
                                />
                            </div>
                        </div>
                        {(filters.minPrice || filters.maxPrice) && (
                            <div className="text-xs text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800 p-2 rounded-lg">
                                ${filters.minPrice || 0} - ${filters.maxPrice || "∞"}
                            </div>
                        )}
                    </div>
                </FilterSection>
            </div>
        </div>
    )
}

interface FilterSectionProps {
    title: string
    isExpanded: boolean
    onToggle: () => void
    hasValue: boolean
    children: React.ReactNode
}

const FilterSection: React.FC<FilterSectionProps> = ({ title, isExpanded, onToggle, hasValue, children }) => {
    return (
        <div className="p-4 md:p-6">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between hover:opacity-70 transition-opacity mb-3"
            >
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-brand-dark dark:text-foreground">{title}</h3>
                    {hasValue && (
                        <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-brand-primary text-white rounded-full">
                            ✓
                        </span>
                    )}
                </div>
                <ChevronDown
                    className={`w-4 h-4 text-gray-400 dark:text-slate-500 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                />
            </button>
            {isExpanded && <div className="animate-in fade-in duration-200">{children}</div>}
        </div>
    )
}
