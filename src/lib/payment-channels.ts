/**
 * Payment channel registry — mirrors Nest PaymentChannel enum.
 * Enable via NEXT_PUBLIC_LOCAL_PAYMENTS_ENABLED and per-bank flags on the API.
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
    /** Brand accent (hex) used to theme the bank's checkout panel. Lets the same
     *  phone/USSD flow be reused per bank by swapping only the color. */
    accentColor?: string;
    /** Shown when API has not enabled this bank yet */
    requiresApiFlag?: string;
}

export const PAYMENT_CHANNELS: PaymentChannelConfig[] = [
    {
        id: 'cbe_birr',
        labelKey: 'bookingUi.payment.cbeBirr',
        provider: 'cbe',
        currency: 'ETB',
        logo: '/assets/images/cbebirr.jpg',
        accentColor: '#006838',
        requiresApiFlag: 'CBE_PAYMENTS_ENABLED',
    },
    // NOTE: Additional Ethiopian rails are temporarily disabled — only CBE Birr is live.
    // Re-enable by uncommenting; each reuses the same phone/USSD checkout flow, themed by `accentColor`.
    // {
    //     id: 'cbe_internet_banking',
    //     labelKey: 'bookingUi.payment.cbeInternetBanking',
    //     provider: 'cbe',
    //     currency: 'ETB',
    //     logo: '/assets/images/branch.png',
    //     accentColor: '#006838',
    //     requiresApiFlag: 'CBE_PAYMENTS_ENABLED',
    // },
    // {
    //     id: 'zemen_mobile',
    //     labelKey: 'bookingUi.payment.zemenMobile',
    //     provider: 'zemen',
    //     currency: 'ETB',
    //     accentColor: '#0a4ea2',
    //     requiresApiFlag: 'ZEMEN_PAYMENTS_ENABLED',
    // },
    // {
    //     id: 'dashen_mobile',
    //     labelKey: 'bookingUi.payment.dashenMobile',
    //     provider: 'dashen',
    //     currency: 'ETB',
    //     accentColor: '#0072bc',
    //     requiresApiFlag: 'DASHEN_PAYMENTS_ENABLED',
    // },
    // {
    //     id: 'awash_mobile',
    //     labelKey: 'bookingUi.payment.awashMobile',
    //     provider: 'awash',
    //     currency: 'ETB',
    //     accentColor: '#e98300',
    //     requiresApiFlag: 'AWASH_PAYMENTS_ENABLED',
    // },
    {
        id: 'stripe',
        labelKey: 'bookingUi.payment.stripeCard',
        provider: 'stripe',
        currency: 'USD',
    },
];

export function isLocalPaymentChannel(id: PaymentChannelId): boolean {
    return id !== 'stripe';
}
