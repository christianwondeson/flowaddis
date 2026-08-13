import type { ReactNode } from 'react';

export type AdTone = 'slate' | 'teal' | 'sand' | 'sky';

export interface AdConfig {
    id: string;
    /** Short sponsor line  shown as muted “Sponsored”. */
    sponsor?: string;
    /** Prefer title; falls back to altText. */
    title?: string;
    subtitle?: string;
    cta?: string;
    imageUrl?: string;
    altText: string;
    linkUrl?: string;
    targetBlank?: boolean;
    tone?: AdTone;
}

export interface AdContainerProps {
    children: ReactNode;
    leftAds?: AdConfig[];
    rightAds?: AdConfig[];
    /**
     * Full-bleed page hero (title band). Renders above ad rails so the
     * fixed site header never clips it, and ads don’t squeeze the banner.
     */
    header?: ReactNode;
    /** Extra classes on the main content column. */
    contentClassName?: string;
    /** Clear fixed navbar (default true). */
    clearFixedHeader?: boolean;
}

export interface AdSidebarProps {
    ads: AdConfig[];
    position: 'left' | 'right';
}
