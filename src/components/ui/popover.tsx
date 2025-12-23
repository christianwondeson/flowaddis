"use client";

import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { createPortal } from 'react-dom';

interface PopoverProps {
    trigger: React.ReactNode;
    content: React.ReactNode;
    className?: string;
    align?: 'left' | 'right' | 'center';
    portal?: boolean; // render in portal to escape overflow clipping
    placement?: 'auto' | 'bottom' | 'top';
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export const Popover: React.FC<PopoverProps> = ({
    trigger,
    content,
    className,
    align = 'left',
    portal = true,
    placement = 'auto',
    isOpen: externalIsOpen,
    onOpenChange
}) => {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
    const setIsOpen = (open: boolean) => {
        if (onOpenChange) onOpenChange(open);
        setInternalIsOpen(open);
    };
    const wrapperRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);
    const [currentPlacement, setCurrentPlacement] = useState<'top' | 'bottom'>('bottom');

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const inTrigger = wrapperRef.current && wrapperRef.current.contains(target);
            const inContent = contentRef.current && contentRef.current.contains(target);
            if (!inTrigger && !inContent) {
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

    useEffect(() => {
        const updatePosition = () => {
            if (!triggerRef.current) return;
            const rect = triggerRef.current.getBoundingClientRect();
            const contentWidth = contentRef.current?.offsetWidth || 240;
            let left: number;
            if (align === 'right') {
                left = rect.right - contentWidth;
            } else if (align === 'center') {
                left = rect.left + rect.width / 2 - contentWidth / 2;
            } else {
                left = rect.left;
            }
            // Measure content height if available, else assume 320px (calendar size)
            const contentH = contentRef.current?.offsetHeight || 320;
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            let place: 'top' | 'bottom' = 'bottom';
            if (placement === 'top') place = 'top';
            else if (placement === 'bottom') place = 'bottom';
            else {
                // auto
                place = spaceBelow >= contentH + 12 || spaceBelow >= spaceAbove ? 'bottom' : 'top';
            }
            setCurrentPlacement(place);
            const top = place === 'bottom' ? rect.bottom + 8 : Math.max(8, rect.top - contentH - 8);

            // Clamp within viewport horizontally
            const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
            const clampedLeft = Math.max(8, Math.min(left, viewportWidth - contentWidth - 8));
            setCoords({ top, left: clampedLeft, width: rect.width });
        };
        if (isOpen) {
            updatePosition();
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
        }
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen, align]);

    const popoverContent = isOpen && (
        <div
            className={clsx(
                "bg-white rounded-xl shadow-2xl border border-gray-100 p-4 min-w-[240px] z-[10005]",
                className
            )}
            style={portal && coords ? {
                position: 'fixed',
                top: coords.top,
                left: coords.left,
            } as React.CSSProperties : undefined}
            ref={contentRef}
        >
            {content}
        </div>
    );

    return (
        <div className="relative" ref={wrapperRef}>
            <div ref={triggerRef} onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
                {trigger}
            </div>
            {isOpen && (
                portal && coords
                    ? createPortal(popoverContent, document.body)
                    : (
                        <div className={clsx("absolute z-[10005]", currentPlacement === 'bottom' ? 'mt-2' : 'mb-2', align === 'right' ? 'right-0' : 'left-0')}>
                            {popoverContent}
                        </div>
                    )
            )}
        </div>
    );
};
