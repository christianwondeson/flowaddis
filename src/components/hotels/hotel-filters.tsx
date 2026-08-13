"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { ChevronDown, X, MapPin, Star, SlidersHorizontal } from "lucide-react"
import { HotelFilters as FilterType } from "@/types"
import { Input } from "@/components/ui/input"
import { Hotel } from "@/types"
import { HotelMapPreview } from "./hotel-map-preview"
import { LocationInput } from "@/components/search/location-input"
import { cn } from "@/lib/utils"

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
}) => {
    const [expandedSections, setExpandedSections] = useState({
        location: true,
        property: true,
        rating: true,
        score: true,
        price: true,
    })

    const [localQuery, setLocalQuery] = useState(filters.query || "")
    const [localHotelName, setLocalHotelName] = useState(filters.hotelName || "")

    useEffect(() => {
        if (!filters.query) setLocalQuery("")
        else if (filters.query !== localQuery) setLocalQuery(filters.query)
    }, [filters.query])

    useEffect(() => {
        if (!filters.hotelName) setLocalHotelName("")
        else if (filters.hotelName !== localHotelName) setLocalHotelName(filters.hotelName)
    }, [filters.hotelName])

    useEffect(() => {
        const timer = setTimeout(() => {
            if (localQuery !== (filters.query || "")) {
                onFilterChange({
                    ...filters,
                    query: localQuery,
                    destId: "",
                    destType: "",
                })
            }
        }, 500)
        return () => clearTimeout(timer)
    }, [localQuery])

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
        const newStars = currentStars.includes(star)
            ? currentStars.filter((s) => s !== star)
            : [...currentStars, star]
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
        filters.hotelName ? 1 : 0,
    ].reduce((a, b) => a + b, 0)

    const clearAll = () =>
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

    return (
        <div className="listing-panel overflow-hidden flex flex-col">
            <div className="shrink-0 px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">
                            <SlidersHorizontal className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                                Refine search
                            </h2>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                Filters update results live
                            </p>
                        </div>
                    </div>
                    {activeFilterCount > 0 ? (
                        <button
                            type="button"
                            onClick={clearAll}
                            className="shrink-0 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-teal-700 hover:bg-teal-50 dark:text-teal-300 dark:hover:bg-teal-950/40 transition-colors"
                        >
                            <X className="w-3 h-3" />
                            Clear ({activeFilterCount})
                        </button>
                    ) : null}
                </div>

                {showMapPreview ? (
                    <div className="rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                        <HotelMapPreview hotels={hotels} linkParams={linkParams} />
                    </div>
                ) : null}
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                <FilterSection
                    title="Location"
                    isExpanded={expandedSections.location}
                    onToggle={() => toggleSection("location")}
                    active={Boolean(filters.query?.trim() || filters.destId)}
                >
                    <LocationInput
                        label="Destination"
                        placeholder="e.g. Addis Ababa"
                        value={localQuery}
                        onChange={(val) => setLocalQuery(val)}
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
                        icon={<MapPin className="w-4 h-4 text-slate-400 shrink-0" />}
                        className="[&_label]:text-[11px] [&_label]:font-semibold [&_label]:uppercase [&_label]:tracking-wide [&_label]:text-slate-500 [&_label]:mb-1.5"
                    />
                </FilterSection>

                <FilterSection
                    title="Property name"
                    isExpanded={expandedSections.property}
                    onToggle={() => toggleSection("property")}
                    active={!!filters.hotelName}
                >
                    <Input
                        type="text"
                        placeholder="Hilton, Hyatt, Skylight…"
                        value={localHotelName}
                        onChange={(e) => setLocalHotelName(e.target.value)}
                        className="h-10 text-sm rounded-xl border-slate-200 dark:border-slate-600 focus-visible:ring-teal-500/30"
                    />
                </FilterSection>

                <FilterSection
                    title="Star rating"
                    isExpanded={expandedSections.rating}
                    onToggle={() => toggleSection("rating")}
                    active={!!filters.stars?.length}
                >
                    <div className="space-y-1">
                        {[5, 4, 3, 2, 1].map((star) => {
                            const isSelected = filters.stars?.includes(star)
                            return (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => handleStarChange(star)}
                                    className={cn(
                                        "w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors",
                                        isSelected
                                            ? "bg-teal-50 text-teal-900 dark:bg-teal-950/40 dark:text-teal-100"
                                            : "hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200",
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "flex h-4 w-4 items-center justify-center rounded border",
                                            isSelected
                                                ? "border-teal-600 bg-teal-600 text-white"
                                                : "border-slate-300 dark:border-slate-600",
                                        )}
                                    >
                                        {isSelected ? (
                                            <span className="text-[10px] font-bold leading-none">✓</span>
                                        ) : null}
                                    </span>
                                    <span className="flex items-center gap-0.5">
                                        {Array.from({ length: star }).map((_, i) => (
                                            <Star
                                                key={i}
                                                className={cn(
                                                    "h-3.5 w-3.5",
                                                    isSelected
                                                        ? "fill-amber-400 text-amber-400"
                                                        : "fill-amber-300/80 text-amber-300/80",
                                                )}
                                            />
                                        ))}
                                    </span>
                                    <span className="text-xs font-medium ml-auto text-slate-500">
                                        {star}+
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </FilterSection>

                <FilterSection
                    title="Guest rating"
                    isExpanded={expandedSections.score}
                    onToggle={() => toggleSection("score")}
                    active={!!filters.minRating}
                >
                    <div className="grid grid-cols-2 gap-1.5">
                        {[
                            { label: "9+", hint: "Wonderful", value: 90 },
                            { label: "8+", hint: "Very good", value: 80 },
                            { label: "7+", hint: "Good", value: 70 },
                            { label: "6+", hint: "Pleasant", value: 60 },
                        ].map((score) => {
                            const isSelected = filters.minRating === score.value
                            return (
                                <button
                                    key={score.value}
                                    type="button"
                                    onClick={() =>
                                        onFilterChange({
                                            ...filters,
                                            minRating: isSelected ? undefined : score.value,
                                        })
                                    }
                                    className={cn(
                                        "rounded-xl border px-2.5 py-2 text-left transition-all",
                                        isSelected
                                            ? "border-teal-500 bg-teal-50 dark:bg-teal-950/40 dark:border-teal-600"
                                            : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600",
                                    )}
                                >
                                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                        {score.label}
                                    </div>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                        {score.hint}
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </FilterSection>

                <FilterSection
                    title="Price range"
                    isExpanded={expandedSections.price}
                    onToggle={() => toggleSection("price")}
                    active={!!filters.minPrice || !!filters.maxPrice}
                >
                    <div className="flex gap-2">
                        <div className="flex-1 min-w-0">
                            <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">
                                Min
                            </label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={filters.minPrice || ""}
                                onChange={(e) => handlePriceChange("min", e.target.value)}
                                className="h-10 text-sm rounded-xl border-slate-200 dark:border-slate-600"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">
                                Max
                            </label>
                            <Input
                                type="number"
                                placeholder="Any"
                                value={filters.maxPrice || ""}
                                onChange={(e) => handlePriceChange("max", e.target.value)}
                                className="h-10 text-sm rounded-xl border-slate-200 dark:border-slate-600"
                            />
                        </div>
                    </div>
                    {(filters.minPrice || filters.maxPrice) && (
                        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                            ${filters.minPrice || 0} – ${filters.maxPrice || "∞"}
                        </p>
                    )}
                </FilterSection>
            </div>
        </div>
    )
}

interface FilterSectionProps {
    title: string
    isExpanded: boolean
    onToggle: () => void
    active: boolean
    children: React.ReactNode
}

const FilterSection: React.FC<FilterSectionProps> = ({
    title,
    isExpanded,
    onToggle,
    active,
    children,
}) => {
    return (
        <div className="px-4 py-3">
            <button
                type="button"
                onClick={onToggle}
                className="w-full flex items-center justify-between gap-2 mb-2.5 group"
            >
                <div className="flex items-center gap-2 min-w-0">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">
                        {title}
                    </h3>
                    {active ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-500 shrink-0" />
                    ) : null}
                </div>
                <ChevronDown
                    className={cn(
                        "w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0",
                        isExpanded && "rotate-180",
                    )}
                />
            </button>
            {isExpanded ? <div>{children}</div> : null}
        </div>
    )
}
