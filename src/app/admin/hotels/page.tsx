"use client";

import React, { useState } from 'react';
import { Plus, Search, MoreVertical, MapPin, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { HotelForm } from '@/components/admin/forms/hotel-form';

export default function AdminHotelsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Mock Data for Hotels
    const hotels = [
        { id: 1, name: 'Skylight Hotel', location: 'Bole, Addis Ababa', rating: 4.8, price: 150, status: 'Active' },
        { id: 2, name: 'Sheraton Addis', location: 'Kirkos, Addis Ababa', rating: 4.9, price: 280, status: 'Active' },
        { id: 3, name: 'Hilton Addis Ababa', location: 'Menelik II Ave', rating: 4.5, price: 120, status: 'Maintenance' },
        { id: 4, name: 'Radisson Blu', location: 'Kazanchis', rating: 4.7, price: 190, status: 'Active' },
        { id: 5, name: 'Hyatt Regency', location: 'Meskel Square', rating: 4.8, price: 210, status: 'Active' },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manage Hotels</h1>
                    <p className="text-gray-500">View and manage your hotel inventory.</p>
                </div>
                <Button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-brand-primary hover:bg-teal-700 text-white gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add New Hotel
                </Button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input placeholder="Search hotels..." className="pl-10 bg-gray-50 border-transparent focus:bg-white" />
                </div>
                <select className="bg-gray-50 border-none text-sm font-medium text-gray-600 rounded-lg px-4 cursor-pointer hover:bg-gray-100 transition-colors">
                    <option>All Status</option>
                    <option>Active</option>
                    <option>Maintenance</option>
                </select>
            </div>

            {/* Hotels Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Hotel Name</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Rating</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Price / Night</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {hotels.map((hotel) => (
                            <tr key={hotel.id} className="hover:bg-gray-50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900">{hotel.name}</div>
                                    <div className="text-xs text-gray-400">ID: #{hotel.id}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                                        <MapPin className="w-3.5 h-3.5" />
                                        {hotel.location}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1 text-gray-900 font-bold text-sm">
                                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                        {hotel.rating}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-gray-900 font-medium text-sm">${hotel.price}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${hotel.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                        }`}>
                                        {hotel.status}
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
                title="Add New Hotel"
            >
                <HotelForm onCancel={() => setIsModalOpen(false)} />
            </Modal>
        </div>
    );
}
