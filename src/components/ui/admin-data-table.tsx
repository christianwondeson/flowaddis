'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AdminLoader, EmptyValue } from '@/components/ui/admin-loader';
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Columns3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type AdminColumn<T> = {
    id: string;
    header: string;
    className?: string;
    align?: 'left' | 'right' | 'center';
    /** Hide from the default visible set (still toggleable). */
    defaultHidden?: boolean;
    /** Never hide (e.g. guest name). */
    alwaysVisible?: boolean;
    cell: (row: T) => React.ReactNode;
};

type Props<T> = {
    columns: AdminColumn<T>[];
    rows: T[];
    rowKey: (row: T) => string;
    loading?: boolean;
    loadingLabel?: string;
    emptyLabel?: string;
    /** 1-based page */
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    className?: string;
    /** Sticky header like rates calendar */
    stickyHeader?: boolean;
    /** Open detail when a row is clicked (ignored when clicking expand control). */
    onRowClick?: (row: T) => void;
    /** Inline expand panel under the row (Booking.com-style). */
    renderExpanded?: (row: T) => React.ReactNode;
    /** Persist column visibility under this key (localStorage). */
    columnPrefsKey?: string;
    /** Minimum table width for horizontal scroll on dense grids. */
    minTableWidth?: number;
};

/**
 * Shared admin / hotel-portal table: wide layout, sticky header,
 * expandable rows, and column show/hide.
 */
