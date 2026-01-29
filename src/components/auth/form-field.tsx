"use client"

import type React from "react"

interface FormFieldProps {
    label: string
    error?: string
    children: React.ReactNode
}

export function FormField({ label, error, children }: FormFieldProps) {
    return (
        <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            {children}
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    )
}
