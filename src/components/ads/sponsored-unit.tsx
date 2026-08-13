'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { AdConfig, AdTone } from '@/lib/types/ads';
import { cn } from '@/lib/utils';

const TONE: Record<
    AdTone,
    { shell: string; chip: string; cta: string }
> = {
    slate: {
        shell: 'from-white to-slate-50 border-slate-200/80',
        chip: 'bg-slate-100 text-slate-500',
        cta: 'text-slate-700',
    },
    teal: {
        shell: 'from-white to-teal-50/50 border-teal-100/90',
        chip: 'bg-teal-50 text-teal-700',
        cta: 'text-teal-700',
    },
    sand: {
        shell: 'from-white to-amber-50/40 border-amber-100/80',
        chip: 'bg-amber-50 text-amber-800',
        cta: 'text-amber-900',
    },
    sky: {
        shell: 'from-white to-sky-50/50 border-sky-100/90',
        chip: 'bg-sky-50 text-sky-700',
        cta: 'text-sky-800',
    },
};

type Props = {
    ad: AdConfig;
    compact?: boolean;
    className?: string;
};

export function SponsoredUnit({ ad, compact, className }: Props) {
    const tone = TONE[ad.tone || 'slate'];
    const inner = (
        <div
            className={cn(
                'group overflow-hidden rounded-2xl border bg-gradient-to-b shadow-sm transition-shadow hover:shadow-md',
                tone.shell,
                className,
            )}
        >
            {ad.imageUrl ? (
                <div
                    className={cn(
                        'relative overflow-hidden bg-slate-50/80',
                        compact ? 'aspect-[16/9]' : 'aspect-[4/3]',
                    )}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={ad.imageUrl}
                        alt={ad.altText}
                        className="absolute inset-0 h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                </div>
            ) : null}
            <div className={cn('space-y-1.5', compact ? 'p-3' : 'p-3.5')}>
                <span
                    className={cn(
                        'inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]',
                        tone.chip,
                    )}
                >
                    {ad.sponsor || 'Sponsored'}
                </span>
                <p
                    className={cn(
                        'font-semibold text-slate-900 dark:text-slate-100 leading-snug',
                        compact ? 'text-sm' : 'text-[15px]',
                    )}
                >
                    {ad.title || ad.altText}
                </p>
                {ad.subtitle ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                        {ad.subtitle}
                    </p>
                ) : null}
                {ad.cta ? (
                    <p
                        className={cn(
                            'inline-flex items-center gap-1 text-xs font-semibold pt-0.5',
                            tone.cta,
                        )}
                    >
                        {ad.cta}
                        <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
                    </p>
                ) : null}
            </div>
        </div>
    );

    if (!ad.linkUrl) return inner;

    const external = Boolean(ad.targetBlank);
    if (external || ad.linkUrl.startsWith('http')) {
        return (
            <a
                href={ad.linkUrl}
                target={external ? '_blank' : undefined}
                rel={external ? 'noopener noreferrer' : undefined}
                className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 rounded-2xl"
            >
                {inner}
            </a>
        );
    }

    return (
        <Link
            href={ad.linkUrl}
            className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 rounded-2xl"
        >
            {inner}
        </Link>
    );
}
