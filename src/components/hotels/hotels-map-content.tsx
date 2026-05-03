"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import nextDynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPinOff, RefreshCw, Loader2 } from "lucide-react";
import { PriceMarker, Hotel, HotelFilters as HotelFiltersType } from "@/types";
import { queryKeys } from "@/lib/react-query";
const LeafletMap = nextDynamic(() => import("@/components/map/leaflet-map").then((m) => m.LeafletMap), {
    ssr: false,
});
import { HotelList } from "@/components/hotels/hotel-list";
import { HotelFilters } from "@/components/hotels/hotel-filters";
import { useHotelsInfinite } from "@/hooks/use-hotels-infinite";
import { DEFAULT_HOTEL_DESTINATION_QUERY } from "@/lib/hotel-search-location";
import { destinationQueryFromUrlParams, buildHotelsListUrlAfterClosingMap } from "@/lib/hotel-search-url";

const MAP_PAGE_SIZE = 50; // API max per request

function buildHighlightHotelFromParamsKey(key: string): Hotel | null {
    const sp = new URLSearchParams(key);
    const highlightId = sp.get("highlightId");
    const lat = sp.get("lat");
    const lng = sp.get("lng");
    if (!highlightId || !lat || !lng) return null;
    const latN = Number(lat);
    const lngN = Number(lng);
    if (!Number.isFinite(latN) || !Number.isFinite(lngN)) return null;
    return {
        id: String(highlightId),
        name: sp.get("hotelName") || "Selected hotel",
        location: sp.get("query") || "Location",
        rating: 0,
        reviews: 0,
        reviewWord: "",
        price: 0,
        badges: [],
        distance: "",
        image:
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
        coordinates: { lat: latN, lng: lngN },
        amenities: [],
        description: "",
    };
}

function dedupeHotels(hotels: Hotel[]): Hotel[] {
    const map = new Map<string, Hotel>();
    for (const h of hotels) {
        const ex = map.get(h.id);
        if (!ex) {
            map.set(h.id, h);
            continue;
        }
        map.set(h.id, {
            ...ex,
            ...h,
            coordinates: h.coordinates ?? ex.coordinates,
        });
    }
    return Array.from(map.values());
}

