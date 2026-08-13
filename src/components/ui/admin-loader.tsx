'use client';

import { Preloader } from '@/components/ui/preloader';

/** Inline advanced loader for admin panels (replaces plain “Loading…” text). */
export function AdminLoader({
    label = 'Loading',
    className,
}: {
    label?: string;
    className?: string;
}) {
    return (
        <div
            className={
                className ||
                'flex min-h-[160px] flex-col items-center justify-center py-10'
            }
        >
            <Preloader size="md" label={label} />
        </div>
    );
}

/** Friendly empty cell  never use generic "--". */
export function EmptyValue({ children = 'Not set' }: { children?: string }) {
    return <span className="text-slate-400">{children}</span>;
}
