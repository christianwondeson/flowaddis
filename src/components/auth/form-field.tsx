"use client"

import type React from "react"

interface FormFieldProps {
    label: string
    description?: string
    error?: string
    children: React.ReactNode
}

export function FormField({ label, description, error, children }: FormFieldProps) {
    return (
        <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            {description && <p className="text-[10px] text-gray-400 -mt-1">{description}</p>}
            {children}
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    )
}
