'use client';

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { AdminLoader, EmptyValue } from '@/components/ui/admin-loader';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AdminColumn<T> = {
    id: string;
    header: string;
    className?: string;
    align?: 'left' | 'right' | 'center';
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
    /** Open detail when a row is clicked */
    onRowClick?: (row: T) => void;
};

/**
 * Shared admin / hotel-portal table: calendar-style sticky header,
 * brand preloader, and consistent pagination.
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
}: Props<T>) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const to = Math.min(total, page * pageSize);

    const pageRows = useMemo(() => {
        // Client-side slice when total === rows.length (full list loaded)
        if (rows.length === total && total > pageSize) {
            const start = (page - 1) * pageSize;
            return rows.slice(start, start + pageSize);
        }
        return rows;
    }, [rows, page, pageSize, total]);

    return (
        <div
            className={cn(
                'rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden',
                className,
            )}
        >
            <div className="overflow-x-auto max-h-[min(70vh,720px)] overflow-y-auto">
                <table className="w-full text-sm min-w-[720px] border-collapse">
                    <thead
                        className={cn(
                            'bg-slate-50 shadow-[0_1px_0_0_rgba(15,23,42,0.08)]',
                            stickyHeader && 'sticky top-0 z-10',
                        )}
                    >
                        <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500">
                            {columns.map((c) => (
                                <th
                                    key={c.id}
                                    className={cn(
                                        'px-4 py-3 font-bold',
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
                                <td colSpan={columns.length}>
                                    <AdminLoader label={loadingLabel} />
                                </td>
                            </tr>
                        ) : pageRows.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="px-4 py-12 text-center text-slate-500"
                                >
                                    {emptyLabel}
                                </td>
                            </tr>
                        ) : (
                            pageRows.map((row) => (
                                <tr
                                    key={rowKey(row)}
                                    onClick={() => onRowClick?.(row)}
                                    className={cn(
                                        'hover:bg-slate-50/70 transition-colors',
                                        onRowClick && 'cursor-pointer',
                                    )}
                                >
                                    {columns.map((c) => (
                                        <td
                                            key={c.id}
                                            className={cn(
                                                'px-4 py-3 text-slate-700',
                                                c.align === 'right' && 'text-right',
                                                c.align === 'center' && 'text-center',
                                                c.className,
                                            )}
                                        >
                                            {c.cell(row) ?? <EmptyValue />}
                                        </td>
                                    ))}
                                </tr>
                            ))
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
