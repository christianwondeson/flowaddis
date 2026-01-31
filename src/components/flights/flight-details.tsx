import React from 'react';
import { Plane, Clock, Calendar, Luggage, ArrowRight, Backpack, Briefcase, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface FlightDetailsProps {
    detail: any;
}

export function FlightDetails({ detail }: FlightDetailsProps) {
    if (!detail) return null;

    const segments = detail.segments || [];
    const brandedFare = detail.brandedFareInfo;

    const formatTime = (dateStr: string) => {
        try {
            return format(new Date(dateStr), 'HH:mm');
        } catch (e) {
            return dateStr?.split('T')[1]?.slice(0, 5) || '';
        }
    };

    const formatDate = (dateStr: string) => {
        try {
            return format(new Date(dateStr), 'EEE, d MMM yyyy');
        } catch (e) {
            return dateStr?.split('T')[0] || '';
        }
    };

    const getDuration = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}h ${m}m`;
    };

    // Calculate layover time between two legs
    const getLayover = (leg1: any, leg2: any) => {
        const arrival = new Date(leg1.arrivalTime).getTime();
        const departure = new Date(leg2.departureTime).getTime();
        const diffMinutes = Math.floor((departure - arrival) / (1000 * 60));
        return getDuration(diffMinutes);
    };

    return (
        <div className="space-y-8">
            {/* Flight Segments */}
            <div className="space-y-6">
                {segments.map((segment: any, segIdx: number) => (
                    <div key={segIdx} className="relative">
                        {/* Segment Header */}
                        <div className="flex items-center gap-3 mb-4 sticky top-0 bg-white z-10 py-2 border-b border-gray-100">
                            <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center">
                                <span className="text-brand-primary font-bold text-xs">{segIdx === 0 ? '1' : '2'}</span>
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                    {segment.departureAirport.city} <ArrowRight className="w-4 h-4 text-gray-400" /> {segment.arrivalAirport.city}
                                </h3>
                                <div className="text-xs text-gray-500">
                                    {formatDate(segment.departureTime)} • {getDuration(segment.totalTime)}
                                </div>
                            </div>
                        </div>

                        {/* Legs */}
                        <div className="pl-4 space-y-6">
                            {segment.legs.map((leg: any, legIdx: number) => {
                                const airline = leg.carriersData?.[0];
                                const isLastLeg = legIdx === segment.legs.length - 1;

                                return (
                                    <div key={legIdx}>
                                        <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden relative">
                                            {/* Carrier Ribbon */}
                                            <div className="h-1.5 w-full bg-brand-primary/10" />

                                            <div className="p-5">
                                                {/* Airline Header */}
                                                <div className="flex items-center justify-between mb-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-white rounded-lg p-1 border border-gray-100 shadow-sm flex items-center justify-center">
                                                            {airline?.logo ? (
                                                                <img src={airline.logo} alt={airline.name} className="max-w-full max-h-full object-contain" />
                                                            ) : (
                                                                <Plane className="w-5 h-5 text-gray-400" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-gray-900 text-sm">{airline?.name || leg.carriers[0]}</div>
                                                            <div className="text-xs text-gray-500 flex items-center gap-1.5">
                                                                <span>Flight {leg.flightInfo.flightNumber}</span>
                                                                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                                                <span>{leg.planeType ? `Airbus ${leg.planeType}` : 'Aircraft'}</span>
                                                                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                                                <span className="text-brand-primary font-medium">{leg.cabinClass}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Flight Times */}
                                                <div className="flex items-start justify-between gap-4">
                                                    {/* Departure */}
                                                    <div className="flex-1">
                                                        <div className="text-2xl font-black text-gray-900 leading-none mb-1">{formatTime(leg.departureTime)}</div>
                                                        <div className="text-sm font-bold text-gray-700 mb-0.5">{leg.departureAirport.code}</div>
                                                        <div className="text-xs text-gray-500 leading-snug">{leg.departureAirport.name}</div>
                                                    </div>

                                                    {/* Duration & Visual */}
                                                    <div className="flex flex-col items-center justify-center px-4 pt-1 w-24">
                                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{getDuration(leg.totalTime)}</div>
                                                        <div className="w-full h-[2px] bg-gray-200 relative">
                                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2 h-2 rounded-full border-2 border-gray-200 bg-white" />
                                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-gray-300" />
                                                            <Plane className="w-4 h-4 text-brand-primary absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90 bg-gray-50" />
                                                        </div>
                                                    </div>

                                                    {/* Arrival */}
                                                    <div className="flex-1 text-right">
                                                        <div className="text-2xl font-black text-gray-900 leading-none mb-1">{formatTime(leg.arrivalTime)}</div>
                                                        <div className="text-sm font-bold text-gray-700 mb-0.5">{leg.arrivalAirport.code}</div>
                                                        <div className="text-xs text-gray-500 leading-snug">{leg.arrivalAirport.name}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Layover */}
                                        {!isLastLeg && (
                                            <div className="flex items-center gap-3 py-6 px-4">
                                                <div className="h-16 w-[2px] bg-dashed bg-gradient-to-b from-transparent via-gray-300 to-transparent mx-auto opacity-50 absolute left-[31px]"></div>
                                                <div className="flex-1 text-center py-2 bg-yellow-50 border border-yellow-100 rounded-xl text-yellow-700 text-xs font-bold flex items-center justify-center gap-2">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {getLayover(leg, segment.legs[legIdx + 1])} layover in {leg.arrivalAirport.cityName}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Included Amenities (Baggage) */}
            {brandedFare && brandedFare.features && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-1 h-5 bg-brand-primary rounded-full"></span>
                        Included in {brandedFare.fareName}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {brandedFare.features.map((feature: any, idx: number) => (
                            <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl border ${feature.availability === 'INCLUDED' ? 'bg-green-50/50 border-green-100' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${feature.availability === 'INCLUDED' ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                                    {feature.category === 'BAGGAGE' ? (
                                        feature.code === 'BK03' ? <Backpack className="w-4 h-4" /> : <Luggage className="w-4 h-4" />
                                    ) : feature.category === 'SEATS' ? (
                                        <Plane className="w-4 h-4" />
                                    ) : (
                                        <CheckCircle2 className="w-4 h-4" />
                                    )}
                                </div>
                                <div>
                                    <div className={`text-sm font-bold ${feature.availability === 'INCLUDED' ? 'text-gray-900' : 'text-gray-500'}`}>
                                        {feature.label}
                                    </div>
                                    <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wide mt-0.5">
                                        {feature.availability === 'INCLUDED' ? 'Included' : 'Not Included'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