export function HotelsMapContent() {
    const router = useRouter();
    const params = useSearchParams();
    const paramsKey = useMemo(() => params.toString(), [params]);
    const routeHighlightId = params.get("highlightId");

    const initialQuery = destinationQueryFromUrlParams(params);
    const initialCheckIn = params.get("checkIn") || "";
    const initialCheckOut = params.get("checkOut") || "";

    const [checkIn, setCheckIn] = useState<string | undefined>(initialCheckIn || undefined);
    const [checkOut, setCheckOut] = useState<string | undefined>(initialCheckOut || undefined);
    const [filters, setFilters] = useState<HotelFiltersType>({
        query: initialQuery,
        destId: params.get("destId") || undefined,
        destType: params.get("destType") || undefined,
        sortOrder: params.get("sortOrder") || "popularity",
        minPrice: params.get("minPrice") ? Number(params.get("minPrice")) : undefined,
        maxPrice: params.get("maxPrice") ? Number(params.get("maxPrice")) : undefined,
        minRating: params.get("minRating") ? Number(params.get("minRating")) : undefined,
        stars: params.get("stars")
            ? params
                  .get("stars")!
                  .split(",")
                  .filter(Boolean)
                  .map((s) => Number(s))
            : [],
        amenities: params.get("amenities") ? params.get("amenities")!.split(",").filter(Boolean) : [],
        hotelName: params.get("hotelName") || "",
    });

    const [hoveredId, setHoveredId] = useState<string | undefined>(undefined);
    const [viewMode, setViewMode] = useState<"list" | "map">("list");

    // URL is source of truth when query string changes (e.g. another hotel from detail)
    useEffect(() => {
        const q = destinationQueryFromUrlParams(params);
        const ci = params.get("checkIn") || "";
        const co = params.get("checkOut") || "";
        setCheckIn(ci || undefined);
        setCheckOut(co || undefined);
        setFilters({
            query: q,
            destId: params.get("destId") || undefined,
            destType: params.get("destType") || undefined,
            sortOrder: params.get("sortOrder") || "popularity",
            minPrice: params.get("minPrice") ? Number(params.get("minPrice")) : undefined,
            maxPrice: params.get("maxPrice") ? Number(params.get("maxPrice")) : undefined,
            minRating: params.get("minRating") ? Number(params.get("minRating")) : undefined,
            stars: params.get("stars")
                ? params
                      .get("stars")!
                      .split(",")
                      .filter(Boolean)
                      .map((s) => Number(s))
                : [],
            amenities: params.get("amenities") ? params.get("amenities")!.split(",").filter(Boolean) : [],
            hotelName: params.get("hotelName") || "",
        });
    }, [paramsKey, params]);

    const checkInDate = useMemo(() => (checkIn ? new Date(checkIn) : undefined), [checkIn]);
    const checkOutDate = useMemo(() => (checkOut ? new Date(checkOut) : undefined), [checkOut]);

    const mapSearchLat = useMemo(() => {
        const raw = params.get("lat") ?? params.get("latitude");
        if (raw == null || raw === "") return undefined;
        const n = Number(raw);
        return Number.isFinite(n) ? n : undefined;
    }, [paramsKey, params]);

    const mapSearchLng = useMemo(() => {
        const raw = params.get("lng") ?? params.get("longitude");
        if (raw == null || raw === "") return undefined;
        const n = Number(raw);
        return Number.isFinite(n) ? n : undefined;
    }, [paramsKey, params]);

    const queryClient = useQueryClient();
    const { data, isLoading, error, isFetching, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } = useHotelsInfinite(
        {
            query: filters.query || DEFAULT_HOTEL_DESTINATION_QUERY,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            filters,
            pageSize: MAP_PAGE_SIZE,
            latitude: mapSearchLat,
            longitude: mapSearchLng,
        },
        { staleTime: 0 },
    );

    // Flatten all pages and merge with highlighted hotel from URL
    const hotels = useMemo(() => {
        const pages = data?.pages ?? [];
        const flat = dedupeHotels(pages.flatMap((p) => p.hotels ?? []));
        const injected = buildHighlightHotelFromParamsKey(paramsKey);
        if (!injected) return flat;
        const i = flat.findIndex((h) => h.id === injected.id);
        if (i >= 0) {
            const cur = flat[i]!;
            flat[i] = { ...cur, coordinates: cur.coordinates ?? injected.coordinates };
            return flat;
        }
        return [injected, ...flat];
    }, [data?.pages, paramsKey]);

    // Sidebar / markers: optional property filter on the client (not on each API page — see search route).
    // Skip name narrowing when `highlightId` is set (detail → map) so slight title mismatches never hide the pin.
    const displayHotels = useMemo(() => {
        let list = hotels;
        const hn = filters.hotelName?.trim();
        if (hn && !routeHighlightId) {
            const l = hn.toLowerCase();
            list = list.filter((h) => h.name.toLowerCase().includes(l));
        }
        if (!routeHighlightId) return list;
        const idx = list.findIndex((h) => h.id === routeHighlightId);
        if (idx <= 0) return list;
        const copy = [...list];
        const [picked] = copy.splice(idx, 1);
        return [picked!, ...copy];
    }, [hotels, routeHighlightId, filters.hotelName]);

    // Scroll list so the routed hotel is visible
    useEffect(() => {
        if (!routeHighlightId || isLoading) return;
        const t = window.setTimeout(() => {
            document.getElementById(`map-hotel-${routeHighlightId}`)?.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }, 450);
        return () => window.clearTimeout(t);
    }, [routeHighlightId, displayHotels.length, isLoading, paramsKey]);

    const handleLoadMore = useCallback(() => {
        if (!isFetchingNextPage && hasNextPage) fetchNextPage();
    }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

    const handleFilterChange = useCallback((f: HotelFiltersType) => {
        setFilters((prev) => {
            const next: HotelFiltersType = {
                ...prev,
                ...f,
                query: f.query ?? prev.query,
                sortOrder: f.sortOrder ?? prev.sortOrder ?? "popularity",
                stars: f.stars ?? prev.stars ?? [],
                amenities: f.amenities ?? prev.amenities ?? [],
                hotelName: f.hotelName ?? prev.hotelName ?? "",
            };
            if (Object.prototype.hasOwnProperty.call(f, "destId")) {
                next.destId = f.destId ? f.destId : undefined;
                next.destType = f.destType ? f.destType : undefined;
            }
            return next;
        });
    }, []);

    const center = useMemo((): [number, number] => {
        const lat = params.get("lat");
        const lng = params.get("lng");
        if (lat && lng) {
            const la = parseFloat(lat);
            const ln = parseFloat(lng);
            if (Number.isFinite(la) && Number.isFinite(ln)) return [la, ln];
        }
        const first = displayHotels.find((h) => h.coordinates);
        if (first?.coordinates) return [first.coordinates.lat, first.coordinates.lng];
        return [9.0108, 38.7613];
    }, [params, displayHotels]);

    const markers: PriceMarker[] = useMemo(() => {
        return displayHotels
            .filter((h) => h.coordinates)
            .map((h) => ({
                id: h.id,
                name: h.name,
                price: h.price,
                lat: h.coordinates!.lat,
                lng: h.coordinates!.lng,
                image: h.image,
                isRouteSelected: routeHighlightId === h.id,
                isHovered: hoveredId === h.id,
            }));
    }, [displayHotels, routeHighlightId, hoveredId]);

    const hotelsWithoutCoords = displayHotels.filter((h) => !h.coordinates).length;
    const listInitialLoading = isLoading && hotels.length === 0;
    const totalCount = data?.pages?.[0]?.totalCount;

    const listFooter = (
        <>
            {isFetchingNextPage && (
                <div className="flex justify-center py-6 text-brand-primary gap-2 items-center text-sm font-semibold">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Loading more hotels…
                </div>
            )}
            {hasNextPage && !isFetchingNextPage && (
                <div className="flex justify-center py-6">
                    <Button
                        variant="outline"
                        onClick={handleLoadMore}
                        className="rounded-2xl px-10 py-3 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white transition-all duration-300 font-bold min-h-[48px]"
                    >
                        Load more results
                    </Button>
                </div>
            )}
            {!hasNextPage && hotels.length > 0 && (
                <p className="text-center text-xs text-gray-400 dark:text-slate-500 py-4">All hotels loaded for this search</p>
            )}
        </>
    );

    return (
        <div className="h-[calc(100vh-64px)] mt-16 overflow-hidden bg-brand-gray/30 dark:bg-background relative">
            <div className="flex h-full flex-col xl:flex-row">
                <div
                    className={`flex-1 min-w-0 h-full flex flex-col xl:flex-row transition-all duration-300 ${viewMode === "map" ? "hidden xl:flex" : "flex"}`}
                >
                    <div className="hidden xl:block xl:w-64 xl:shrink-0 xl:border-r xl:border-gray-100 dark:xl:border-slate-700 xl:bg-white dark:xl:bg-slate-900 xl:overflow-y-auto xl:scrollbar-hide">
                        <div className="p-4 border-b border-gray-100 dark:border-slate-700">
                            <h2 className="text-sm font-bold text-brand-dark dark:text-foreground">Filter</h2>
                        </div>
                        <HotelFilters
                            showMapPreview={false}
                            hotels={hotels}
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            checkIn={checkIn}
                            checkOut={checkOut}
                        />
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col border-r border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
                        <div className="p-4 md:p-6 border-b border-gray-100 dark:border-slate-700 shrink-0 space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <h1 className="text-xl font-bold text-brand-dark dark:text-foreground">Hotels on map</h1>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => queryClient.invalidateQueries({ queryKey: queryKeys.hotels.all })}
                                    disabled={isRefetching || listInitialLoading}
                                    className="shrink-0 rounded-lg gap-1.5"
                                >
                                    <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
                                    Refresh
                                </Button>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-slate-400">
                                {markers.length} on map
                                {totalCount != null ? ` · ${totalCount} total` : ""}
                                {hotelsWithoutCoords > 0 && (
                                    <span className="text-amber-600 font-medium">
                                        {" "}
                                        · {hotelsWithoutCoords} without coordinates
                                    </span>
                                )}
                            </p>
                            {hotelsWithoutCoords > 0 && (
                                <div className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/50 rounded-lg px-3 py-2">
                                    <MapPinOff className="w-4 h-4 shrink-0" />
                                    <span>Some hotels lack map pins from the provider.</span>
                                </div>
                            )}
                        </div>
                        <div className="grow overflow-y-auto scrollbar-hide">
                            <div className="xl:hidden border-b border-gray-100 dark:border-slate-700">
                                <HotelFilters
                                    showMapPreview={false}
                                    hotels={hotels}
                                    filters={filters}
                                    onFilterChange={handleFilterChange}
                                    checkIn={checkIn}
                                    checkOut={checkOut}
                                />
                            </div>
                            <div className="p-4 md:p-6 bg-brand-gray/20 dark:bg-slate-950/40">
                                <HotelList
                                    hotels={displayHotels}
                                    isLoading={listInitialLoading}
                                    error={error}
                                    onBook={(hotel) => router.push(`/hotels/${hotel.id}`)}
                                    onHoverStart={(id) => setHoveredId(id)}
                                    onHoverEnd={() => setHoveredId(undefined)}
                                    staySummary={checkIn && checkOut ? `${checkIn} - ${checkOut}` : undefined}
                                    featuredHotelId={routeHighlightId}
                                    listFooter={listFooter}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    className={`flex-1 min-w-0 h-full relative bg-brand-gray/20 dark:bg-slate-950/40 p-0 xl:p-6 transition-all duration-300 ${viewMode === "list" ? "hidden xl:block" : "block"}`}
                >
                    <div className="w-full h-full lg:rounded-2xl overflow-hidden shadow-inner border-0 lg:border border-gray-200 dark:lg:border-slate-700 relative">
                        <LeafletMap
                            center={center}
                            markers={markers}
                            hoveredId={hoveredId}
                            routeSelectedId={routeHighlightId}
                            fitToMarkers={!routeHighlightId && markers.length > 0}
                            scrollWheelZoom
                            height="100%"
                            className="w-full h-full"
                        />

                        {/* Back / Close Button - visible on mobile and desktop */}
                        <button
                            onClick={() => {
                                router.push(buildHotelsListUrlAfterClosingMap(new URLSearchParams(params.toString())));
                            }}
                            className="absolute top-4 left-4 right-auto lg:left-auto lg:right-4 z-[1000] bg-white dark:bg-slate-900 text-brand-dark dark:text-foreground p-2.5 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-all border border-gray-200 dark:border-slate-700 flex items-center gap-2"
                            title="Back to hotels list"
                        >
                            <ArrowLeft className="w-5 h-5 lg:hidden" />
                            <span className="text-sm font-semibold lg:hidden">Back</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="hidden lg:block">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>

                        {hotels.length > 0 && markers.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-slate-900/95 z-[500] rounded-2xl">
                                <div className="text-center px-6 py-8 max-w-sm">
                                    <MapPinOff className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                                    <p className="font-bold text-brand-dark dark:text-foreground mb-1">No location data</p>
                                    <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                                        None of these hotels have coordinates yet.
                                    </p>
                                    <Button
                                        variant="outline"
                                        onClick={() => queryClient.invalidateQueries({ queryKey: queryKeys.hotels.all })}
                                        disabled={isRefetching}
                                        className="rounded-lg gap-2"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
                                        Refresh
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="lg:hidden fixed bottom-8 left-1/2 -translate-x-1/2 z-[1001]">
                <Button
                    onClick={() => setViewMode(viewMode === "list" ? "map" : "list")}
                    className="rounded-2xl shadow-2xl px-6 py-4 bg-brand-primary text-white hover:bg-brand-primary/90 flex items-center gap-2 border-2 border-white/20 backdrop-blur-sm min-h-[48px]"
                >
                    {viewMode === "list" ? (
                        <>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                                <line x1="8" y1="2" x2="8" y2="18"></line>
                                <line x1="16" y1="6" x2="16" y2="22"></line>
                            </svg>
                            Show map
                        </>
                    ) : (
                        <>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <line x1="8" y1="6" x2="21" y2="6"></line>
                                <line x1="8" y1="12" x2="21" y2="12"></line>
                                <line x1="8" y1="18" x2="21" y2="18"></line>
                                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                                <line x1="3" y1="18" x2="3.01" y2="18"></line>
                            </svg>
                            Show list
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
