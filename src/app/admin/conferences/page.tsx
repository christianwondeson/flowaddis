"use client";

import React, { useState } from 'react';
import { Plus, Search, MoreVertical, MapPin, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { ConferenceForm } from '@/components/admin/forms/conference-form';
import { AdContainer } from '@/components/ads/ad-container';
import { AdConfig } from '@/lib/types/ads';

// Sample advertisement configurations for conferences page
const CONFERENCE_ADS_LEFT: AdConfig[] = [
    {
        id: 'hotel-ad-1',
        imageUrl: '/ads/hotel-ad-sample.png',
        altText: 'Luxury Stays in Addis Ababa',
        linkUrl: '/hotels',
        targetBlank: false
    },
    {
        id: 'partnership-opportunity',
        imageUrl: '/ads/partnership-ad.png',
        altText: 'Partnership Opportunities - Advertise Your Brand',
        linkUrl: '/contact',
        targetBlank: false
    }
];

const CONFERENCE_ADS_RIGHT: AdConfig[] = [
    {
        id: 'flight-ad-1',
        imageUrl: '/ads/flight-ad-sample.png',
        altText: 'Discover Ethiopia',
        linkUrl: '/flights',
        targetBlank: false
    },
    {
        id: 'partnership-opportunity-2',
        imageUrl: '/ads/partnership-ad.png',
        altText: 'Partnership Opportunities - Advertise Your Brand',
        linkUrl: '/contact',
        targetBlank: false
    }
];


export default function AdminConferencesPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Mock Data for Conferences
    const conferences = [
        { id: 1, name: 'African Tech Summit', location: 'Skylight Hotel', date: '2025-02-12', capacity: 500, status: 'Upcoming' },
        { id: 2, name: 'Startup Ethiopia', location: 'Science Museum', date: '2025-03-05', capacity: 1200, status: 'Upcoming' },
        { id: 3, name: 'Coffee Expo 2025', location: 'Millennium Hall', date: '2025-01-20', capacity: 3000, status: 'Active' },
        { id: 4, name: 'FinTech Forum', location: 'Sheraton Addis', date: '2024-12-15', capacity: 200, status: 'Past' },
    ];

    return (
        <AdContainer leftAds={CONFERENCE_ADS_LEFT} rightAds={CONFERENCE_ADS_RIGHT}>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Manage Conferences</h1>
                        <p className="text-gray-500">View and manage upcoming events and conferences.</p>
                    </div>
                    <Button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-brand-primary hover:bg-blue-700 text-white gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add New Conference
                    </Button>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input placeholder="Search conferences..." className="pl-10 bg-gray-50 border-transparent focus:bg-white" />
                    </div>
                    <select className="bg-gray-50 border-none text-sm font-medium text-gray-600 rounded-lg px-4 cursor-pointer hover:bg-gray-100 transition-colors">
                        <option>All Status</option>
                        <option>Upcoming</option>
                        <option>Active</option>
                        <option>Past</option>
                    </select>
                </div>

                {/* Conferences Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Event Name</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Capacity</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {conferences.map((conf) => (
                                <tr key={conf.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900">{conf.name}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                                            <MapPin className="w-3.5 h-3.5" />
                                            {conf.location}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1 text-gray-600 text-sm">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {conf.date}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1 text-gray-900 font-medium text-sm">
                                            <Users className="w-3.5 h-3.5 text-gray-400" />
                                            {conf.capacity}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${conf.status === 'Upcoming' ? 'bg-blue-100 text-blue-700' :
                                            conf.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                            {conf.status}
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
                    title="Add New Conference"
                >
                    <ConferenceForm onCancel={() => setIsModalOpen(false)} />
                </Modal>
            </div>
        </AdContainer>
    );
}