export function AdminDataTable<T>({
    columns,
    rows,
    rowKey,
    loading,
    loadingLabel = 'Loading…',
    emptyLabel = 'No records found',
    page,
    pageSize,
    total,
    onPageChange,
    className,
    stickyHeader = true,
    onRowClick,
    renderExpanded,
    columnPrefsKey,
    minTableWidth = 1100,
}: Props<T>) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const to = Math.min(total, page * pageSize);

    const defaultVisible = useMemo(() => {
        const ids = new Set<string>();
        for (const c of columns) {
            if (!c.defaultHidden || c.alwaysVisible) ids.add(c.id);
        }
        return ids;
    }, [columns]);

    const [visibleIds, setVisibleIds] = useState<Set<string>>(defaultVisible);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!columnPrefsKey || typeof window === 'undefined') {
            setVisibleIds(defaultVisible);
            return;
        }
        try {
            const raw = window.localStorage.getItem(
                `admin-table-cols:${columnPrefsKey}`,
            );
            if (!raw) {
                setVisibleIds(defaultVisible);
                return;
            }
            const parsed = JSON.parse(raw) as string[];
            if (!Array.isArray(parsed) || parsed.length === 0) {
                setVisibleIds(defaultVisible);
                return;
            }
            const next = new Set(parsed.filter((id) => columns.some((c) => c.id === id)));
            for (const c of columns) {
                if (c.alwaysVisible) next.add(c.id);
            }
            if (next.size === 0) setVisibleIds(defaultVisible);
            else setVisibleIds(next);
        } catch {
            setVisibleIds(defaultVisible);
        }
    }, [columnPrefsKey, columns, defaultVisible]);

    const persistVisible = (next: Set<string>) => {
        setVisibleIds(next);
        if (!columnPrefsKey || typeof window === 'undefined') return;
        window.localStorage.setItem(
            `admin-table-cols:${columnPrefsKey}`,
            JSON.stringify([...next]),
        );
    };

    const toggleColumn = (id: string, on: boolean) => {
        const col = columns.find((c) => c.id === id);
        if (col?.alwaysVisible) return;
        const next = new Set(visibleIds);
        if (on) next.add(id);
        else {
            next.delete(id);
            if (next.size === 0) return;
        }
        persistVisible(next);
    };

    const visibleColumns = columns.filter((c) => visibleIds.has(c.id));
    const colCount = visibleColumns.length + (renderExpanded ? 1 : 0);

    const pageRows = useMemo(() => {
        if (rows.length === total && total > pageSize) {
            const start = (page - 1) * pageSize;
            return rows.slice(start, start + pageSize);
        }
        return rows;
    }, [rows, page, pageSize, total]);

    const toggleExpand = (id: string) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    return (
        <div
            className={cn(
                'rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden w-full',
                className,
            )}
        >
            <div className="flex items-center justify-end gap-2 px-3 py-2 border-b border-slate-100 bg-slate-50/60">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="rounded-lg h-8"
                        >
                            <Columns3 className="w-3.5 h-3.5 mr-1.5" />
                            Columns
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuLabel>Show columns</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {columns.map((c) => (
                            <DropdownMenuCheckboxItem
                                key={c.id}
                                checked={visibleIds.has(c.id)}
                                disabled={c.alwaysVisible}
                                onCheckedChange={(checked) =>
                                    toggleColumn(c.id, Boolean(checked))
                                }
                            >
                                {c.header}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="overflow-x-auto max-h-[min(75vh,860px)] overflow-y-auto">
                <table
                    className="w-full text-sm border-collapse"
                    style={{ minWidth: minTableWidth }}
                >
                    <thead
                        className={cn(
                            'bg-slate-50 shadow-[0_1px_0_0_rgba(15,23,42,0.08)]',
                            stickyHeader && 'sticky top-0 z-10',
                        )}
                    >
                        <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500">
                            {renderExpanded ? (
                                <th className="w-10 px-2 py-3" aria-label="Expand" />
                            ) : null}
                            {visibleColumns.map((c) => (
                                <th
                                    key={c.id}
                                    className={cn(
                                        'px-4 py-3 font-bold whitespace-nowrap',
                                        c.align === 'right' && 'text-right',
                                        c.align === 'center' && 'text-center',
                                        c.className,
                                    )}
                                >
                                    {c.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr>
                                <td colSpan={colCount}>
                                    <AdminLoader label={loadingLabel} />
                                </td>
                            </tr>
                        ) : pageRows.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={colCount}
                                    className="px-4 py-12 text-center text-slate-500"
                                >
                                    {emptyLabel}
                                </td>
                            </tr>
                        ) : (
                            pageRows.map((row) => {
                                const id = rowKey(row);
                                const open = expandedIds.has(id);
                                return (
                                    <React.Fragment key={id}>
                                        <tr
                                            onClick={() => onRowClick?.(row)}
                                            className={cn(
                                                'hover:bg-slate-50/70 transition-colors',
                                                onRowClick && 'cursor-pointer',
                                                open && 'bg-slate-50/80',
                                            )}
                                        >
                                            {renderExpanded ? (
                                                <td className="px-2 py-3 w-10">
                                                    <button
                                                        type="button"
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200/70 hover:text-brand-dark"
                                                        aria-expanded={open}
                                                        aria-label={
                                                            open
                                                                ? 'Collapse row'
                                                                : 'Expand row'
                                                        }
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleExpand(id);
                                                        }}
                                                    >
                                                        <ChevronDown
                                                            className={cn(
                                                                'w-4 h-4 transition-transform',
                                                                open && 'rotate-180',
                                                            )}
                                                        />
                                                    </button>
                                                </td>
                                            ) : null}
                                            {visibleColumns.map((c) => (
                                                <td
                                                    key={c.id}
                                                    className={cn(
                                                        'px-4 py-3 text-slate-700',
                                                        c.align === 'right' &&
                                                            'text-right',
                                                        c.align === 'center' &&
                                                            'text-center',
                                                        c.className,
                                                    )}
                                                >
                                                    {c.cell(row) ?? <EmptyValue />}
                                                </td>
                                            ))}
                                        </tr>
                                        {renderExpanded && open ? (
                                            <tr className="bg-slate-50/90">
                                                <td
                                                    colSpan={colCount}
                                                    className="px-4 py-4 border-t border-slate-100"
                                                >
                                                    {renderExpanded(row)}
                                                </td>
                                            </tr>
                                        ) : null}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="text-xs text-slate-500">
                    {total === 0
                        ? 'No rows'
                        : `Showing ${from}–${to} of ${total}`}
                </p>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={loading || page <= 1}
                        onClick={() => onPageChange(page - 1)}
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Prev
                    </Button>
                    <span className="text-xs font-semibold text-brand-dark tabular-nums">
                        Page {page} / {totalPages}
                    </span>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={loading || page >= totalPages}
                        onClick={() => onPageChange(page + 1)}
                    >
                        Next
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

export const ADMIN_PAGE_SIZE = 10;
