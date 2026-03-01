"use client";

import React, { useState } from 'react';
import { Plus, Search, MoreVertical, Plane, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { FlightForm } from '@/components/admin/forms/flight-form';

export default function AdminFlightsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Mock Data for Flights
    const flights = [
        { id: 1, airline: 'Ethiopian Airlines', flightNumber: 'ET 500', route: 'ADD -> JFK', date: '2025-01-15', price: 1200, status: 'Scheduled' },
        { id: 2, airline: 'Ethiopian Airlines', flightNumber: 'ET 302', route: 'ADD -> NBO', date: '2025-01-16', price: 350, status: 'Scheduled' },
        { id: 3, airline: 'Emirates', flightNumber: 'EK 723', route: 'DXB -> ADD', date: '2025-01-17', price: 800, status: 'Delayed' },
        { id: 4, airline: 'Lufthansa', flightNumber: 'LH 599', route: 'ADD -> FRA', date: '2025-01-18', price: 950, status: 'Scheduled' },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manage Flights</h1>
                    <p className="text-gray-500">View and manage flight schedules and inventory.</p>
                </div>
                <Button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-brand-primary hover:bg-teal-700 text-white gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add New Flight
                </Button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input placeholder="Search flights..." className="pl-10 bg-gray-50 border-transparent focus:bg-white" />
                </div>
                <select className="bg-gray-50 border-none text-sm font-medium text-gray-600 rounded-lg px-4 cursor-pointer hover:bg-gray-100 transition-colors">
                    <option>All Status</option>
                    <option>Scheduled</option>
                    <option>Delayed</option>
                    <option>Cancelled</option>
                </select>
            </div>

            {/* Flights Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Airline & Flight</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Route</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {flights.map((flight) => (
                            <tr key={flight.id} className="hover:bg-gray-50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900">{flight.airline}</div>
                                    <div className="text-xs text-gray-400">{flight.flightNumber}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                                        <Plane className="w-3.5 h-3.5" />
                                        {flight.route}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1 text-gray-600 text-sm">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {flight.date}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-gray-900 font-medium text-sm">${flight.price}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${flight.status === 'Scheduled' ? 'bg-green-100 text-green-700' :
                                            flight.status === 'Delayed' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                                        } `}>
                                        {flight.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Add New Flight"
            >
                <FlightForm onCancel={() => setIsModalOpen(false)} />
            </Modal>
        </div>
    );
}
