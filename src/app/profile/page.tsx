"use client";

import React from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Shield, Calendar } from "lucide-react";

export default function ProfilePage() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen pt-16 md:pt-20 pb-16 flex items-center justify-center bg-brand-gray/30 dark:bg-background">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen pt-24 pb-12 container mx-auto px-4 text-center bg-background">
                <h1 className="text-2xl font-bold mb-4 text-foreground">Please sign in to view your profile</h1>
                <Button onClick={() => (window.location.href = "/signin")}>Sign In</Button>
            </div>
        );
    }

    const inputReadOnlyClass =
        "pl-10 bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-600 text-foreground";

    return (
        <div className="min-h-screen pt-16 md:pt-20 pb-16 md:pb-20 bg-brand-gray/30 dark:bg-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-6 max-w-3xl">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <div className="bg-brand-primary/5 dark:bg-brand-primary/10 p-6 border-b border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-4">
                            <div className="h-20 w-20 rounded-full bg-brand-primary/10 dark:bg-brand-primary/20 flex items-center justify-center border-2 border-white dark:border-slate-700 shadow-sm">
                                <span className="text-3xl font-bold text-brand-primary">
                                    {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
                                <p className="text-slate-500 dark:text-slate-400">{user.email}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-slate-600 dark:text-slate-300">
                                    Full Name
                                </Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                                    <Input
                                        id="name"
                                        value={user.name || ""}
                                        readOnly
                                        className={inputReadOnlyClass}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-600 dark:text-slate-300">
                                    Email Address
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                                    <Input id="email" value={user.email} readOnly className={inputReadOnlyClass} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role" className="text-slate-600 dark:text-slate-300">
                                    Account Role
                                </Label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                                    <Input
                                        id="role"
                                        value={user.role === "admin" ? "Administrator" : "Standard User"}
                                        readOnly
                                        className={`${inputReadOnlyClass} capitalize`}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="joined" className="text-slate-600 dark:text-slate-300">
                                    Member Since
                                </Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                                    <Input
                                        id="joined"
                                        value={
                                            user.createdAt?.toDate
                                                ? user.createdAt.toDate().toLocaleDateString()
                                                : "Recently"
                                        }
                                        readOnly
                                        className={inputReadOnlyClass}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-end gap-2">
                            <Button variant="outline" className="dark:border-slate-600 dark:hover:bg-slate-800">
                                Edit Profile
                            </Button>
                            <Button variant="destructive">Delete Account</Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
