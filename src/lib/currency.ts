export function formatCurrency(amount: number, currency?: string): string {
    // Default to USD if currency is not provided or invalid
    const validCurrency = (currency === 'USD' || currency === 'ETB') ? currency : 'USD';

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: validCurrency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}
