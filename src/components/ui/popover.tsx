"use client";

import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';

interface PopoverProps {
    trigger: React.ReactNode;
    content: React.ReactNode;
    className?: string;
    align?: 'left' | 'right';
}

export const Popover: React.FC<PopoverProps> = ({ trigger, content, className, align = 'left' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative" ref={popoverRef}>
            <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
                {trigger}
            </div>
            {isOpen && (
                <div
                    className={clsx(
                        "absolute z-50 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 p-4 min-w-[200px]",
                        align === 'right' ? 'right-0' : 'left-0',
                        className
                    )}
                >
                    {content}
                </div>
            )}
        </div>
    );
};
