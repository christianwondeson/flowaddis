"use client";

import React from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Bell, Lock, Moon, Globe } from 'lucide-react';

export default function SettingsPage() {
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
            <div className="min-h-screen pt-16 md:pt-20 pb-16 container mx-auto px-4 sm:px-6 lg:px-6 text-center bg-brand-gray/30">
                <h1 className="text-2xl font-bold mb-4">Please sign in to access settings</h1>
                <Button onClick={() => window.location.href = '/signin'}>Sign In</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-16 md:pt-20 pb-16 md:pb-20 bg-brand-gray/30">
            <div className="container mx-auto px-4 sm:px-6 lg:px-6 max-w-3xl">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
                        <p className="text-gray-500">Manage your preferences and account security</p>
                    </div>

                    <div className="p-6 space-y-8">
                        {/* Notifications */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                                <Bell className="w-5 h-5 text-brand-primary" />
                                <h2>Notifications</h2>
                            </div>
                            <div className="space-y-4 pl-7">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Email Notifications</Label>
                                        <p className="text-sm text-gray-500">Receive emails about your bookings</p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Marketing Emails</Label>
                                        <p className="text-sm text-gray-500">Receive offers and promotions</p>
                                    </div>
                                    <Switch />
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-100" />

                        {/* Appearance */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                                <Moon className="w-5 h-5 text-brand-primary" />
                                <h2>Appearance</h2>
                            </div>
                            <div className="space-y-4 pl-7">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Dark Mode</Label>
                                        <p className="text-sm text-gray-500">Toggle dark mode theme</p>
                                    </div>
                                    <Switch disabled />
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-100" />

                        {/* Language */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                                <Globe className="w-5 h-5 text-brand-primary" />
                                <h2>Language & Region</h2>
                            </div>
                            <div className="space-y-4 pl-7">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Language</Label>
                                        <p className="text-sm text-gray-500">English (US)</p>
                                    </div>
                                    <Button variant="outline" size="sm">Change</Button>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-100" />

                        {/* Security */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                                <Lock className="w-5 h-5 text-brand-primary" />
                                <h2>Security</h2>
                            </div>
                            <div className="space-y-4 pl-7">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Password</Label>
                                        <p className="text-sm text-gray-500">Last changed 3 months ago</p>
                                    </div>
                                    <Button variant="outline" size="sm">Change Password</Button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Two-Factor Authentication</Label>
                                        <p className="text-sm text-gray-500">Add an extra layer of security</p>
                                    </div>
                                    <Button variant="outline" size="sm">Enable</Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-6 border-t border-gray-100 flex justify-end gap-3">
                        <Button variant="outline">Cancel</Button>
                        <Button>Save Changes</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
