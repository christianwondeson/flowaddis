/**
 * Marketing + signup catalog for hotel SaaS plans.
 * Prices/codes align with Nest `subscription_plans` seed; features are product copy.
 */

export type BillingPlanCode = 'starter' | 'pro';

export type BillingPlanCatalogItem = {
    code: BillingPlanCode;
    name: string;
    category: string;
    tagline: string;
    priceEtb: number;
    currency: string;
    periodLabel: string;
    trialDays: number;
    highlighted?: boolean;
    features: string[];
    notIncluded?: string[];
};

export const BILLING_PLANS: BillingPlanCatalogItem[] = [
    {
        code: 'starter',
        name: 'Starter',
        category: 'Essential',
        tagline: 'Run rooms, rates, and reservations on BookAddis.',
        priceEtb: 2500,
        currency: 'ETB',
        periodLabel: '/ month',
        trialDays: 14,
        features: [
            'Hotel extranet (rooms & inventory)',
            'Daily rates & allotment calendar',
            'Photos & property profile',
            'Reservation inbox',
            'Guest messaging basics',
            'Email support',
        ],
        notIncluded: [
            'Promotions engine',
            'Shuttles & conferences',
            'Stay extras catalog',
        ],
    },
    {
        code: 'pro',
        name: 'Pro',
        category: 'Growth',
        tagline: 'Everything in Starter, plus demand tools for Ethiopian hotels.',
        priceEtb: 5500,
        currency: 'ETB',
        periodLabel: '/ month',
        trialDays: 7,
        highlighted: true,
        features: [
            'Everything in Starter',
            'Promotions & offers',
            'Airport shuttles product',
            'Conference / meeting spaces',
            'Stay extras (upsells)',
            'Priority partner support',
        ],
    },
];

export function getBillingPlan(code: string | null | undefined) {
    const normalized = String(code || '')
        .trim()
        .toLowerCase();
    return BILLING_PLANS.find((p) => p.code === normalized) || null;
}

export function isBillingPlanCode(value: string): value is BillingPlanCode {
    return BILLING_PLANS.some((p) => p.code === value);
}
