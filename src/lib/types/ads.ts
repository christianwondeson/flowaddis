export interface AdConfig {
    id: string;
    imageUrl: string;
    altText: string;
    linkUrl?: string;
    targetBlank?: boolean;
}

export interface AdContainerProps {
    children: React.ReactNode;
    leftAds?: AdConfig[];
    rightAds?: AdConfig[];
}

export interface AdSidebarProps {
    ads: AdConfig[];
    position: 'left' | 'right';
}
