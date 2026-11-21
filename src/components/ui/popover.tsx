"use client";

import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import { createPortal } from 'react-dom';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

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
    const setIsOpen = useCallback((open: boolean) => {
        if (onOpenChange) onOpenChange(open);
        setInternalIsOpen(open);
    }, [onOpenChange]);

    const wrapperRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);
    const [currentPlacement, setCurrentPlacement] = useState<'top' | 'bottom'>('bottom');

    const calculatePosition = useCallback((triggerEl: HTMLElement | null, contentEl: HTMLElement | null) => {
        if (!triggerEl) return null;
        const rect = triggerEl.getBoundingClientRect();
        const contentWidth = contentEl?.offsetWidth || 280;
        let left: number;
        if (align === 'right') {
            left = rect.right - contentWidth;
        } else if (align === 'center') {
            left = rect.left + rect.width / 2 - contentWidth / 2;
        } else {
            left = rect.left;
        }

        const contentH = contentEl?.offsetHeight || 320;
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        let place: 'top' | 'bottom' = 'bottom';
        if (placement === 'top') place = 'top';
        else if (placement === 'bottom') place = 'bottom';
        else {
            place = spaceBelow >= contentH + 12 || spaceBelow >= spaceAbove ? 'bottom' : 'top';
        }

        const top = place === 'bottom' ? rect.bottom + 8 : Math.max(8, rect.top - contentH - 8);
        const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
        const clampedLeft = Math.max(8, Math.min(left, viewportWidth - contentWidth - 8));
        return { top, left: clampedLeft, width: rect.width, placement: place };
    }, [align, placement]);

    useIsomorphicLayoutEffect(() => {
        if (isOpen && triggerRef.current) {
            const pos = calculatePosition(triggerRef.current, contentRef.current);
            if (pos) {
                setCoords({ top: pos.top, left: pos.left, width: pos.width });
                setCurrentPlacement(pos.placement);
            }
        }
    }, [isOpen, calculatePosition]);

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const inTrigger = wrapperRef.current && wrapperRef.current.contains(target);
            const inContent = contentRef.current && contentRef.current.contains(target);
            if (!inTrigger && !inContent) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, setIsOpen]);

    useEffect(() => {
        if (!isOpen) return;
        let rAF: number | null = null;
        const update = () => {
            if (!triggerRef.current) return;
            const pos = calculatePosition(triggerRef.current, contentRef.current);
            if (pos) {
                setCoords({ top: pos.top, left: pos.left, width: pos.width });
                setCurrentPlacement(pos.placement);
            }
        };

        const onScrollOrResize = () => {
            if (rAF !== null) return;
            rAF = requestAnimationFrame(() => {
                update();
                rAF = null;
            });
        };

        window.addEventListener('scroll', onScrollOrResize, { passive: true, capture: true });
        window.addEventListener('resize', onScrollOrResize, { passive: true });

        return () => {
            if (rAF !== null) cancelAnimationFrame(rAF);
            window.removeEventListener('scroll', onScrollOrResize, true);
            window.removeEventListener('resize', onScrollOrResize);
        };
    }, [isOpen, calculatePosition]);

    const handleTriggerClick = () => {
        const next = !isOpen;
        if (next && triggerRef.current) {
            const pos = calculatePosition(triggerRef.current, contentRef.current);
            if (pos) {
                setCoords({ top: pos.top, left: pos.left, width: pos.width });
                setCurrentPlacement(pos.placement);
            }
        }
        setIsOpen(next);
    };

    const popoverContent = isOpen && (
        <div
            className={clsx(
                "bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-700 p-4 min-w-[240px] z-[10005] animate-in fade-in zoom-in-95 duration-150",
                className
            )}
            style={portal && coords ? {
                position: 'fixed',
                top: coords.top,
                left: coords.left,
            } as React.CSSProperties : portal && !coords ? {
                position: 'fixed',
                opacity: 0,
                pointerEvents: 'none',
                top: 0,
                left: 0,
            } as React.CSSProperties : undefined}
            ref={contentRef}
        >
            {content}
        </div>
    );

    return (
        <div className="relative" ref={wrapperRef}>
            <div ref={triggerRef} onClick={handleTriggerClick} className="cursor-pointer">
                {trigger}
            </div>
            {isOpen && (
                portal
                    ? (typeof document !== 'undefined' ? createPortal(popoverContent, document.body) : null)
                    : (
                        <div className={clsx("absolute z-[10005]", currentPlacement === 'bottom' ? 'mt-2' : 'mb-2', align === 'right' ? 'right-0' : 'left-0')}>
                            {popoverContent}
                        </div>
                    )
            )}
        </div>
    );
};
