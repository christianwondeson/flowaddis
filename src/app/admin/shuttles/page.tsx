"use client";

import React, { useState } from 'react';
import { Plus, Search, MoreVertical, MapPin, Clock, Bus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { ShuttleForm } from '@/components/admin/forms/shuttle-form';

export default function AdminShuttlesPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Mock Data for Shuttles
    const shuttles = [
        { id: 1, name: 'Airport Express', route: 'Bole Airport <-> Skylight Hotel', schedule: 'Every 30 mins', capacity: 14, status: 'Active' },
        { id: 2, name: 'City Center Loop', route: 'Piassa -> Bole -> Kazanchis', schedule: 'Every 1 hour', capacity: 24, status: 'Active' },
        { id: 3, name: 'Conference Shuttle', route: 'Hotels <-> Millennium Hall', schedule: 'Event Days Only', capacity: 40, status: 'Inactive' },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manage Shuttles</h1>
                    <p className="text-gray-500">View and manage shuttle services and routes.</p>
                </div>
                <Button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-brand-primary hover:bg-blue-700 text-white gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add New Shuttle
                </Button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input placeholder="Search shuttles..." className="pl-10 bg-gray-50 border-transparent focus:bg-white" />
                </div>
                <select className="bg-gray-50 border-none text-sm font-medium text-gray-600 rounded-lg px-4 cursor-pointer hover:bg-gray-100 transition-colors">
                    <option>All Status</option>
                    <option>Active</option>
                    <option>Inactive</option>
                    <option>Maintenance</option>
                </select>
            </div>

            {/* Shuttles Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Service Name</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Route</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Schedule</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Capacity</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {shuttles.map((shuttle) => (
                            <tr key={shuttle.id} className="hover:bg-gray-50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900">{shuttle.name}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                                        <MapPin className="w-3.5 h-3.5" />
                                        {shuttle.route}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1 text-gray-600 text-sm">
                                        <Clock className="w-3.5 h-3.5" />
                                        {shuttle.schedule}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1 text-gray-900 font-medium text-sm">
                                        <Bus className="w-3.5 h-3.5 text-gray-400" />
                                        {shuttle.capacity} Seats
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${shuttle.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                        {shuttle.status}
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
                title="Add New Shuttle"
            >
                <ShuttleForm onCancel={() => setIsModalOpen(false)} />
            </Modal>
        </div>
    );
}
