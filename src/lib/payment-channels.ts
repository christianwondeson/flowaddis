/**
 * Payment channel registry — mirrors Nest PaymentChannel enum.
 * Enable CBE Birr: NEXT_PUBLIC_CBE_BIRR_ENABLED=true
 * Enable all local banks: NEXT_PUBLIC_LOCAL_PAYMENTS_ENABLED=true
 */
export type PaymentChannelId =
    | 'stripe'
    | 'cbe_birr'
    | 'cbe_internet_banking'
    | 'cbe_ussd'
    | 'zemen_mobile'
    | 'zemen_ib'
    | 'dashen_mobile'
    | 'dashen_ib'
    | 'awash_mobile'
    | 'awash_ussd';

export interface PaymentChannelConfig {
    id: PaymentChannelId;
    labelKey: string;
    provider: 'stripe' | 'cbe' | 'zemen' | 'dashen' | 'awash';
    currency: 'USD' | 'ETB';
    logo?: string;
    /** Shown when API has not enabled this bank yet */
    requiresApiFlag?: string;
}

export const PAYMENT_CHANNELS: PaymentChannelConfig[] = [
    {
        id: 'cbe_birr',
        labelKey: 'bookingUi.payment.cbeBirr',
        provider: 'cbe',
        currency: 'ETB',
        logo: '/assets/images/branch.png',
        requiresApiFlag: 'CBE_BIRR_ENABLED',
    },
    {
        id: 'cbe_internet_banking',
        labelKey: 'bookingUi.payment.cbeInternetBanking',
        provider: 'cbe',
        currency: 'ETB',
        logo: '/assets/images/branch.png',
        requiresApiFlag: 'CBE_PAYMENTS_ENABLED',
    },
    {
        id: 'zemen_mobile',
        labelKey: 'bookingUi.payment.zemenMobile',
        provider: 'zemen',
        currency: 'ETB',
        requiresApiFlag: 'ZEMEN_PAYMENTS_ENABLED',
    },
    {
        id: 'dashen_mobile',
        labelKey: 'bookingUi.payment.dashenMobile',
        provider: 'dashen',
        currency: 'ETB',
        requiresApiFlag: 'DASHEN_PAYMENTS_ENABLED',
    },
    {
        id: 'awash_mobile',
        labelKey: 'bookingUi.payment.awashMobile',
        provider: 'awash',
        currency: 'ETB',
        requiresApiFlag: 'AWASH_PAYMENTS_ENABLED',
    },
    {
        id: 'stripe',
        labelKey: 'bookingUi.payment.internationalCards',
        provider: 'stripe',
        currency: 'USD',
    },
];

export function isLocalPaymentChannel(id: PaymentChannelId): boolean {
    return id !== 'stripe';
}

const CBE_BIRR_ENABLED = process.env.NEXT_PUBLIC_CBE_BIRR_ENABLED === 'true';
const ALL_LOCAL_BANKS_ENABLED = process.env.NEXT_PUBLIC_LOCAL_PAYMENTS_ENABLED === 'true';

/** Channels shown on checkout when paying in ETB locally. */
export function getCheckoutLocalChannels(): PaymentChannelConfig[] {
    if (ALL_LOCAL_BANKS_ENABLED) {
        return PAYMENT_CHANNELS.filter((c) => c.id !== 'stripe');
    }
    if (CBE_BIRR_ENABLED) {
        return PAYMENT_CHANNELS.filter((c) => c.id === 'cbe_birr');
    }
    return [];
}

export function isCbeBirrCheckoutEnabled(): boolean {
    return CBE_BIRR_ENABLED || ALL_LOCAL_BANKS_ENABLED;
}
