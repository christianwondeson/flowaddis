"use client";

import React from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Shield, Calendar } from 'lucide-react';

export default function ProfilePage() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen pt-16 md:pt-20 pb-16 flex items-center justify-center bg-brand-gray/30">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen pt-24 pb-12 container mx-auto px-4 text-center">
                <h1 className="text-2xl font-bold mb-4">Please sign in to view your profile</h1>
                <Button onClick={() => window.location.href = '/signin'}>Sign In</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-16 md:pt-20 pb-16 md:pb-20 bg-brand-gray/30">
            <div className="container mx-auto px-4 sm:px-6 lg:px-6 max-w-3xl">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="bg-brand-primary/5 p-6 border-b border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="h-20 w-20 rounded-full bg-brand-primary/10 flex items-center justify-center border-2 border-white shadow-sm">
                                <span className="text-3xl font-bold text-brand-primary">
                                    {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                                <p className="text-gray-500">{user.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-gray-500">Full Name</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="name"
                                        value={user.name || ''}
                                        readOnly
                                        className="pl-10 bg-gray-50 border-gray-200"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-gray-500">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="email"
                                        value={user.email}
                                        readOnly
                                        className="pl-10 bg-gray-50 border-gray-200"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role" className="text-gray-500">Account Role</Label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="role"
                                        value={user.role === 'admin' ? 'Administrator' : 'Standard User'}
                                        readOnly
                                        className="pl-10 bg-gray-50 border-gray-200 capitalize"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="joined" className="text-gray-500">Member Since</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="joined"
                                        value={user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString() : 'Recently'}
                                        readOnly
                                        className="pl-10 bg-gray-50 border-gray-200"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-100 flex justify-end">
                            <Button variant="outline" className="mr-2">Edit Profile</Button>
                            <Button variant="destructive">Delete Account</Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
