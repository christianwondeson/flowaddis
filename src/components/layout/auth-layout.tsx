"use client"

import type React from "react"
import { Logo } from "@/components/shared/logo"
import Link from "next/link"

interface AuthLayoutProps {
    title: string
    subtitle?: string
    children: React.ReactNode
    footerLink?: {
        text: string
        href: string
        linkText: string
    }
}

export function AuthLayout({ title, subtitle, children, footerLink }: AuthLayoutProps) {
    return (
        <div className="min-h-screen bg-brand-gray/30 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center mb-6">
                    <Logo size="lg" />
                </div>
                <h2 className="text-center text-3xl font-extrabold text-brand-dark tracking-tight">{title}</h2>
                {subtitle && <p className="mt-2 text-center text-sm text-gray-600">{subtitle}</p>}
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 sm:px-10 shadow-lg rounded-2xl border border-gray-100">
                    {children}

                    {footerLink && (
                        <div className="mt-6">
                            <div className="relative">
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-gray-500">
                                        {footerLink.text}{" "}
                                        <Link href={footerLink.href} className="font-medium text-brand-primary hover:text-brand-dark">
                                            {footerLink.linkText}
                                        </Link>
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
